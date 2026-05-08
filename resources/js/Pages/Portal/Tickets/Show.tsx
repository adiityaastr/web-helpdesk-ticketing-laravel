import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
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
    const [ratingValue, setRatingValue] = useState(5);
    const [showReject, setShowReject] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showConfirmResolutionDialog, setShowConfirmResolutionDialog] = useState(false);
    const [showRatingDialog, setShowRatingDialog] = useState(false);
    const [commentProcessing, setCommentProcessing] = useState(false);
    const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
    const [ratingProcessing, setRatingProcessing] = useState(false);
    const [ratingData, setRatingData] = useState({ rating_comment: '' });
    const [cancelProcessing, setCancelProcessing] = useState(false);
    const [confirmProcessing, setConfirmProcessing] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const commentLocked = ticket.status === 'closed' || ticket.status === 'cancelled';

    const ticketPath = `/portal/tickets/${ticket.id}`;

    const handleCommentSubmit = (data: { message: string; attachments: File[] }) => {
        console.log('Comment data:', data);
        setCommentProcessing(true);
        setCommentErrors({});

        if (data.attachments && data.attachments.length > 0) {
            const formData = new FormData();
            formData.append('message', data.message);
            data.attachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });
            router.post(`${ticketPath}/comments`, formData as any, {
                onSuccess: () => {
                    setCommentProcessing(false);
                    router.reload({ only: ['ticket', 'comments'] });
                },
                onError: (errors) => {
                    setCommentErrors(errors as Record<string, string>);
                    setCommentProcessing(false);
                },
            });
        } else {
            router.post(`${ticketPath}/comments`, {
                message: data.message,
            }, {
                onSuccess: () => {
                    setCommentProcessing(false);
                    router.reload({ only: ['ticket', 'comments'] });
                },
                onError: (errors) => {
                    setCommentErrors(errors as Record<string, string>);
                    setCommentProcessing(false);
                },
            });
        }
    };

    const submitRating = () => {
        if (ratingValue < 1) {
            alert('Pilih rating terlebih dahulu');
            return;
        }
        setRatingProcessing(true);
        router.post(`${ticketPath}/rate`, {
            rating: ratingValue,
            rating_comment: ratingData.rating_comment,
        }, {
            onSuccess: () => {
                setShowRatingDialog(false);
                setRatingProcessing(false);
            },
            onError: (errors) => {
                setRatingProcessing(false);
                alert('Gagal mengirim rating: ' + (errors.rating ?? Object.values(errors).join(', ')));
            },
        });
    };

    const handleConfirmResolution = () => {
        setConfirmProcessing(true);
        router.post(`${ticketPath}/confirm`, {}, {
            onSuccess: () => {
                setConfirmProcessing(false);
                setShowConfirmResolutionDialog(false);
                setShowRatingDialog(true);
            },
            onError: () => {
                setConfirmProcessing(false);
            },
        });
    };

    const handleRejectResolution = () => {
        setRejectProcessing(true);
        router.post(`${ticketPath}/reject`, { reason: rejectReason }, {
            onSuccess: () => {
                setRejectProcessing(false);
                setShowReject(false);
                setRejectReason('');
                router.reload({ only: ['ticket'] });
            },
            onError: () => {
                setRejectProcessing(false);
            },
        });
    };

    const handleCancelTicket = () => {
        setCancelProcessing(true);
        router.post(`${ticketPath}/cancel`, {}, {
            onSuccess: () => {
                setCancelProcessing(false);
                setShowCancelConfirm(false);
                router.reload({ only: ['ticket'] });
            },
            onError: () => {
                setCancelProcessing(false);
            },
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
                        <button onClick={() => setShowCancelConfirm(true)} className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50" disabled={cancelProcessing}>Batalkan</button>
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
                        processing={commentProcessing}
                        errors={commentErrors}
                    />

                    {ticket.status === 'resolved' && !ticket.resolved_confirmed_at && (
                        <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
                            <h2 className="mb-2 text-sm font-semibold text-teal-900">Konfirmasi Penyelesaian</h2>
                            <p className="mb-4 text-sm text-teal-700">Admin telah menyelesaikan tiket ini. Apakah permasalahan Anda sudah diperbaiki?</p>
                            {!showReject ? (
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowConfirmResolutionDialog(true)} className="rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">Ya, Sudah Selesai</button>
                                    <button type="button" onClick={() => setShowReject(true)} className="rounded-md border border-rose-200 bg-white px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">Belum, Masih Ada Masalah</button>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); handleRejectResolution(); }} className="space-y-3">
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" rows={3} placeholder="Jelaskan kendala yang masih terjadi..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                                    <div className="flex gap-3">
                                        <button type="submit" className="rounded-md bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50" disabled={rejectProcessing}>Kirim & Buka Kembali</button>
                                        <button type="button" onClick={() => { setShowReject(false); setRejectReason(''); }} className="rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {(ticket.status === 'resolved' || ticket.status === 'closed') && ticket.resolved_confirmed_at && ticket.rating == null && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="mb-3 text-sm font-semibold text-slate-900">Beri Rating</h2>
                            <p className="mb-4 text-sm text-slate-500">Tiket Anda sudah diselesaikan. Beri penilaian untuk layanan kami.</p>
                            <div className="space-y-4">
                                <div>
                                    <RatingStars rating={ratingValue} onChange={setRatingValue} />
                                </div>
                                <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" rows={3} placeholder="Komentar tambahan (opsional)" value={ratingData.rating_comment} onChange={(e) => setRatingData({ ...ratingData, rating_comment: e.target.value })} />
                                <button type="button" onClick={submitRating} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={ratingProcessing}>Kirim Rating</button>
                            </div>
                        </div>
                    )}

                    {ticket.rating != null && (
                        <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
                            <h2 className="mb-3 text-sm font-semibold text-teal-900">Rating Anda</h2>
                            <div className="flex items-center gap-2">
                                <RatingStars rating={ticket.rating ?? 0} readOnly size={24} />
                                <span className="text-sm font-semibold text-teal-700">({ticket.rating}/5)</span>
                            </div>
                            {ticket.rating_comment && <p className="mt-3 text-sm text-teal-700">{ticket.rating_comment}</p>}
                            <p className="mt-2 text-xs text-teal-500">Terima kasih atas penilaian Anda!</p>
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

            <ConfirmDialog open={showCancelConfirm} title="Batalkan Tiket" message="Yakin ingin membatalkan tiket ini? Tindakan ini tidak dapat diurungkan." confirmLabel="Batalkan Tiket" variant="danger" onConfirm={handleCancelTicket} onCancel={() => setShowCancelConfirm(false)} />
            <ConfirmDialog open={showDeleteConfirm} title="Hapus Tiket" message="Yakin ingin menghapus tiket ini? Tindakan ini tidak dapat diurungkan." confirmLabel="Hapus" variant="danger" onConfirm={() => { router.delete(ticketPath); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
            
            <ConfirmDialog 
                open={showConfirmResolutionDialog} 
                title="Konfirmasi Penyelesaian Tiket" 
                message="Apakah Anda yakin bahwa masalah pada tiket ini sudah diselesaikan dengan baik? Setelah dikonfirmasi, tiket akan ditutup dan Anda akan diminta untuk memberikan rating." 
                confirmLabel="Ya, Konfirmasi Selesai" 
                variant="success"
                onConfirm={handleConfirmResolution}
                onCancel={() => setShowConfirmResolutionDialog(false)} 
            />

            {showRatingDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setShowRatingDialog(false); }}>
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Beri Rating Layanan</h3>
                            <button onClick={() => setShowRatingDialog(false)} className="text-slate-400 hover:text-slate-600">
                                <Icon name="close" size={20} />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-slate-600">Tiket Anda telah dikonfirmasi selesai. Berikan penilaian untuk layanan yang Anda terima.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Rating Anda</label>
                                <RatingStars rating={ratingValue} onChange={setRatingValue} size={32} />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Komentar (Opsional)</label>
                                <textarea 
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500" 
                                    rows={3} 
                                    placeholder="Bagikan pengalaman Anda..." 
                                    value={ratingData.rating_comment} 
                                    onChange={(e) => setRatingData({ ...ratingData, rating_comment: e.target.value })} 
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={submitRating} className="flex-1 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={ratingProcessing}>
                                    Kirim Rating
                                </button>
                                <button type="button" onClick={() => setShowRatingDialog(false)} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                                    Nanti Saja
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
});
