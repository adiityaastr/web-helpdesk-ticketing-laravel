import { Link } from '@inertiajs/react';
import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    Tooltip,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import AdminLayout from './Layout';

ChartJS.register(ArcElement, Tooltip, Legend);

type TicketSummary = {
    id: number;
    uuid: string;
    title: string;
    status: string;
    priority: string;
    category: string | null;
    reporter: string | null;
    assignee: string | null;
    created_at: string | null;
};

type StaffWorkload = {
    id: number;
    name: string;
    assigned_count: number;
};

type Props = {
    stats: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
        overdue: number;
    };
    priorityChart: { labels: string[]; values: number[] };
    statusChart: { labels: string[]; values: number[] };
    recentTickets: TicketSummary[];
    staffWorkload: StaffWorkload[];
};

const statusColors: Record<string, string> = {
    open: '#3b82f6',
    in_progress: '#f59e0b',
    resolved: '#10b981',
    closed: '#64748b',
    cancelled: '#f43f5e',
};

const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
};

const statusLabel: Record<string, string> = { open: 'Menunggu', in_progress: 'Diproses', resolved: 'Selesai', closed: 'Ditutup', cancelled: 'Dibatalkan' };
const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

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

const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
        critical: 'bg-rose-50 text-rose-700',
        high: 'bg-orange-50 text-orange-700',
        medium: 'bg-amber-50 text-amber-700',
        low: 'bg-green-50 text-green-700',
    };
    return map[priority] ?? 'bg-slate-100 text-slate-600';
};

export default function AdminDashboard({ stats, priorityChart, statusChart, recentTickets, staffWorkload }: Props) {
    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-900">Dashboard Admin</h1>
                <p className="text-sm text-slate-500">Ringkasan dan monitoring tiket helpdesk</p>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Menunggu</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stats.open}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">Diproses</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stats.in_progress}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Selesai</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stats.resolved}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ditutup</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stats.closed}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">Melewati SLA</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stats.overdue}</p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <h2 className="mb-4 text-sm font-semibold text-slate-900">Distribusi Status</h2>
                    <div className="mx-auto max-w-xs">
                        <Doughnut
                            data={{
                                labels: statusChart.labels.map((l) => statusLabel[l] ?? l),
                                datasets: [{ data: statusChart.values, backgroundColor: statusChart.labels.map((l) => statusColors[l] ?? '#94a3b8') }],
                            }}
                            options={{ plugins: { legend: { position: 'bottom' } } }}
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <h2 className="mb-4 text-sm font-semibold text-slate-900">Distribusi Prioritas</h2>
                    <div className="mx-auto max-w-xs">
                        <Doughnut
                            data={{
                                labels: priorityChart.labels.map((l) => priorityLabel[l] ?? l),
                                datasets: [{ data: priorityChart.values, backgroundColor: priorityChart.labels.map((l) => priorityColors[l] ?? '#94a3b8') }],
                            }}
                            options={{ plugins: { legend: { position: 'bottom' } } }}
                        />
                    </div>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Tiket Terbaru</h2>
                        <Link href="/admin/tickets" className="text-xs font-medium text-teal-600 hover:text-teal-700">Lihat Semua</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="border-b border-slate-200 text-left text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Judul</th>
                                    <th className="px-5 py-3 font-medium">Prioritas</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Ditugaskan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map((t) => (
                                    <tr key={t.id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-5 py-3">
                                            <Link href={`/admin/tickets/${t.id}`} className="font-medium text-slate-900 hover:underline">{t.title}</Link>
                                        </td>
                                        <td className="px-5 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge(t.priority)}`}>{priorityLabel[t.priority] ?? t.priority}</span></td>
                                        <td className="px-5 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(t.status)}`}>{statusLabel[t.status] ?? t.status}</span></td>
                                        <td className="px-5 py-3 text-slate-500">{t.assignee ?? 'Belum'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <h2 className="mb-4 text-sm font-semibold text-slate-900">Beban Kerja Staff</h2>
                    <div className="space-y-2">
                        {staffWorkload.map((sw) => (
                            <div key={sw.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                                <span className="text-sm text-slate-700">{sw.name}</span>
                                <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">{sw.assigned_count} tiket</span>
                            </div>
                        ))}
                        {staffWorkload.length === 0 && <p className="text-sm text-slate-400">Belum ada staff.</p>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}