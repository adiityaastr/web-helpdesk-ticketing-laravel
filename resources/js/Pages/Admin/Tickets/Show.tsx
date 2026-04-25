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
    cancelled_at: string | null;
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
    ticket: Ticket | { data: Ticket };
    comments: Comment[];
    activityLogs: ActivityLog[];
    categories: CategoryOption[];
    staffUsers: StaffOption[];
    statuses: string[];
    priorities: string[];
    templates: TemplateOption[];
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

export default function AdminTicketShow({ ticket: ticketProp, comments, activityLogs, categories, staffUsers, statuses, priorities, templates }: Props) {
    const ticket = ('data' in ticketProp ? ticketProp.data : ticketProp) as Ticket;
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [showInternal, setShowInternal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    const updateForm = useForm({
        priority: ticket.priority ?? 'medium',
        status: ticket.status ?? 'open',
        assigned_to: String(ticket.assignee?.id ?? ''),
    });

    const commentForm = useForm({
        message: '',
        is_internal: false,
        attachments: [] as File[],
    });

    const submitUpdate = (e: FormEvent) => {
        e.preventDefault();
        updateForm.put(`/admin/tickets/${ticket.id}`, {
            onSuccess: () => {
                updateForm.reset();
                router.reload({ only: ['ticket', 'comments', 'activityLogs'] });
            },
        });
    };

    const submitComment = (e: FormEvent) => {
        e.preventDefault();
        commentForm.post(`/admin/tickets/${ticket.id}/comments`, {
            onSuccess: () => {
                commentForm.reset('message', 'attachments', 'is_internal');
                router.reload({ only: ['ticket', 'comments', 'activityLogs'] });
            },
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
                <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>error</span>
                    {flash.error}
                </div>
            )}

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-semibold text-slate-900">{ticket.title}</h1>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(ticket.status)}`}>{statusLabel[ticket.status] ?? ticket.status}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge(ticket.priority)}`}>{priorityLabel[ticket.priority] ?? ticket.priority}</span>
                        {ticket.is_overdue && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">SLA Terlambat</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">#{ticket.uuid?.slice(0, 8)} -- Dibuat {ticket.created_at}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/tickets" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Kembali</Link>
                    <button
                        type="button"
                        onClick={() => {
                            if (!confirm('Yakin ingin menghapus tiket ini?')) {
                                return;
                            }
                            router.delete(`/admin/tickets/${ticket.id}`);
                        }}
                        className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                    >Hapus</button>
                </div>
            </div>

            {ticket.is_sla_warning && !ticket.is_overdue && (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Batas waktu SLA akan segera berakhir!</div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <h2 className="mb-3 text-sm font-semibold text-slate-900">Deskripsi</h2>
                        <p className="whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>
                    </div>

                    <form onSubmit={submitUpdate} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
                        <h2 className="text-sm font-semibold text-slate-900">Kelola Tiket</h2>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                                <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={updateForm.data.status} onChange={(e) => updateForm.setData('status', e.target.value)}>
                                    {statuses.map((s) => <option key={s} value={s}>{statusLabel[s] ?? s}</option>)}
                                </select>
                                {updateForm.errors.status && <p className="mt-1 text-xs text-rose-600">{updateForm.errors.status}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Prioritas</label>
                                <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={updateForm.data.priority} onChange={(e) => updateForm.setData('priority', e.target.value)}>
                                    {priorities.map((p) => <option key={p} value={p}>{priorityLabel[p] ?? p}</option>)}
                                </select>
                                {updateForm.errors.priority && <p className="mt-1 text-xs text-rose-600">{updateForm.errors.priority}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tugaskan ke</label>
                                <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={updateForm.data.assigned_to} onChange={(e) => updateForm.setData('assigned_to', e.target.value)}>
                                    <option value="">Belum ditugaskan</option>
                                    {staffUsers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                {updateForm.errors.assigned_to && <p className="mt-1 text-xs text-rose-600">{updateForm.errors.assigned_to}</p>}
                            </div>
                        </div>

                        <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={updateForm.processing}>
                            Simpan Perubahan
                        </button>
                    </form>

                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-900">Komentar & Catatan</h2>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={commentForm.data.is_internal} onChange={(e) => commentForm.setData('is_internal', e.target.checked)} className="rounded border-slate-300" />
                                <span className="text-slate-500">Catatan Internal</span>
                            </label>
                        </div>

                        {templates.length > 0 && (
                            <div className="mb-3">
                                <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
                                    <option value="">Gunakan template...</option>
                                    {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select>
                            </div>
                        )}

                        <form onSubmit={submitComment} className="mb-6 space-y-3">
                            <textarea
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                rows={3}
                                placeholder={commentForm.data.is_internal ? "Tulis catatan internal..." : "Tulis komentar..."}
                                value={commentForm.data.message}
                                onChange={(e) => commentForm.setData('message', e.target.value)}
                            />
                            {commentForm.errors.message && <p className="text-xs text-rose-600">{commentForm.errors.message}</p>}
                            {commentForm.errors.attachments && <p className="text-xs text-rose-600">{commentForm.errors.attachments}</p>}
                            {commentForm.errors.is_internal && <p className="text-xs text-rose-600">{commentForm.errors.is_internal}</p>}
                            <div className="flex items-center gap-3">
                                <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-teal-700" onChange={(e) => commentForm.setData('attachments', Array.from(e.target.files ?? []))} />
                                <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={commentForm.processing}>
                                    {commentForm.data.is_internal ? 'Simpan Catatan' : 'Kirim'}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <div key={comment.id} className={`rounded-md border p-4 ${comment.is_internal ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                                    <div className="mb-1 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900">{comment.user.name ?? 'User'}</span>
                                            {comment.is_internal && <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">Internal</span>}
                                        </div>
                                        <span className="text-xs text-slate-400">{comment.created_at ?? '-'}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{comment.message}</p>
                                    {comment.attachments && comment.attachments.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {comment.attachments.map((a, i) => (
                                                <a key={i} href={`/storage/${a}`} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">Lampiran {i + 1}</a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {ticket.rating && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-2 text-sm font-semibold text-slate-900">Rating Pengguna</h2>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} className={`h-5 w-5 ${star <= (ticket.rating ?? 0) ? 'text-amber-400' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="ml-2 text-sm text-slate-500">({ticket.rating}/5)</span>
                            </div>
                            {ticket.rating_comment && <p className="mt-2 text-sm text-slate-600">{ticket.rating_comment}</p>}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">Detail Tiket</h3>
                        <dl className="space-y-3 text-sm">
                            <div><dt className="text-slate-400">ID</dt><dd className="font-mono text-slate-900">{ticket.uuid?.slice(0, 8)}</dd></div>
                            <div><dt className="text-slate-400">Pelapor</dt><dd className="font-medium text-slate-900">{ticket.reporter?.name ?? '-'}</dd></div>
                            {ticket.reporter?.department && <div><dt className="text-slate-400">Departemen</dt><dd className="font-medium text-slate-900">{ticket.reporter.department}</dd></div>}
                            <div><dt className="text-slate-400">Kategori</dt><dd className="font-medium text-slate-900">{ticket.category?.name ?? '-'}</dd></div>
                            <div><dt className="text-slate-400">Ditugaskan</dt><dd className="font-medium text-slate-900">{ticket.assignee?.name ?? 'Belum ditugaskan'}</dd></div>
                            {ticket.sla_deadline && <div><dt className="text-slate-400">Batas SLA</dt><dd className={`font-medium ${ticket.is_overdue ? 'text-rose-600' : ticket.is_sla_warning ? 'text-amber-600' : 'text-slate-900'}`}>{ticket.sla_deadline}</dd></div>}
                            {ticket.resolved_at && <div><dt className="text-slate-400">Diselesaikan</dt><dd className="font-medium text-slate-900">{ticket.resolved_at}</dd></div>}
                            {ticket.cancelled_at && <div><dt className="text-slate-400">Dibatalkan</dt><dd className="font-medium text-rose-600">{ticket.cancelled_at}</dd></div>}
                        </dl>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">Log Aktivitas</h3>
                        <div className="space-y-3">
                            {activityLogs.map((log) => (
                                <div key={log.id} className="border-l-2 border-teal-300 pl-3">
                                    <p className="text-xs text-slate-400">{log.created_at}</p>
                                    <p className="text-sm text-slate-600">{log.user?.name ?? 'System'} -- {log.description ?? log.action}</p>
                                </div>
                            ))}
                            {activityLogs.length === 0 && <p className="text-sm text-slate-400">Belum ada log.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}