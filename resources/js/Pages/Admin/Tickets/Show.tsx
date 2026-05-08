import React, { FormEvent, useState } from 'react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '../Layout';
import Icon from '@/Components/Icon';
import FlashMessage from '@/Components/FlashMessage';
import Badge from '@/Components/Badge';
import CommentSection, { type Comment } from '@/Components/CommentSection';
import RatingStars from '@/Components/RatingStars';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { statusLabel, priorityLabel } from '@/Utils/badges';

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
    category: { id: number; name: string } | null;
    reporter: { id: number; name: string; department: string | null } | null;
    assignee: { id: number; name: string } | null;
};

type ActivityLog = { id: number; action: string; description: string | null; created_at: string | null; user: { name: string } | null };
type CategoryOption = { id: number; name: string };
type StaffOption = { id: number; name: string };

type Props = {
    ticket: Ticket | { data: Ticket };
    comments: Comment[];
    activityLogs: ActivityLog[];
    categories: CategoryOption[];
    staffUsers: StaffOption[];
    statuses: string[];
    priorities: string[];
};

export default React.memo(function AdminTicketShow({ ticket: ticketProp, comments, activityLogs, categories, staffUsers, statuses, priorities }: Props) {
    const ticket = ('data' in ticketProp ? ticketProp.data : ticketProp) as Ticket;
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [showInternal, setShowInternal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [commentProcessing, setCommentProcessing] = useState(false);
    const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
    const commentLocked = ticket.status === 'closed' || ticket.status === 'cancelled';

    const updateForm = useForm({
        priority: ticket.priority ?? 'medium',
        status: ticket.status && ticket.status !== 'open' ? ticket.status : '',
        assigned_to: String(ticket.assignee?.id ?? ''),
    });

    const submitUpdate = (e: FormEvent) => {
        e.preventDefault();
        updateForm.put(`/admin/tickets/${ticket.id}`, {
            onSuccess: () => router.reload({ only: ['ticket', 'comments', 'activityLogs'] }),
        });
    };

    const handleCommentSubmit = (data: { message: string; is_internal?: boolean; attachments: File[] }) => {
        setCommentProcessing(true);
        setCommentErrors({});

        const formData = new FormData();
        formData.append('message', data.message);
        if (data.is_internal) {
            formData.append('is_internal', '1');
        }
        data.attachments.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });

        router.post(`/admin/tickets/${ticket.id}/comments`, formData as any, {
            onSuccess: () => {
                setCommentProcessing(false);
                router.reload({ only: ['ticket', 'comments', 'activityLogs'] });
            },
            onError: (errors) => {
                setCommentErrors(errors as Record<string, string>);
                setCommentProcessing(false);
            },
        });
    };

    return (
        <AdminLayout>
            <FlashMessage success={flash.success} error={flash.error} />

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-semibold text-slate-900">{ticket.title}</h1>
                        <Badge variant="status" value={ticket.status} />
                        <Badge variant="priority" value={ticket.priority} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">#{ticket.uuid?.slice(0, 8)} -- Dibuat {ticket.created_at}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/tickets" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Kembali</Link>
                    <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50">Hapus</button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <h2 className="mb-3 text-sm font-semibold text-slate-900">Deskripsi</h2>
                        <p className="whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>
                    </div>

                    {!commentLocked && (
                        <form onSubmit={submitUpdate} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
                            <h2 className="text-sm font-semibold text-slate-900">Kelola Tiket</h2>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                                    <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={updateForm.data.status} onChange={(e) => updateForm.setData('status', e.target.value)}>
                                        <option value="" disabled>Pilih status...</option>
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
                            <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50" disabled={updateForm.processing}>Simpan Perubahan</button>
                        </form>
                    )}

                    {commentLocked && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Icon name="lock" size={16} />
                                Tiket sudah ditutup dan tidak dapat diubah lagi.
                            </div>
                        </div>
                    )}

                    <CommentSection
                        comments={comments}
                        isLocked={commentLocked}
                        isInternal={showInternal}
                        onSubmit={handleCommentSubmit}
                        onToggleInternal={setShowInternal}
                        processing={commentProcessing}
                        errors={commentErrors}
                    />
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
                            {ticket.resolved_at && <div><dt className="text-slate-400">Diselesaikan</dt><dd className="font-medium text-slate-900">{ticket.resolved_at}</dd></div>}
                            {ticket.resolved_confirmed_at && <div><dt className="text-slate-400">Dikonfirmasi</dt><dd className="font-medium text-emerald-600">{ticket.resolved_confirmed_at}</dd></div>}
                            {ticket.cancelled_at && <div><dt className="text-slate-400">Dibatalkan</dt><dd className="font-medium text-rose-600">{ticket.cancelled_at}</dd></div>}
                        </dl>
                    </div>

                    {ticket.rating != null && (
                        <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
                            <h3 className="mb-2 text-sm font-semibold text-teal-900">Rating Pengguna</h3>
                            <div className="flex items-center gap-1">
                                <RatingStars rating={ticket.rating} readOnly size={24} />
                                <span className="ml-2 text-sm font-semibold text-teal-700">({ticket.rating}/5)</span>
                            </div>
                            {ticket.rating_comment && <p className="mt-2 text-sm text-teal-700">{ticket.rating_comment}</p>}
                        </div>
                    )}

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

            <ConfirmDialog open={showDeleteConfirm} title="Hapus Tiket" message="Yakin ingin menghapus tiket ini?" confirmLabel="Hapus" variant="danger" onConfirm={() => { router.delete(`/admin/tickets/${ticket.id}`); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
        </AdminLayout>
    );
});
