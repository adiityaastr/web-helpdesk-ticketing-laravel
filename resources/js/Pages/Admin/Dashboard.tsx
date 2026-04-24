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
};

const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
};

const statusLabel: Record<string, string> = { open: 'Menunggu', in_progress: 'Diproses', resolved: 'Selesai', closed: 'Ditutup' };
const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        open: 'bg-blue-100 text-blue-700',
        in_progress: 'bg-amber-100 text-amber-700',
        resolved: 'bg-emerald-100 text-emerald-700',
        closed: 'bg-slate-100 text-slate-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
};

const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
        critical: 'bg-rose-100 text-rose-700',
        high: 'bg-orange-100 text-orange-700',
        medium: 'bg-amber-100 text-amber-700',
        low: 'bg-green-100 text-green-700',
    };
    return map[priority] ?? 'bg-slate-100 text-slate-700';
};

export default function AdminDashboard({ stats, priorityChart, statusChart, recentTickets, staffWorkload }: Props) {
    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin</h1>
                <p className="text-sm text-slate-500">Ringkasan dan monitoring tiket helpdesk</p>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                    <p className="text-xs text-blue-600">Menunggu</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">{stats.open}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <p className="text-xs text-amber-600">Diproses</p>
                    <p className="mt-1 text-2xl font-bold text-amber-700">{stats.in_progress}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <p className="text-xs text-emerald-600">Selesai</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.resolved}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <p className="text-xs text-slate-600">Ditutup</p>
                    <p className="mt-1 text-2xl font-bold text-slate-700">{stats.closed}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
                    <p className="text-xs text-rose-600">Melewati SLA</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">{stats.overdue}</p>
                </div>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Distribusi Status</h2>
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

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Distribusi Prioritas</h2>
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

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <h2 className="text-lg font-semibold text-slate-800">Tiket Terbaru</h2>
                        <Link href="/admin/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Lihat Semua →</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-slate-600">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Judul</th>
                                    <th className="px-5 py-3 font-medium">Prioritas</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Ditugaskan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map((t) => (
                                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-5 py-3">
                                            <Link href={`/admin/tickets/${t.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">{t.title}</Link>
                                        </td>
                                        <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadge(t.priority)}`}>{priorityLabel[t.priority] ?? t.priority}</span></td>
                                        <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(t.status)}`}>{statusLabel[t.status] ?? t.status}</span></td>
                                        <td className="px-5 py-3 text-slate-600">{t.assignee ?? 'Belum'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Beban Kerja Staff</h2>
                    <div className="space-y-3">
                        {staffWorkload.map((sw) => (
                            <div key={sw.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                <span className="text-sm font-medium text-slate-700">{sw.name}</span>
                                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{sw.assigned_count} tiket</span>
                            </div>
                        ))}
                        {staffWorkload.length === 0 && <p className="text-sm text-slate-500">Belum ada staff.</p>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}