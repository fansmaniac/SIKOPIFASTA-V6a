// src/hooks/useAssets.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listAssetsByCategory,
  upsertAsset,
  softDeleteAsset,
  // getAssetById, // opsional kalau nanti butuh detail
} from "../services/assets.service";

export function useAssets(initialCategory = "vehicle") {
  const [category, setCategory] = useState(initialCategory);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false); // untuk aksi simpan/hapus

  const reload = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await listAssetsByCategory(category);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Gagal memuat data assets.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  // auto load ketika category berubah
  useEffect(() => {
    let alive = true;

    (async () => {
      setError("");
      setLoading(true);
      try {
        const data = await listAssetsByCategory(category);
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Gagal memuat data assets.");
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [category]);

  // simpan (tambah/edit)
  const saveAsset = useCallback(async (payload) => {
    setError("");
    setBusy(true);
    try {
      await upsertAsset(payload);
      await reload();
      return true;
    } catch (e) {
      setError(e?.message || "Gagal menyimpan asset.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [reload]);

  // hapus (soft delete)
  const removeAsset = useCallback(async (assetId) => {
    if (!assetId) return false;
    setError("");
    setBusy(true);
    try {
      await softDeleteAsset(assetId);
      await reload();
      return true;
    } catch (e) {
      setError(e?.message || "Gagal menghapus asset.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [reload]);

  const api = useMemo(() => {
    return {
      // state
      category,
      rows,
      loading,
      busy,
      error,

      // actions
      setCategory,
      reload,
      saveAsset,
      removeAsset,
    };
  }, [category, rows, loading, busy, error, reload, saveAsset, removeAsset]);

  return api;
}
