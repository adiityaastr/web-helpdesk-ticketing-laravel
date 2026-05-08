import React, { FormEvent, useState } from 'react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import PortalLayout from '../Layout';
import Icon from '@/Components/Icon';
import FlashMessage from '@/Components/FlashMessage';
import Badge from '@/Components/Badge';
import CommentSection, { type Comment } from '@/Components/CommentSection';
import RatingStars from '@/Components/RatingStars';
import ConfirmDialog from '@/Components/ConfirmDialog';

type Ticket = {
    id: number;
    uuid: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    sla_deadline: string | null;
    resolved_at: string | null;
    resolved_confirmed_at: string | null;
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

type Props = {
    ticket: Ticket | { data: Ticket };
    comments: Comment[];
};

export default React.memo(function PortalTicketShow({ ticket: ticketProp, comments }: Props) {
    const ticket = ('data' in ticketProp ? ticketProp.data : ticketProp) as Ticket;
    const { flash } = usePage<{ flash: { success?: string; error?: string }; auth: { user: { roles?: string[] } | null } }>().props;
    const staffOrAdmin = (usePage().props.auth.user?.roles ?? []).includes('staff');
    const [ratingValue, setRatingValue] = useState(ticket.rating ?? 0);
    const commentLocked = ticket.status === 'closed' || ticket.status === 'cancelled';
    const [showReject, setShowReject] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showConfirmResolutionDialog, setShowConfirmResolutionDialog] = useState(false);
    const [showRatingDialog, setShowRatingDialog] = useState(false);

    const commentForm = useForm({ message: '', attachments: [] as File[] });
    const ratingForm = useForm({ rating: ticket.rating ?? 5, rating_comment: ticket.rating_comment ?? '' });
    const cancelForm = useForm({});
    const confirmForm = useForm({});
    const rejectForm = useForm({ reason: '' });

    const ticketPath = `/portal/tickets/${ticket.id}`;

    const handleCommentSubmit = (data: { message: string; attachments: File[] }) => {
        commentForm.setData('message', data.message);
        commentForm.setData('attachments', data.attachments);
        commentForm.post(`${ticketPath}/comments`, {
            onSuccess: () => router.reload({ only: ['ticket', 'comments'] }),
        });
    };

    const submitRating = (e: FormEvent) => {
        e.preventDefault();
        ratingForm.post(`${ticketPath}/rate`, {
            onSuccess: () => router.reload({ only: ['ticket'] }),
        });
    };

    return (
        <PortalLayout>
            <FlashMessage success={flash.success} error={flash.error} />

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-semibold text-slate-900">{ticket.title}</h1>
                        <Badge variant="status" value={ticket.status} />
                        <Badge variant="priority" value={ticket.priority} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">#{ticket.uuid?.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2">
                    {ticket.is_cancellable && (
                        <button onClick={() => setShowCancelConfirm(true)} className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50" disabled={cancelForm.processing}>Batalkan</button>
                    )}
                    {ticket.is_deletable && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Hapus</button>
                    )}
                    <Link href={staffOrAdmin ? '/admin/tickets' : '/portal/tickets'} className="text-sm font-medium text-slate-600 hover:text-teal-700">
                        {staffOrAdmin ? 'Kembali ke admin' : 'Kembali ke daftar'}
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <h2 className="mb-3 text-sm font-semibold text-slate-900">Deskripsi</h2>
                        <p className="whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>
                    </div>

                    <CommentSection
                        comments={comments}
                        isLocked={commentLocked}
                        onSubmit={handleCommentSubmit}
                        processing={commentForm.processing}
                        errors={commentForm.errors}
                    />

                    {ticket.status === 'resolved' && !ticket.resolved_confirmed_at && (
                        <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
                            <h2 className="mb-2 text-sm font-semibold text-teal-900">Konfirmasi Penyelesaian</h2>
                            <p className="mb-4 text-sm text-teal-700">Admin telah menyelesaikan tiket ini. Apakah permasalahan Anda sudah diperbaiki?</p>
                            {!showReject ? (
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => confirmForm.post(`${ticketPath}/confirm`)} className="rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={confirmForm.processing}>Ya, Sudah Selesai</button>
                                    <button type="button" onClick={() => setShowReject(true)} className="rounded-md border border-rose-200 bg-white px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">Belum, Masih Ada Masalah</button>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); rejectForm.post(`${ticketPath}/reject`); }} className="space-y-3">
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" rows={3} placeholder="Jelaskan kendala yang masih terjadi..." value={rejectForm.data.reason} onChange={(e) => rejectForm.setData('reason', e.target.value)} />
                                    {rejectForm.errors.reason && <p className="text-xs text-rose-600">{rejectForm.errors.reason}</p>}
                                    <div className="flex gap-3">
                                        <button type="submit" className="rounded-md bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50" disabled={rejectForm.processing}>Kirim & Buka Kembali</button>
                                        <button type="button" onClick={() => { setShowReject(false); rejectForm.reset('reason'); }} className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {ticket.status === 'resolved' && !ticket.rating && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-3 text-sm font-semibold text-slate-900">Beri Rating</h2>
                            <p className="mb-4 text-sm text-slate-500">Tiket Anda sudah diselesaikan. Beri penilaian untuk layanan kami.</p>
                            <form onSubmit={submitRating} className="space-y-4">
                                <RatingStars rating={ratingValue} onChange={(r) => { setRatingValue(r); ratingForm.setData('rating', r); }} />
                                <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" rows={3} placeholder="Komentar tambahan (opsional)" value={ratingForm.data.rating_comment} onChange={(e) => ratingForm.setData('rating_comment', e.target.value)} />
                                <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={ratingForm.processing}>Kirim Rating</button>
                            </form>
                        </div>
                    )}

                    {ticket.rating && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-2 text-sm font-semibold text-slate-900">Rating Anda</h2>
                            <div className="flex items-center gap-1">
                                <RatingStars rating={ticket.rating ?? 0} readOnly size={20} />
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
                                <Icon name="category" size={18} className="text-slate-400" />
                                <div><dt className="text-slate-400">Kategori</dt><dd className="font-medium text-slate-900">{ticket.category?.name ?? '-'}</dd></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Icon name="person" size={18} className="text-slate-400" />
                                <div><dt className="text-slate-400">Pelapor</dt><dd className="font-medium text-slate-900">{ticket.reporter?.name ?? '-'}</dd></div>
                            </div>
                            {ticket.reporter?.department && (
                                <div className="flex items-start gap-3">
                                    <Icon name="apartment" size={18} className="text-slate-400" />
                                    <div><dt className="text-slate-400">Departemen</dt><dd className="font-medium text-slate-900">{ticket.reporter.department}</dd></div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <Icon name="support_agent" size={18} className="text-slate-400" />
                                <div><dt className="text-slate-400">Ditugaskan ke</dt><dd className="font-medium text-slate-900">{ticket.assignee?.name ?? 'Belum ditugaskan'}</dd></div>
                            </div>
                            {ticket.resolved_at && (
                                <div className="flex items-start gap-3">
                                    <Icon name="check_circle" size={18} className="text-slate-400" />
                                    <div><dt className="text-slate-400">Diselesaikan</dt><dd className="font-medium text-slate-900">{ticket.resolved_at}</dd></div>
                                </div>
                            )}
                            {ticket.cancelled_at && (
                                <div className="flex items-start gap-3">
                                    <Icon name="cancel" size={18} filled className="text-rose-500" />
                                    <div><dt className="text-slate-400">Dibatalkan</dt><dd className="font-medium text-rose-600">{ticket.cancelled_at}</dd></div>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>

            <ConfirmDialog open={showCancelConfirm} title="Batalkan Tiket" message="Yakin ingin membatalkan tiket ini? Tindakan ini tidak dapat diurungkan." confirmLabel="Batalkan Tiket" variant="danger" onConfirm={() => { cancelForm.post(`${ticketPath}/cancel`); setShowCancelConfirm(false); }} onCancel={() => setShowCancelConfirm(false)} />
            <ConfirmDialog open={showDeleteConfirm} title="Hapus Tiket" message="Yakin ingin menghapus tiket ini? Tindakan ini tidak dapat diurungkan." confirmLabel="Hapus" variant="danger" onConfirm={() => { router.delete(ticketPath); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
        </PortalLayout>
    );
});
