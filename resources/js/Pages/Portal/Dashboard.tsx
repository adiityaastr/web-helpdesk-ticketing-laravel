import { Link, usePage } from '@inertiajs/react';
import PortalLayout from './Layout';

type TicketItem = {
    id: number;
    uuid: string;
    title: string;
    priority: string;
    status: string;
    category: { id: number; name: string } | null;
    created_at: string | null;
};

type Props = {
    recentTickets: TicketItem[];
    stats: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
    };
};

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

export default function PortalDashboard({ recentTickets, stats }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    return (
        <PortalLayout>
            {flash.success && (
                <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-sm text-slate-500">Selamat datang! Berikut ringkasan tiket Anda.</p>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total Tiket</p>
                    <p className="mt-1 text-3xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                    <p className="text-sm text-blue-600">Menunggu</p>
                    <p className="mt-1 text-3xl font-bold text-blue-700">{stats.open}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <p className="text-sm text-amber-600">Diproses</p>
                    <p className="mt-1 text-3xl font-bold text-amber-700">{stats.in_progress}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                    <p className="text-sm text-emerald-600">Selesai</p>
                    <p className="mt-1 text-3xl font-bold text-emerald-700">{stats.resolved}</p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-slate-800">Tiket Terbaru</h2>
                    <Link href="/portal/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Lihat Semua →</Link>
                </div>

                {recentTickets.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-slate-500">Anda belum memiliki tiket.</p>
                        <Link href="/portal/tickets/create" className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Buat Tiket Pertama</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-slate-600">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Judul</th>
                                    <th className="px-5 py-3 font-medium">Kategori</th>
                                    <th className="px-5 py-3 font-medium">Prioritas</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map((ticket) => (
                                    <tr key={ticket.id} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-5 py-3">
                                            <Link href={`/portal/tickets/${ticket.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">{ticket.title}</Link>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{ticket.category?.name ?? '-'}</td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadge(ticket.priority)}`}>{ticket.priority}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(ticket.status)}`}>{ticket.status.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">{ticket.created_at ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PortalLayout>
    );
}