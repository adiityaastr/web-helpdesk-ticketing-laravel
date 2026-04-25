import { FormEvent, useState } from 'react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import PortalLayout from '../Layout';

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
    is_cancellable: boolean;
    is_deletable: boolean;
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

type Props = {
    ticket: Ticket | { data: Ticket };
    comments: Comment[];
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

const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
        critical: 'bg-rose-50 text-rose-700',
        high: 'bg-orange-50 text-orange-700',
        medium: 'bg-amber-50 text-amber-700',
        low: 'bg-green-50 text-green-700',
    };
    return map[priority] ?? 'bg-slate-100 text-slate-600';
};

const statusLabel: Record<string, string> = { open: 'Terbuka', in_progress: 'Sedang Diproses', resolved: 'Selesai', closed: 'Ditutup', cancelled: 'Dibatalkan' };
const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

export default function PortalTicketShow({ ticket: ticketProp, comments }: Props) {
    const ticket = ('data' in ticketProp ? ticketProp.data : ticketProp) as Ticket;
    const page = usePage<{ flash: { success?: string; error?: string }; auth: { user: { roles?: string[] } | null } }>();
    const { flash } = page.props;
    const roles = page.props.auth.user?.roles ?? [];
    const staffOrAdmin = roles.includes('staff') || roles.includes('admin');
    const [ratingValue, setRatingValue] = useState(ticket.rating ?? 0);
    const [hoverRating, setHoverRating] = useState(0);

    const commentForm = useForm({
        message: '',
        attachments: [] as File[],
    });

    const ratingForm = useForm({
        rating: ticket.rating ?? 5,
        rating_comment: ticket.rating_comment ?? '',
    });

    const cancelForm = useForm({});

    const ticketPath = `/portal/tickets/${ticket.id}`;

    const submitComment = (e: FormEvent) => {
        e.preventDefault();
        commentForm.post(`${ticketPath}/comments`, {
            onSuccess: () => {
                commentForm.reset('message', 'attachments');
                router.reload({ only: ['ticket', 'comments'] });
            },
        });
    };

    const submitRating = (e: FormEvent) => {
        e.preventDefault();
        ratingForm.post(`${ticketPath}/rate`, {
            onSuccess: () => router.reload({ only: ['ticket'] }),
        });
    };

    const handleCancel = () => {
        if (confirm('Yakin ingin membatalkan tiket ini? Tindakan ini tidak dapat diurungkan.')) {
            cancelForm.post(`${ticketPath}/cancel`);
        }
    };

    const handleDelete = () => {
        if (confirm('Yakin ingin menghapus tiket ini? Tindakan ini tidak dapat diurungkan.')) {
            router.delete(ticketPath);
        }
    };

    return (
        <PortalLayout>
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
                    </div>
                    <p className="mt-1 text-sm text-slate-500">#{ticket.uuid?.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2">
                    {ticket.is_cancellable && (
                        <button
                            onClick={handleCancel}
                            className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                            disabled={cancelForm.processing}
                        >
                            Batalkan
                        </button>
                    )}
                    {ticket.is_deletable && (
                        <button
                            onClick={handleDelete}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            Hapus
                        </button>
                    )}
                    <Link href={staffOrAdmin ? '/admin/tickets' : '/portal/tickets'} className="text-sm font-medium text-slate-600 hover:text-teal-700">
                        {staffOrAdmin ? 'Kembali ke admin' : 'Kembali ke daftar'}
                    </Link>
                </div>
            </div>

            {ticket.is_overdue && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>warning</span>
                    Tiket ini sudah melampaui batas waktu SLA!
                </div>
            )}
            {ticket.is_sla_warning && !ticket.is_overdue && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>schedule</span>
                    Batas waktu SLA akan segera berakhir!
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <h2 className="mb-3 text-sm font-semibold text-slate-900">Deskripsi</h2>
                        <p className="whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>
                    </div>

                    {ticket.status !== 'cancelled' && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-4 text-sm font-semibold text-slate-900">Komentar ({comments.length})</h2>

                            <form onSubmit={submitComment} className="mb-6 space-y-3">
                                <textarea
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    rows={3}
                                    placeholder="Tulis komentar..."
                                    value={commentForm.data.message}
                                    onChange={(e) => commentForm.setData('message', e.target.value)}
                                />
                                {commentForm.errors.message && <p className="text-xs text-rose-600">{commentForm.errors.message}</p>}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-teal-700"
                                        onChange={(e) => commentForm.setData('attachments', Array.from(e.target.files ?? []))}
                                    />
                                    <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={commentForm.processing}>
                                        Kirim
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-3">
                                {comments.length === 0 && <p className="text-sm text-slate-400">Belum ada komentar.</p>}
                                {comments.map((comment) => (
                                    <div key={comment.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-900">{comment.user.name ?? 'User'}</span>
                                            <span className="text-xs text-slate-400">{comment.created_at ?? '-'}</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{comment.message}</p>
                                        {comment.attachments && comment.attachments.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {comment.attachments.map((a, i) => (
                                                    <a key={i} href={`/storage/${a}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attachment</span>
                                                        Lampiran {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {ticket.status === 'cancelled' && comments.length > 0 && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-4 text-sm font-semibold text-slate-900">Komentar ({comments.length})</h2>
                            <div className="space-y-3">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-900">{comment.user.name ?? 'User'}</span>
                                            <span className="text-xs text-slate-400">{comment.created_at ?? '-'}</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{comment.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {ticket.status === 'resolved' && !ticket.rating && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-3 text-sm font-semibold text-slate-900">Beri Rating</h2>
                            <p className="mb-4 text-sm text-slate-500">Tiket Anda sudah diselesaikan. Beri penilaian untuk layanan kami.</p>
                            <form onSubmit={submitRating} className="space-y-4">
                                <div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="p-0.5"
                                                onClick={() => { setRatingValue(star); ratingForm.setData('rating', star); }}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                            >
                                                <span className={`material-symbols-outlined ${(hoverRating || ratingValue) >= star ? 'text-amber-400' : 'text-slate-300'}`} style={{ fontSize: '24px', ...(hoverRating >= star || ratingValue >= star ? { fontVariationSettings: "'FILL' 1" } : {}) }}>star</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    rows={3}
                                    placeholder="Komentar tambahan (opsional)"
                                    value={ratingForm.data.rating_comment}
                                    onChange={(e) => ratingForm.setData('rating_comment', e.target.value)}
                                />
                                <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={ratingForm.processing}>
                                    Kirim Rating
                                </button>
                            </form>
                        </div>
                    )}

                    {ticket.rating && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-2 text-sm font-semibold text-slate-900">Rating Anda</h2>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`material-symbols-outlined ${star <= (ticket.rating ?? 0) ? 'text-amber-400' : 'text-slate-300'}`} style={{ fontSize: '20px', ...(star <= (ticket.rating ?? 0) ? { fontVariationSettings: "'FILL' 1" } : {}) }}>star</span>
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
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>category</span>
                                <div><dt className="text-slate-400">Kategori</dt><dd className="font-medium text-slate-900">{ticket.category?.name ?? '-'}</dd></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>person</span>
                                <div><dt className="text-slate-400">Pelapor</dt><dd className="font-medium text-slate-900">{ticket.reporter?.name ?? '-'}</dd></div>
                            </div>
                            {ticket.reporter?.department && (
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>apartment</span>
                                    <div><dt className="text-slate-400">Departemen</dt><dd className="font-medium text-slate-900">{ticket.reporter.department}</dd></div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>support_agent</span>
                                <div><dt className="text-slate-400">Ditugaskan ke</dt><dd className="font-medium text-slate-900">{ticket.assignee?.name ?? 'Belum ditugaskan'}</dd></div>
                            </div>
                            {ticket.sla_deadline && (
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>schedule</span>
                                    <div><dt className="text-slate-400">Batas SLA</dt><dd className={`font-medium ${ticket.is_overdue ? 'text-rose-600' : ticket.is_sla_warning ? 'text-amber-600' : 'text-slate-900'}`}>{ticket.sla_deadline}</dd></div>
                                </div>
                            )}
                            {ticket.resolved_at && (
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>check_circle</span>
                                    <div><dt className="text-slate-400">Diselesaikan</dt><dd className="font-medium text-slate-900">{ticket.resolved_at}</dd></div>
                                </div>
                            )}
                            {ticket.cancelled_at && (
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-rose-500" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>cancel</span>
                                    <div><dt className="text-slate-400">Dibatalkan</dt><dd className="font-medium text-rose-600">{ticket.cancelled_at}</dd></div>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}