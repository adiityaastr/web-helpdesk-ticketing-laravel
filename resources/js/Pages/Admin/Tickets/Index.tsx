import { Link, router, usePage } from '@inertiajs/react';
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
};

type CategoryOption = { id: number; name: string };
type StaffOption = { id: number; name: string };

type Props = {
    tickets: { data: TicketItem[] };
    filters: { status?: string; priority?: string; category_id?: string; assigned_to?: string; search?: string };
    statuses: string[];
    priorities: string[];
    categories: CategoryOption[];
    staffUsers: StaffOption[];
};

const statusBadge = (status: string) => {
    const map: Record<string, string> = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700', resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-slate-100 text-slate-700' };
    return map[status] ?? 'bg-slate-100 text-slate-700';
};

const priorityBadge = (priority: string) => {
    const map: Record<string, string> = { critical: 'bg-rose-100 text-rose-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };
    return map[priority] ?? 'bg-slate-100 text-slate-700';
};

const statusLabel: Record<string, string> = { open: 'Menunggu', in_progress: 'Diproses', resolved: 'Selesai', closed: 'Ditutup' };
const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

export default function AdminTicketIndex({ tickets, filters, statuses, priorities, categories, staffUsers }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const updateFilter = (key: string, value: string) => {
        router.get('/admin/tickets', { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    return (
        <AdminLayout>
            {flash.success && (
                <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kelola Tiket</h1>
                    <p className="text-sm text-slate-500">Kelola dan pantau semua tiket helpdesk</p>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <input
                    type="text"
                    placeholder="Cari tiket..."
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => updateFilter('search', e.target.value)}
                />
                <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={filters.status ?? ''} onChange={(e) => updateFilter('status', e.target.value)}>
                    <option value="">Semua Status</option>
                    {statuses.map((s) => <option key={s} value={s}>{statusLabel[s] ?? s}</option>)}
                </select>
                <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={filters.priority ?? ''} onChange={(e) => updateFilter('priority', e.target.value)}>
                    <option value="">Semua Prioritas</option>
                    {priorities.map((p) => <option key={p} value={p}>{priorityLabel[p] ?? p}</option>)}
                </select>
                <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={filters.category_id ?? ''} onChange={(e) => updateFilter('category_id', e.target.value)}>
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none" value={filters.assigned_to ?? ''} onChange={(e) => updateFilter('assigned_to', e.target.value)}>
                    <option value="">Semua Petugas</option>
                    {staffUsers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                            <tr>
                                <th className="px-5 py-3 font-medium">Judul</th>
                                <th className="px-5 py-3 font-medium">Pelapor</th>
                                <th className="px-5 py-3 font-medium">Kategori</th>
                                <th className="px-5 py-3 font-medium">Prioritas</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                                <th className="px-5 py-3 font-medium">Petugas</th>
                                <th className="px-5 py-3 font-medium">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.data.length === 0 && (
                                <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={7}>Tidak ada tiket.</td></tr>
                            )}
                            {tickets.data.map((ticket) => (
                                <tr key={ticket.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/tickets/${ticket.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">{ticket.title}</Link>
                                            {ticket.is_overdue && <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">SLA</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{ticket.reporter?.name ?? '-'}</td>
                                    <td className="px-5 py-3 text-slate-600">{ticket.category?.name ?? '-'}</td>
                                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadge(ticket.priority)}`}>{priorityLabel[ticket.priority] ?? ticket.priority}</span></td>
                                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(ticket.status)}`}>{statusLabel[ticket.status] ?? ticket.status}</span></td>
                                    <td className="px-5 py-3 text-slate-600">{ticket.assignee?.name ?? 'Belum'}</td>
                                    <td className="px-5 py-3 text-slate-500">{ticket.created_at ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}