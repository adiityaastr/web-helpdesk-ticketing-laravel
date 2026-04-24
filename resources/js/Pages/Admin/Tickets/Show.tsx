import { FormEvent, useState } from 'react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '../Layout';

type Ticket = {
    id: number;
    uuid: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    sla_deadline: string | null;
    resolved_at: string | null;
    rating: number | null;
    rating_comment: string | null;
    created_at: string | null;
    is_overdue: boolean;
    is_sla_warning: boolean;
    category: { id: number; name: string } | null;
    reporter: { id: number; name: string; department: string | null } | null;
    assignee: { id: number; name: string } | null;
};

type Comment = {
    id: number;
    message: string;
    is_internal: boolean;
    attachments: string[];
    created_at: string | null;
    user: { id: number | null; name: string | null };
};

type ActivityLog = {
    id: number;
    action: string;
    description: string | null;
    created_at: string | null;
    user: { name: string } | null;
};

type CategoryOption = { id: number; name: string };
type StaffOption = { id: number; name: string };
type TemplateOption = { id: number; title: string; content: string };

type Props = {
    ticket: Ticket;
    comments: Comment[];
    activityLogs: ActivityLog[];
    categories: CategoryOption[];
    staffUsers: StaffOption[];
    statuses: string[];
    priorities: string[];
    templates: TemplateOption[];
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

export default function AdminTicketShow({ ticket, comments, activityLogs, categories, staffUsers, statuses, priorities, templates }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [showInternal, setShowInternal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    const updateForm = useForm({
        category_id: ticket.category?.id?.toString() ?? '',
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: ticket.assignee?.id?.toString() ?? '',
    });

    const commentForm = useForm({
        message: '',
        is_internal: false,
        attachments: [] as File[],
    });

    const submitUpdate = (e: FormEvent) => {
        e.preventDefault();
        updateForm.put(`/admin/tickets/${ticket.id}`);
    };

    const submitComment = (e: FormEvent) => {
        e.preventDefault();
        commentForm.post(`/admin/tickets/${ticket.id}/comments`, {
            onSuccess: () => commentForm.reset('message', 'attachments', 'is_internal'),
        });
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        if (templateId) {
            const template = templates.find((t) => t.id === Number(templateId));
            if (template) {
                commentForm.setData('message', template.content);
            }
        }
    };

    return (
        <AdminLayout>
            {flash.success && (
                <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-800">{ticket.title}</h1>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(ticket.status)}`}>{statusLabel[ticket.status] ?? ticket.status}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadge(ticket.priority)}`}>{priorityLabel[ticket.priority] ?? ticket.priority}</span>
                        {ticket.is_overdue && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">SLA Terlambat</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">#{ticket.uuid?.slice(0, 8)} — Dibuat {ticket.created_at}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/tickets" className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">← Kembali</Link>
                    <button
                        onClick={() => { if (confirm('Yakin ingin menghapus tiket ini?')) router.delete(`/admin/tickets/${ticket.id}`); }}
                        className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >Hapus Tiket</button>
                </div>
            </div>

            {ticket.is_sla_warning && !ticket.is_overdue && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">Batas waktu SLA akan segera berakhir!</div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-3 text-lg font-semibold text-slate-800">Deskripsi</h2>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
                    </div>

                    <form onSubmit={submitUpdate} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-800">Kelola Tiket</h2>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                                <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm" value={updateForm.data.status} onChange={(e) => updateForm.setData('status', e.target.value)}>
                                    {statuses.map((s) => <option key={s} value={s}>{statusLabel[s] ?? s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Prioritas</label>
                                <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm" value={updateForm.data.priority} onChange={(e) => updateForm.setData('priority', e.target.value)}>
                                    {priorities.map((p) => <option key={p} value={p}>{priorityLabel[p] ?? p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                                <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm" value={updateForm.data.category_id} onChange={(e) => updateForm.setData('category_id', e.target.value)}>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Tugaskan ke</label>
                                <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm" value={updateForm.data.assigned_to} onChange={(e) => updateForm.setData('assigned_to', e.target.value)}>
                                    <option value="">Belum ditugaskan</option>
                                    {staffUsers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={updateForm.processing}>
                            Simpan Perubahan
                        </button>
                    </form>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Komentar & Catatan</h2>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={commentForm.data.is_internal} onChange={(e) => commentForm.setData('is_internal', e.target.checked)} className="rounded border-slate-300" />
                                <span className="text-slate-600">Catatan Internal (hanya tim IT)</span>
                            </label>
                        </div>

                        {templates.length > 0 && (
                            <div className="mb-3">
                                <select className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm" value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
                                    <option value="">Gunakan template...</option>
                                    {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select>
                            </div>
                        )}

                        <form onSubmit={submitComment} className="mb-6 space-y-3">
                            <textarea
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                rows={3}
                                placeholder={commentForm.data.is_internal ? "Tulis catatan internal..." : "Tulis komentar..."}
                                value={commentForm.data.message}
                                onChange={(e) => commentForm.setData('message', e.target.value)}
                            />
                            {commentForm.errors.message && <p className="text-xs text-rose-600">{commentForm.errors.message}</p>}
                            <div className="flex items-center gap-3">
                                <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700" onChange={(e) => commentForm.setData('attachments', Array.from(e.target.files ?? []))} />
                                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={commentForm.processing}>
                                    {commentForm.data.is_internal ? 'Simpan Catatan' : 'Kirim Komentar'}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className={`rounded-lg border p-4 ${comment.is_internal ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="mb-1 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800">{comment.user.name ?? 'User'}</span>
                                            {comment.is_internal && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Internal</span>}
                                        </div>
                                        <span className="text-xs text-slate-500">{comment.created_at ?? '-'}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{comment.message}</p>
                                    {comment.attachments && comment.attachments.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {comment.attachments.map((a, i) => (
                                                <a key={i} href={`/storage/${a}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Lampiran {i + 1}</a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {ticket.rating && (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-2 text-lg font-semibold text-slate-800">Rating Pengguna</h2>
                            <div className="flex items-center gap-1 text-2xl">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={star <= (ticket.rating ?? 0) ? 'text-amber-400' : 'text-slate-300'}>★</span>
                                ))}
                                <span className="ml-2 text-sm text-slate-600">({ticket.rating}/5)</span>
                            </div>
                            {ticket.rating_comment && <p className="mt-2 text-sm text-slate-600">{ticket.rating_comment}</p>}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-slate-800">Detail Tiket</h3>
                        <dl className="space-y-3 text-sm">
                            <div><dt className="text-slate-500">ID</dt><dd className="font-mono text-slate-800">{ticket.uuid?.slice(0, 8)}</dd></div>
                            <div><dt className="text-slate-500">Pelapor</dt><dd className="font-medium text-slate-800">{ticket.reporter?.name ?? '-'}</dd></div>
                            {ticket.reporter?.department && <div><dt className="text-slate-500">Departemen</dt><dd className="font-medium text-slate-800">{ticket.reporter.department}</dd></div>}
                            <div><dt className="text-slate-500">Kategori</dt><dd className="font-medium text-slate-800">{ticket.category?.name ?? '-'}</dd></div>
                            <div><dt className="text-slate-500">Ditugaskan</dt><dd className="font-medium text-slate-800">{ticket.assignee?.name ?? 'Belum ditugaskan'}</dd></div>
                            {ticket.sla_deadline && <div><dt className="text-slate-500">Batas SLA</dt><dd className={`font-medium ${ticket.is_overdue ? 'text-rose-600' : ticket.is_sla_warning ? 'text-amber-600' : 'text-slate-800'}`}>{ticket.sla_deadline}</dd></div>}
                            {ticket.resolved_at && <div><dt className="text-slate-500">Diselesaikan</dt><dd className="font-medium text-slate-800">{ticket.resolved_at}</dd></div>}
                        </dl>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-slate-800">Log Aktivitas</h3>
                        <div className="space-y-3">
                            {activityLogs.map((log) => (
                                <div key={log.id} className="border-l-2 border-slate-200 pl-3">
                                    <p className="text-xs text-slate-500">{log.created_at}</p>
                                    <p className="text-sm text-slate-700">{log.user?.name ?? 'System'} — {log.description ?? log.action}</p>
                                </div>
                            ))}
                            {activityLogs.length === 0 && <p className="text-sm text-slate-500">Belum ada log.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}