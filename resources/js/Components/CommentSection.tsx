import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';

export type Comment = {
    id: number;
    message: string;
    is_internal: boolean;
    attachments: string[];
    created_at: string | null;
    user: { id: number | null; name: string | null };
};

type CommentSectionProps = {
    comments: Comment[];
    isLocked: boolean;
    isInternal?: boolean;
    onSubmit: (data: { message: string; is_internal?: boolean; attachments: File[] }) => void;
    onToggleInternal?: (value: boolean) => void;
    processing?: boolean;
    errors?: { message?: string; attachments?: string };
};

export default function CommentSection({
    comments,
    isLocked,
    isInternal = false,
    onSubmit,
    onToggleInternal,
    processing = false,
    errors = {},
}: CommentSectionProps) {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevProcessing = useRef(processing);

    useEffect(() => {
        if (prevProcessing.current && !processing && !errors.message && !errors.attachments) {
            setMessage('');
            setAttachments([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
        prevProcessing.current = processing;
    }, [processing, errors.message, errors.attachments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            message,
            ...(onToggleInternal ? { is_internal: isInternal } : {}),
            attachments,
        });
    };

    const showInternalToggle = !isLocked && !!onToggleInternal;

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                    Komentar{onToggleInternal ? ' & Catatan' : ''} ({comments.length})
                </h2>
                {showInternalToggle && (
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => onToggleInternal(e.target.checked)}
                            className="rounded border-slate-300"
                        />
                        <span className="text-slate-500">Catatan Internal</span>
                    </label>
                )}
            </div>

            {isLocked ? (
                <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '16px' }}>lock</span>
                    Kolom komentar ditutup — tiket sudah selesai.
                    <p className="mt-1 text-xs text-slate-400">
                        Jika kendala belum terselesaikan, silakan buat{' '}
                        <Link href="/portal/tickets/create" className="font-medium underline hover:text-slate-600">
                            tiket baru
                        </Link>.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="mb-6 space-y-3">
                    <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        rows={3}
                        placeholder={isInternal ? 'Tulis catatan internal...' : 'Tulis komentar...'}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    {errors.message && <p className="text-xs text-rose-600">{errors.message}</p>}
                    {errors.attachments && <p className="text-xs text-rose-600">{errors.attachments}</p>}
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-teal-700"
                            onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
                        />
                        <button
                            type="submit"
                            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                            disabled={processing}
                        >
                            {isInternal ? 'Simpan Catatan' : 'Kirim'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {comments.length === 0 && <p className="text-sm text-slate-400">Belum ada komentar.</p>}
                {comments.map((comment) => (
                    <div
                        key={comment.id}
                        className={`rounded-md border p-4 ${
                            comment.is_internal
                                ? 'border-amber-200 bg-amber-50'
                                : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                        <div className="mb-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900">{comment.user.name ?? 'User'}</span>
                                {comment.is_internal && (
                                    <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                        Internal
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-slate-400">{comment.created_at ?? '-'}</span>
                        </div>
                        <p className="text-sm text-slate-600">{comment.message}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {comment.attachments.map((a, i) => (
                                    <a
                                        key={i}
                                        href={`/storage/${a}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline"
                                    >
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
    );
}