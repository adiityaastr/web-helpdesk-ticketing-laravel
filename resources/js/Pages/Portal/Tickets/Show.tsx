import { FormEvent, useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
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

type Props = {
    ticket: Ticket;
    comments: Comment[];
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

const statusLabel: Record<string, string> = { open: 'Menunggu', in_progress: 'Diproses', resolved: 'Selesai', closed: 'Ditutup' };
const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

export default function PortalTicketShow({ ticket, comments }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
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

    const submitComment = (e: FormEvent) => {
        e.preventDefault();
        commentForm.post(`/portal/tickets/${ticket.id}/comments`, {
            onSuccess: () => commentForm.reset('message', 'attachments'),
        });
    };

    const submitRating = (e: FormEvent) => {
        e.preventDefault();
        ratingForm.post(`/portal/tickets/${ticket.id}/rate`);
    };

    return (
        <PortalLayout>
            {flash.success && (
                <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>
            )}

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-800">{ticket.title}</h1>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(ticket.status)}`}>{statusLabel[ticket.status] ?? ticket.status}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadge(ticket.priority)}`}>{priorityLabel[ticket.priority] ?? ticket.priority}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">#{ticket.uuid?.slice(0, 8)} — Dibuat {ticket.created_at}</p>
                </div>
                <Link href="/portal/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">← Kembali ke daftar</Link>
            </div>

            {ticket.is_overdue && (
                <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Tiket ini sudah melampaui batas waktu SLA!
                </div>
            )}
            {ticket.is_sla_warning && !ticket.is_overdue && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Batas waktu SLA akan segera berakhir!
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-3 text-lg font-semibold text-slate-800">Deskripsi</h2>
                        <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.description}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">Komentar ({comments.length})</h2>

                        <form onSubmit={submitComment} className="mb-6 space-y-3">
                            <textarea
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                    className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                                    onChange={(e) => commentForm.setData('attachments', Array.from(e.target.files ?? []))}
                                />
                                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={commentForm.processing}>
                                    Kirim Komentar
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3">
                            {comments.length === 0 && <p className="text-sm text-slate-500">Belum ada komentar.</p>}
                            {comments.map((comment) => (
                                <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-800">{comment.user.name ?? 'User'}</span>
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

                    {ticket.status === 'resolved' && !ticket.rating && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                            <h2 className="mb-3 text-lg font-semibold text-emerald-800">Beri Rating</h2>
                            <p className="mb-4 text-sm text-emerald-700">Tiket Anda sudah diselesaikan. Beri penilaian untuk layanan kami.</p>
                            <form onSubmit={submitRating} className="space-y-4">
                                <div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`text-2xl ${(hoverRating || ratingValue) >= star ? 'text-amber-400' : 'text-slate-300'}`}
                                                onClick={() => { setRatingValue(star); ratingForm.setData('rating', star); }}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="w-full rounded-lg border border-emerald-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    rows={3}
                                    placeholder="Komentar tambahan (opsional)"
                                    value={ratingForm.data.rating_comment}
                                    onChange={(e) => ratingForm.setData('rating_comment', e.target.value)}
                                />
                                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50" disabled={ratingForm.processing}>
                                    Kirim Rating
                                </button>
                            </form>
                        </div>
                    )}

                    {ticket.rating && (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-2 text-lg font-semibold text-slate-800">Rating Anda</h2>
                            <div className="flex items-center gap-1 text-2xl">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={star <= (ticket.rating ?? 0) ? 'text-amber-400' : 'text-slate-300'}>★</span>
                                ))}
                            </div>
                            {ticket.rating_comment && <p className="mt-2 text-sm text-slate-600">{ticket.rating_comment}</p>}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-slate-800">Detail Tiket</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-slate-500">Kategori</dt>
                                <dd className="font-medium text-slate-800">{ticket.category?.name ?? '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Pelapor</dt>
                                <dd className="font-medium text-slate-800">{ticket.reporter?.name ?? '-'}</dd>
                            </div>
                            {ticket.reporter?.department && (
                                <div>
                                    <dt className="text-slate-500">Departemen</dt>
                                    <dd className="font-medium text-slate-800">{ticket.reporter.department}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-slate-500">Ditugaskan ke</dt>
                                <dd className="font-medium text-slate-800">{ticket.assignee?.name ?? 'Belum ditugaskan'}</dd>
                            </div>
                            {ticket.sla_deadline && (
                                <div>
                                    <dt className="text-slate-500">Batas SLA</dt>
                                    <dd className={`font-medium ${ticket.is_overdue ? 'text-rose-600' : ticket.is_sla_warning ? 'text-amber-600' : 'text-slate-800'}`}>{ticket.sla_deadline}</dd>
                                </div>
                            )}
                            {ticket.resolved_at && (
                                <div>
                                    <dt className="text-slate-500">Diselesaikan</dt>
                                    <dd className="font-medium text-slate-800">{ticket.resolved_at}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}