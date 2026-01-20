    import { useEffect, useMemo, useState } from 'react'
    import { useNavigate } from 'react-router-dom'
    import { CardGlass } from '../components/Card'
    import { useAuth } from '../hooks/useAuth'
    import { getAllProduk } from '../services/produkAPI'
    import { getSaldoProduk, listMutasi } from '../services/stokAPI'
    import { getBestSellers } from '../services/laporanAPI'
    import {
    CubeIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    ClipboardDocumentListIcon,
    ArrowTrendingUpIcon
    } from '@heroicons/react/24/outline'

    const STOCK_CRITICAL_THRESHOLD = 5
    const LATEST_MUTASI_LIMIT = 10
    const SHOW_BEST_SELLERS = true

    const toStartOfDayISO = (d) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x.toISOString()
    }

    const toEndOfDayISO = (d) => {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x.toISOString()
    }

    const toStartOfMonthISO = (d) => {
    const x = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
    return x.toISOString()
    }

    const toEndOfMonthISO = (d) => {
    const x = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    return x.toISOString()
    }

    const formatDateTime = (ts) => {
    if (!ts) return '-'
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return String(ts)
    return d.toLocaleString('id-ID')
    }

    const DashboardGudang = () => {
    const navigate = useNavigate()
    const { user, authKey } = useAuth()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [produk, setProduk] = useState([])
    const [saldoByProduk, setSaldoByProduk] = useState({})

    const [mutasiLatest, setMutasiLatest] = useState([])
    const [mutasiTodayCount, setMutasiTodayCount] = useState(0)
    const [mutasiMonthCount, setMutasiMonthCount] = useState(0)

    const [bestSellers, setBestSellers] = useState([])

    const produkById = useMemo(() => {
        const map = new Map()
        ;(Array.isArray(produk) ? produk : []).forEach((p) => {
        if (p?._id) map.set(p._id, p)
        })
        return map
    }, [produk])

    const criticalProduk = useMemo(() => {
        const list = Array.isArray(produk) ? produk : []
        return list
        .map((p) => {
            const saldo = Number(saldoByProduk[p?._id] ?? 0)
            return { ...p, _saldo: saldo }
        })
        .filter((p) => p?._id && Number.isFinite(p._saldo) && p._saldo <= STOCK_CRITICAL_THRESHOLD)
        .sort((a, b) => a._saldo - b._saldo)
    }, [produk, saldoByProduk])

    useEffect(() => {
        // Validasi role dari auth context (UX guard tambahan)
        if (user?.role && user.role !== 'gudang') {
        navigate('/dashboard', { replace: true })
        }
    }, [user?.role, navigate])

    useEffect(() => {
        if (!user?.role) return
        if (user.role !== 'gudang') return

        let isCancelled = false

        const fetchGudang = async () => {
        setLoading(true)
        setError('')
        try {
            const now = new Date()
            const startToday = toStartOfDayISO(now)
            const endToday = toEndOfDayISO(now)
            const startMonth = toStartOfMonthISO(now)
            const endMonth = toEndOfMonthISO(now)

            const [produkList, mutasiLatestList, mutasiTodayList, mutasiMonthList, bestSellerList] = await Promise.all([
            getAllProduk().catch(() => []),
            listMutasi({ sort: 'desc', page: 1, page_size: LATEST_MUTASI_LIMIT }).catch(() => []),
            listMutasi({ start: startToday, end: endToday }).catch(() => []),
            listMutasi({ start: startMonth, end: endMonth }).catch(() => []),
            SHOW_BEST_SELLERS ? getBestSellers(30).catch(() => []) : Promise.resolve([])
            ])

            if (isCancelled) return

            const safeProduk = Array.isArray(produkList) ? produkList : []
            setProduk(safeProduk)
            setMutasiLatest(Array.isArray(mutasiLatestList) ? mutasiLatestList : [])
            setMutasiTodayCount(Array.isArray(mutasiTodayList) ? mutasiTodayList.length : 0)
            setMutasiMonthCount(Array.isArray(mutasiMonthList) ? mutasiMonthList.length : 0)
            setBestSellers(Array.isArray(bestSellerList) ? bestSellerList : [])

            // Hitung saldo tiap produk untuk stok kritis
            const saldoPairs = await Promise.all(
            safeProduk.map(async (p) => {
                const id = p?._id
                if (!id) return [null, 0]
                try {
                const s = await getSaldoProduk(id)
                return [id, Number(s?.saldo ?? 0)]
                } catch {
                return [id, 0]
                }
            })
            )

            if (isCancelled) return

            const nextMap = {}
            saldoPairs.forEach(([id, saldo]) => {
            if (id) nextMap[id] = Number.isFinite(saldo) ? saldo : 0
            })
            setSaldoByProduk(nextMap)
        } catch (e) {
            if (!isCancelled) {
            setError(e?.response?.data?.message || e?.message || 'Gagal memuat dashboard gudang')
            }
        } finally {
            if (!isCancelled) setLoading(false)
        }
        }

        fetchGudang()
        return () => {
        isCancelled = true
        }
    }, [user?.role, authKey])

    const totalProduk = Array.isArray(produk) ? produk.length : 0

    return (
        <div className="space-y-6 text-white">
        <div className="flex justify-between items-center mb-8">
            <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard Gudang</h1>
            <p className="text-white/80">Ringkasan stok dan mutasi persediaan (tanpa data keuangan)</p>
            </div>
        </div>

        {error && (
            <CardGlass>
            <p className="text-white">{error}</p>
            </CardGlass>
        )}

        {loading && !error && (
            <CardGlass>
            <p className="text-white/80">Memuat data dashboard gudang...</p>
            </CardGlass>
        )}

        {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <CardGlass>
                <div className="flex items-center gap-3">
                <div className="bg-white/10 p-3 rounded-lg"><CubeIcon className="w-6 h-6 text-white" /></div>
                <div>
                    <p className="text-sm text-white/80">Total Produk</p>
                    <p className="text-xl font-semibold text-white">{totalProduk}</p>
                </div>
                </div>
            </CardGlass>

            <CardGlass>
                <div className="flex items-center gap-3">
                <div className="bg-white/10 p-3 rounded-lg"><ExclamationTriangleIcon className="w-6 h-6 text-white" /></div>
                <div>
                    <p className="text-sm text-white/80">Produk Stok Kritis</p>
                    <p className="text-xl font-semibold text-white">{criticalProduk.length}</p>
                    <p className="text-xs text-white/60">Stok ≤ {STOCK_CRITICAL_THRESHOLD}</p>
                </div>
                </div>
            </CardGlass>

            <CardGlass>
                <div className="flex items-center gap-3">
                <div className="bg-white/10 p-3 rounded-lg"><ArrowPathIcon className="w-6 h-6 text-white" /></div>
                <div>
                    <p className="text-sm text-white/80">Update Stok Hari Ini</p>
                    <p className="text-xl font-semibold text-white">{mutasiTodayCount}</p>
                </div>
                </div>
            </CardGlass>

            <CardGlass>
                <div className="flex items-center gap-3">
                <div className="bg-white/10 p-3 rounded-lg"><ClipboardDocumentListIcon className="w-6 h-6 text-white" /></div>
                <div>
                    <p className="text-sm text-white/80">Mutasi Bulan Ini</p>
                    <p className="text-xl font-semibold text-white">{mutasiMonthCount}</p>
                </div>
                </div>
            </CardGlass>
            </div>
        )}

        {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardGlass>
                <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">Produk Stok Kritis</h2>
                    <p className="text-sm text-white/70">Read-only</p>
                </div>
                <button
                    onClick={() => navigate('/stok')}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition"
                >
                    Lihat Stok
                </button>
                </div>

                {criticalProduk.length === 0 ? (
                <div className="text-center py-10">
                    <ExclamationTriangleIcon className="w-12 h-12 text-white/60 mx-auto mb-3" />
                    <p className="text-white/70">Tidak ada produk dengan stok kritis</p>
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-white/70 border-b border-white/10">
                        <th className="text-left py-2 pr-3">Produk</th>
                        <th className="text-right py-2 px-3">Stok</th>
                        </tr>
                    </thead>
                    <tbody>
                        {criticalProduk.slice(0, 10).map((p) => (
                        <tr key={p._id} className="border-b border-white/5">
                            <td className="py-2 pr-3">
                            <div className="font-medium text-white/90">{p?.nama || p?._id}</div>
                            <div className="text-xs text-white/60">ID: {p?._id}</div>
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-white">{p._saldo}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    {criticalProduk.length > 10 && (
                    <p className="text-xs text-white/60 mt-3">Menampilkan 10 teratas (stok paling kecil)</p>
                    )}
                </div>
                )}
            </CardGlass>

            <CardGlass>
                <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">Mutasi Stok Terbaru</h2>
                    <p className="text-sm text-white/70">{LATEST_MUTASI_LIMIT} data terbaru</p>
                </div>
                </div>

                {(!Array.isArray(mutasiLatest) || mutasiLatest.length === 0) ? (
                <div className="text-center py-10">
                    <ClipboardDocumentListIcon className="w-12 h-12 text-white/60 mx-auto mb-3" />
                    <p className="text-white/70">Belum ada mutasi stok</p>
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-white/70 border-b border-white/10">
                        <th className="text-left py-2 pr-3">Produk</th>
                        <th className="text-left py-2 px-3">Jenis</th>
                        <th className="text-right py-2 px-3">Jumlah</th>
                        <th className="text-left py-2 px-3">Tanggal</th>
                        <th className="text-left py-2 pl-3">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mutasiLatest.slice(0, LATEST_MUTASI_LIMIT).map((m, idx) => {
                        const p = produkById.get(m?.produk_id)
                        return (
                            <tr key={m?._id || m?.id || `${m?.produk_id}-${idx}`} className="border-b border-white/5">
                            <td className="py-2 pr-3">
                                <div className="font-medium text-white/90">{p?.nama || m?.produk_id || '-'}</div>
                                <div className="text-xs text-white/60">{m?.produk_id ? `ID: ${m.produk_id}` : ''}</div>
                            </td>
                            <td className="py-2 px-3 text-white/90">{m?.jenis || '-'}</td>
                            <td className="py-2 px-3 text-right font-semibold text-white">{Number(m?.jumlah || 0)}</td>
                            <td className="py-2 px-3 text-white/80">{formatDateTime(m?.created_at)}</td>
                            <td className="py-2 pl-3 text-white/80">{m?.keterangan || '-'}</td>
                            </tr>
                        )
                        })}
                    </tbody>
                    </table>
                </div>
                )}
            </CardGlass>
            </div>
        )}

        {!loading && !error && SHOW_BEST_SELLERS && (
            <CardGlass>
            <div className="flex items-center justify-between mb-4">
                <div>
                <h2 className="text-lg font-semibold text-white">Produk Terlaris (Opsional)</h2>
                <p className="text-sm text-white/70">Menampilkan jumlah item saja (tanpa nilai uang)</p>
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-white/60" />
            </div>

            {(!Array.isArray(bestSellers) || bestSellers.length === 0) ? (
                <div className="text-center py-8">
                <ArrowTrendingUpIcon className="w-12 h-12 text-white/60 mx-auto mb-3" />
                <p className="text-white/70">Tidak ada data produk terlaris</p>
                </div>
            ) : (
                <div className="space-y-3">
                {bestSellers.slice(0, 5).map((p, index) => (
                    <div key={p?.produk_id || p?.nama || index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-white/90">{p?.nama || '-'}</span>
                    </div>
                    <span className="text-sm font-semibold text-white/90">{Number(p?.jumlah || 0)}</span>
                    </div>
                ))}
                </div>
            )}
            </CardGlass>
        )}
        </div>
    )
    }

    export default DashboardGudang
