import { Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import AdminLayout from '../Layout';

type TicketItem = {
    id: number;
    uuid: string;
    title: string;
    priority: string;
    status: string;
    category: { id: number; name: string } | null;
    reporter: { id: number; name: string } | null;
    assignee: { id: number; name: string } | null;
    created_at: string | null;
    is_overdue: boolean;
    saw_score?: number;
};

type CategoryOption = { id: number; name: string };
type StaffOption = { id: number; name: string };

type Props = {
    tickets: { data: TicketItem[] };
    filters: { status?: string; priority?: string; category_id?: string; assigned_to?: string; search?: string; sort?: string };
    statuses: string[];
    priorities: string[];
    categories: CategoryOption[];
    staffUsers: StaffOption[];
};

const statusBadge = (status: string) => {
    const map: Record<string, string> = { open: 'bg-blue-50 text-blue-700', in_progress: 'bg-orange-50 text-orange-700', resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-slate-100 text-slate-600', cancelled: 'bg-rose-50 text-rose-700' };
    return map[status] ?? 'bg-slate-100 text-slate-600';
};

const priorityBadge = (priority: string) => {
    const map: Record<string, string> = { critical: 'bg-rose-50 text-rose-700', high: 'bg-orange-50 text-orange-700', medium: 'bg-amber-50 text-amber-700', low: 'bg-green-50 text-green-700' };
    return map[priority] ?? 'bg-slate-100 text-slate-600';
};

const statusLabel: Record<string, string> = { open: 'Terbuka', in_progress: 'Sedang Diproses', resolved: 'Selesai', closed: 'Ditutup', cancelled: 'Dibatalkan' };
const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

export default function AdminTicketIndex({ tickets, filters, statuses, priorities, categories, staffUsers }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const updateFilter = (key: string, value: string) => {
        router.get('/admin/tickets', { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const sortedTickets = useMemo(() => {
        if (filters.sort === 'saw_score') {
            return [...tickets.data].sort((a, b) => (b.saw_score ?? 0) - (a.saw_score ?? 0));
        }
        return tickets.data;
    }, [tickets.data, filters.sort]);

    return (
        <AdminLayout>
            {flash.success && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {flash.success}
                </div>
            )}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Kelola Tiket</h1>
                    <p className="text-sm text-slate-500">Kelola dan pantau semua tiket helpdesk</p>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '18px' }}>search</span>
                    <input
                        type="text"
                        placeholder="Cari tiket..."
                        className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        defaultValue={filters.search ?? ''}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>
                <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={filters.status ?? ''} onChange={(e) => updateFilter('status', e.target.value)}>
                    <option value="">Semua Status</option>
                    {statuses.map((s) => <option key={s} value={s}>{statusLabel[s] ?? s}</option>)}
                </select>
                <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={filters.priority ?? ''} onChange={(e) => updateFilter('priority', e.target.value)}>
                    <option value="">Semua Prioritas</option>
                    {priorities.map((p) => <option key={p} value={p}>{priorityLabel[p] ?? p}</option>)}
                </select>
                <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={filters.category_id ?? ''} onChange={(e) => updateFilter('category_id', e.target.value)}>
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={filters.assigned_to ?? ''} onChange={(e) => updateFilter('assigned_to', e.target.value)}>
                    <option value="">Semua Petugas</option>
                    {staffUsers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={filters.sort ?? ''} onChange={(e) => updateFilter('sort', e.target.value)}>
                    <option value="">Urut: Terbaru</option>
                    <option value="saw_score">Urut: Skor SAW</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-5 py-3">Judul</th>
                                <th className="px-5 py-3">Pelapor</th>
                                <th className="px-5 py-3">Kategori</th>
                                <th className="px-5 py-3">Prioritas</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Petugas</th>
                                <th className="px-5 py-3">Tanggal</th>
                                <th className="px-5 py-3">SAW</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.data.length === 0 && (
                                <tr><td className="px-5 py-8 text-center text-slate-400" colSpan={8}>Tidak ada tiket.</td></tr>
                            )}
                            {(filters.sort === 'saw_score' ? sortedTickets : tickets.data).map((ticket) => (
                                <tr key={ticket.id} className="border-b border-slate-100 last:border-0">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/tickets/${ticket.id}`} className="font-medium text-slate-900 hover:underline">{ticket.title}</Link>
                                            {ticket.is_overdue && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">SLA</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{ticket.reporter?.name ?? '-'}</td>
                                    <td className="px-5 py-3 text-slate-500">{ticket.category?.name ?? '-'}</td>
                                    <td className="px-5 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge(ticket.priority)}`}>{priorityLabel[ticket.priority] ?? ticket.priority}</span></td>
                                    <td className="px-5 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(ticket.status)}`}>{statusLabel[ticket.status] ?? ticket.status}</span></td>
                                    <td className="px-5 py-3 text-slate-500">{ticket.assignee?.name ?? 'Belum'}</td>
                                    <td className="px-5 py-3 text-slate-400">{ticket.created_at ?? '-'}</td>
                                    <td className="px-5 py-3">
                                        {ticket.saw_score != null
                                            ? <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">{ticket.saw_score.toFixed(3)}</span>
                                            : <span className="text-slate-300">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}