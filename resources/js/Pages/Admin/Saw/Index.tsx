import { Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../Layout';

type Criteria = {
    id: number;
    code: string;
    name: string;
    type: string;
    weight: number;
    sort_order: number;
};

type RankItem = {
    id: number;
    uuid: string;
    title: string;
    priority: string;
    status: string;
    category: string | null;
    reporter: string | null;
    assignee: string | null;
    saw_score: number;
    sla_deadline: string | null;
    created_at: string | null;
};

type Props = {
    criteria: Criteria[];
    ranking: RankItem[];
    totalWeight: number;
};

const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };
const statusLabel: Record<string, string> = { open: 'Menunggu', in_progress: 'Diproses', resolved: 'Selesai', closed: 'Ditutup', cancelled: 'Dibatalkan' };

const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
        critical: 'bg-rose-50 text-rose-700',
        high: 'bg-orange-50 text-orange-700',
        medium: 'bg-amber-50 text-amber-700',
        low: 'bg-green-50 text-green-700',
    };
    return map[priority] ?? 'bg-slate-100 text-slate-600';
};

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        open: 'bg-blue-50 text-blue-700',
        in_progress: 'bg-orange-50 text-orange-700',
        resolved: 'bg-emerald-50 text-emerald-700',
        closed: 'bg-slate-100 text-slate-600',
        cancelled: 'bg-rose-50 text-rose-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
};

export default function SawIndex({ criteria, ranking, totalWeight }: Props) {
    const [weights, setWeights] = useState<Record<string, number>>(() => {
        const w: Record<string, number> = {};
        criteria.forEach((c) => { w[c.code] = c.weight; });
        return w;
    });

    const { put } = useForm();
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    const handleWeightChange = (code: string, value: number) => {
        setWeights((prev) => ({ ...prev, [code]: value }));
    };

    const currentTotal = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const isValid = Math.abs(currentTotal - 1.0) < 0.001;

    const handleSave = () => {
        put('/admin/saw/weights', { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-900">SAW — Prioritas Otomatis Tiket</h1>
                <p className="text-sm text-slate-500">Simple Additive Weighting untuk menentukan prioritas pengerjaan tiket</p>
            </div>

            {flash.success && (
                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}
            {flash.error && (
                <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{flash.error}</div>
            )}

            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Konfigurasi Bobot Kriteria</h2>
                <p className="mb-4 text-xs text-slate-500">Total bobot harus = 1.0. Benefit: semakin tinggi nilai, prioritas naik. Cost: semakin rendah nilai, prioritas naik.</p>

                <div className="mb-4 space-y-3">
                    {criteria.map((c) => (
                        <div key={c.id} className="flex items-center gap-4">
                            <div className="w-32">
                                <span className="text-sm font-medium text-slate-700">{c.code}</span>
                                <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${c.type === 'benefit' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{c.type}</span>
                            </div>
                            <div className="flex-1">
                                <p className="mb-1 text-xs text-slate-600">{c.name}</p>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={weights[c.code]}
                                    onChange={(e) => handleWeightChange(c.code, parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div className="w-16 text-right">
                                <span className="text-sm font-semibold text-slate-900">{weights[c.code].toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                        <span className="text-sm text-slate-600">Total Bobot: </span>
                        <span className={`text-sm font-bold ${isValid ? 'text-emerald-600' : 'text-rose-600'}`}>{currentTotal.toFixed(2)}</span>
                        {!isValid && <span className="ml-2 text-xs text-rose-500">(harus = 1.00)</span>}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <button type="submit" disabled={!isValid} className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${isValid ? 'bg-teal-600 hover:bg-teal-700' : 'cursor-not-allowed bg-slate-300'}`}>
                            Simpan Bobot
                        </button>
                    </form>
                </div>
            </div>

            {ranking.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Ranking Prioritas Tiket (Open & In Progress)</h2>
                        <span className="text-xs text-slate-400">{ranking.length} tiket</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="border-b border-slate-200 text-left text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-medium">#</th>
                                    <th className="px-5 py-3 font-medium">Tiket</th>
                                    <th className="px-5 py-3 font-medium">Prioritas</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Pelapor</th>
                                    <th className="px-5 py-3 font-medium">Staff</th>
                                    <th className="px-5 py-3 font-medium">Skor SAW</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((item, i) => (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                                        <td className="px-5 py-3">
                                            <Link href={`/admin/tickets/${item.id}`} className="font-medium text-slate-900 hover:underline">{item.title}</Link>
                                            <p className="text-xs text-slate-400">#{item.uuid?.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge(item.priority)}`}>{priorityLabel[item.priority] ?? item.priority}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(item.status)}`}>{statusLabel[item.status] ?? item.status}</span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{item.reporter ?? '-'}</td>
                                        <td className="px-5 py-3 text-slate-600">{item.assignee ?? 'Belum'}</td>
                                        <td className="px-5 py-3">
                                            <span className="rounded bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">{item.saw_score.toFixed(4)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {ranking.length === 0 && criteria.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
                    <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '48px' }}>analytics</span>
                    <p className="mt-2 text-sm text-slate-400">Tidak ada tiket berstatus open/in_progress untuk dianalisis.</p>
                </div>
            )}
        </AdminLayout>
    );
}
