// src/services/loans.service.js
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { ASSET_STATUS, LOAN_STATUS } from "../utils/constants";

const LOANS_COL = "loans";
const ASSETS_COL = "assets";

/**
 * =========================
 * HELPERS
 * =========================
 */

function cleanStr(v) {
  return String(v ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function toDateOrNull(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * =========================
 * USER: REQUEST LOAN
 * =========================
 * Buat pengajuan pinjaman untuk suatu asset.
 * Rules:
 * - asset harus ACTIVE & AVAILABLE
 * - asset akan ditandai status = requested + activeLoanId = <loanId>
 */
export async function requestLoan({
  assetId,
  userUid,
  purpose,
  startDate, // optional (string/date)
  dueDate,   // optional (string/date)
}) {
  if (!assetId) throw new Error("assetId wajib ada.");
  if (!userUid) throw new Error("userUid wajib ada.");

  const assetRef = doc(db, ASSETS_COL, assetId);

  // 1) Buat loan doc terlebih dulu (biar dapat id)
  const loanRef = await addDoc(collection(db, LOANS_COL), {
    assetId,
    userUid,
    purpose: cleanStr(purpose),
    status: LOAN_STATUS.REQUESTED,
    requestedAt: serverTimestamp(),
    startAt: toDateOrNull(startDate) || null,
    dueAt: toDateOrNull(dueDate) || null,

    // audit
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const loanId = loanRef.id;

  // 2) Transaction: lock asset agar tidak direquest orang lain
  await runTransaction(db, async (tx) => {
    const assetSnap = await tx.get(assetRef);
    if (!assetSnap.exists()) {
      throw new Error("Asset tidak ditemukan.");
    }

    const asset = assetSnap.data();

    if (asset.isActive === false) {
      throw new Error("Asset nonaktif dan tidak bisa dipinjam.");
    }

    if (asset.status !== ASSET_STATUS.AVAILABLE) {
      throw new Error("Asset sedang tidak tersedia.");
    }

    // set asset jadi requested
    tx.update(assetRef, {
      status: LOAN_STATUS.REQUESTED, // boleh juga pakai ASSET_STATUS khusus, tapi kita keep konsisten
      // NOTE: asset.status sebaiknya pakai ASSET_STATUS. Kita set ke BORROWED/AVAILABLE/MAINTENANCE.
      // Untuk "requested", kita set ke borrowed? Tidak tepat.
      // Solusi: set asset.status = borrowed hanya saat serah-terima.
      // Jadi di sini: kita pakai flag activeLoanId + keep status AVAILABLE.
      // Namun agar admin tahu sedang diajukan, kita tambahkan field "reservationStatus".
    });

    // Perbaikan desain: jangan pakai asset.status = requested.
    // Kita simpan "activeLoanId" dan "reservedStatus" untuk menandai diajukan.
    tx.update(assetRef, {
      activeLoanId: loanId,
      reservedStatus: LOAN_STATUS.REQUESTED, // request pending
      updatedAt: serverTimestamp(),
    });

    // Update loan doc untuk simpan snapshot minimal asset (opsional)
    tx.update(doc(db, LOANS_COL, loanId), {
      updatedAt: serverTimestamp(),
    });
  });

  return { id: loanId, assetId, userUid, status: LOAN_STATUS.REQUESTED };
}

/**
 * =========================
 * ADMIN: APPROVE / REJECT
 * =========================
 */

export async function approveLoan({
  loanId,
  adminUid,
  note,
  dueDate, // optional
}) {
  if (!loanId) throw new Error("loanId wajib ada.");
  if (!adminUid) throw new Error("adminUid wajib ada.");

  const loanRef = doc(db, LOANS_COL, loanId);

  await runTransaction(db, async (tx) => {
    const loanSnap = await tx.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Data pinjaman tidak ditemukan.");

    const loan = loanSnap.data();
    if (loan.status !== LOAN_STATUS.REQUESTED) {
      throw new Error("Pinjaman tidak dalam status 'diajukan'.");
    }

    const assetRef = doc(db, ASSETS_COL, loan.assetId);
    const assetSnap = await tx.get(assetRef);
    if (!assetSnap.exists()) throw new Error("Asset tidak ditemukan.");

    const asset = assetSnap.data();
    if (asset.isActive === false) throw new Error("Asset nonaktif.");

    // Pastikan asset masih terkunci oleh loan ini
    if (asset.activeLoanId !== loanId || asset.reservedStatus !== LOAN_STATUS.REQUESTED) {
      throw new Error("Asset sudah diproses pinjaman lain / tidak terkunci untuk loan ini.");
    }

    tx.update(loanRef, {
      status: LOAN_STATUS.APPROVED,
      approvedAt: serverTimestamp(),
      approvedBy: adminUid,
      adminNote: cleanStr(note),
      dueAt: toDateOrNull(dueDate) || loan.dueAt || null,
      updatedAt: serverTimestamp(),
    });

    tx.update(assetRef, {
      reservedStatus: LOAN_STATUS.APPROVED,
      updatedAt: serverTimestamp(),
    });
  });

  return true;
}

export async function rejectLoan({
  loanId,
  adminUid,
  note,
}) {
  if (!loanId) throw new Error("loanId wajib ada.");
  if (!adminUid) throw new Error("adminUid wajib ada.");

  const loanRef = doc(db, LOANS_COL, loanId);

  await runTransaction(db, async (tx) => {
    const loanSnap = await tx.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Data pinjaman tidak ditemukan.");

    const loan = loanSnap.data();
    if (loan.status !== LOAN_STATUS.REQUESTED) {
      throw new Error("Pinjaman tidak dalam status 'diajukan'.");
    }

    const assetRef = doc(db, ASSETS_COL, loan.assetId);
    const assetSnap = await tx.get(assetRef);
    if (!assetSnap.exists()) throw new Error("Asset tidak ditemukan.");

    const asset = assetSnap.data();

    // Pastikan lock masih milik loan ini
    if (asset.activeLoanId !== loanId) {
      throw new Error("Asset sudah diproses pinjaman lain.");
    }

    // Update loan
    tx.update(loanRef, {
      status: LOAN_STATUS.REJECTED,
      rejectedAt: serverTimestamp(),
      rejectedBy: adminUid,
      adminNote: cleanStr(note),
      updatedAt: serverTimestamp(),
    });

    // Lepaskan lock di asset
    tx.update(assetRef, {
      activeLoanId: null,
      reservedStatus: null,
      updatedAt: serverTimestamp(),
    });
  });

  return true;
}

/**
 * =========================
 * ADMIN/OPERATOR: SERAH-TERIMA (BORROWED)
 * =========================
 * Setelah approve, saat barang benar-benar diambil, set BORROWED.
 * Ini yang mengubah asset.status jadi BORROWED.
 */
export async function markBorrowed({
  loanId,
  adminUid,
  note,
  startDate, // optional
}) {
  if (!loanId) throw new Error("loanId wajib ada.");
  if (!adminUid) throw new Error("adminUid wajib ada.");

  const loanRef = doc(db, LOANS_COL, loanId);

  await runTransaction(db, async (tx) => {
    const loanSnap = await tx.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Data pinjaman tidak ditemukan.");

    const loan = loanSnap.data();
    if (![LOAN_STATUS.APPROVED].includes(loan.status)) {
      throw new Error("Pinjaman harus berstatus 'disetujui' sebelum serah-terima.");
    }

    const assetRef = doc(db, ASSETS_COL, loan.assetId);
    const assetSnap = await tx.get(assetRef);
    if (!assetSnap.exists()) throw new Error("Asset tidak ditemukan.");

    const asset = assetSnap.data();
    if (asset.activeLoanId !== loanId) throw new Error("Asset tidak terkunci untuk loan ini.");

    tx.update(loanRef, {
      status: LOAN_STATUS.BORROWED,
      borrowedAt: serverTimestamp(),
      borrowedBy: adminUid,
      operatorNote: cleanStr(note),
      startAt: toDateOrNull(startDate) || loan.startAt || null,
      updatedAt: serverTimestamp(),
    });

    tx.update(assetRef, {
      status: ASSET_STATUS.BORROWED,
      reservedStatus: LOAN_STATUS.BORROWED,
      updatedAt: serverTimestamp(),
    });
  });

  return true;
}

/**
 * =========================
 * RETURN (PENGEMBALIAN)
 * =========================
 * Set loan RETURNED, lepaskan lock, set asset AVAILABLE.
 */
export async function returnLoan({
  loanId,
  adminUid,
  note,
}) {
  if (!loanId) throw new Error("loanId wajib ada.");

  const loanRef = doc(db, LOANS_COL, loanId);

  await runTransaction(db, async (tx) => {
    const loanSnap = await tx.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Data pinjaman tidak ditemukan.");

    const loan = loanSnap.data();
    if (![LOAN_STATUS.BORROWED, LOAN_STATUS.LATE].includes(loan.status)) {
      throw new Error("Hanya pinjaman yang sedang dipinjam yang bisa dikembalikan.");
    }

    const assetRef = doc(db, ASSETS_COL, loan.assetId);
    const assetSnap = await tx.get(assetRef);
    if (!assetSnap.exists()) throw new Error("Asset tidak ditemukan.");

    const asset = assetSnap.data();
    if (asset.activeLoanId !== loanId) throw new Error("Asset tidak terkunci untuk loan ini.");

    tx.update(loanRef, {
      status: LOAN_STATUS.RETURNED,
      returnedAt: serverTimestamp(),
      returnedBy: adminUid || null,
      returnNote: cleanStr(note),
      updatedAt: serverTimestamp(),
    });

    tx.update(assetRef, {
      status: ASSET_STATUS.AVAILABLE,
      activeLoanId: null,
      reservedStatus: null,
      updatedAt: serverTimestamp(),
    });
  });

  return true;
}

/**
 * =========================
 * QUERIES (READ)
 * =========================
 */

export async function getLoansByUser(userUid) {
  const q = query(
    collection(db, LOANS_COL),
    where("userUid", "==", userUid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPendingLoans() {
  const q = query(
    collection(db, LOANS_COL),
    where("status", "==", LOAN_STATUS.REQUESTED),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getActiveLoans() {
  const q = query(
    collection(db, LOANS_COL),
    where("status", "in", [LOAN_STATUS.APPROVED, LOAN_STATUS.BORROWED, LOAN_STATUS.LATE]),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Ambil detail 1 loan
 */
export async function getLoanById(loanId) {
  const snap = await getDoc(doc(db, LOANS_COL, loanId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
