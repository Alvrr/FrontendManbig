import React, { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/Card";
import { getAllProduk } from "../services/produkAPI";
import { getAllStok } from "../services/stokAPI";
import { getKategori } from "../services/kategoriAPI";

const GudangDashboard = () => {
  const [produkCount, setProdukCount] = useState(0);
  const [stokList, setStokList] = useState([]);
  const [kategoriCount, setKategoriCount] = useState(0);
  const lowThreshold = 10;
  const lowCount = stokList.filter(s => Number(s.jumlah) < lowThreshold).length;

  useEffect(() => {
    (async () => {
      try {
        const produk = await getAllProduk();
        setProdukCount(Array.isArray(produk) ? produk.length : 0);
      } catch {}
      try {
        const kategori = await getKategori();
        setKategoriCount(Array.isArray(kategori) ? kategori.length : 0);
      } catch {}
      try {
        const stok = await getAllStok();
        setStokList(Array.isArray(stok) ? stok : []);
      } catch {}
    })();
  }, []);
  return (
    <PageWrapper
      title="Dashboard Gudang"
      description="Kelola produk dan stok di gudang"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Total Produk</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold">{produkCount}</p>
            <a href="/produk" className="text-sm text-blue-600 hover:underline">Kelola</a>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Item Stok</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold">{stokList.length}</p>
            <a href="/stok" className="text-sm text-blue-600 hover:underline">Kelola</a>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Total Kategori</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold">{kategoriCount}</p>
            <a href="/kategori" className="text-sm text-blue-600 hover:underline">Kelola</a>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500">Stok Rendah (&lt; {lowThreshold})</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold text-red-600">{lowCount}</p>
            <a href={`/stok?low=1&threshold=${lowThreshold}`} className="text-sm text-blue-600 hover:underline">Lihat detail</a>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Aksi Cepat</h3>
          <div className="flex gap-3 flex-wrap">
            <a href="/produk" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Kelola Produk</a>
            <a href="/stok" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Kelola Stok</a>
            <a href="/kategori" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">Kelola Kategori</a>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-2">Info</h3>
          <p className="text-gray-700">Halaman ini untuk role gudang. Akses mencakup manajemen produk, stok, dan kategori sesuai aturan hak akses.</p>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default GudangDashboard;
