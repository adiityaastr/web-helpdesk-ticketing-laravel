import { Link, router } from '@inertiajs/react';

type NotificationItem = {
    id: string;
    type: string;
    data: {
        ticket_id?: number;
        ticket_uuid?: string;
        title?: string;
        action?: string;
        comment_message?: string | null;
    };
    read_at: string | null;
    created_at: string | null;
};

type Props = {
    notifications: {
        data: NotificationItem[];
    };
};

const actionLabel: Record<string, string> = {
    created: 'dibuat',
    updated: 'diperbarui',
    commented: 'dikomentari',
    resolved: 'diselesaikan',
    closed: 'ditutup',
};

export default function NotificationsIndex({ notifications }: Props) {
    return (
        <div className="mx-auto max-w-3xl p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800">Notifikasi</h1>
                    <p className="text-sm text-slate-500">Riwayat aktivitas tiket terbaru</p>
                </div>
                <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => router.post('/notifications/read-all')}
                >
                    Tandai semua dibaca
                </button>
            </div>

            <div className="space-y-3">
                {notifications.data.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <p className="text-slate-500">Belum ada notifikasi.</p>
                    </div>
                )}
                {notifications.data.map((item) => (
                    <article key={item.id} className={`rounded-xl border p-4 shadow-sm ${item.read_at ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50'}`}>
                        <div className="mb-1 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-800">{item.data.title ?? 'Aktivitas tiket'}</p>
                            <span className="text-xs text-slate-500">{item.created_at ?? '-'}</span>
                        </div>
                        <p className="text-sm text-slate-600">
                            Tiket {actionLabel[item.data.action ?? ''] ?? item.data.action ?? 'diperbarui'}
                        </p>
                        {item.data.comment_message && (
                            <p className="mt-1 text-sm text-slate-700">{item.data.comment_message}</p>
                        )}
                        {!item.read_at && <span className="mt-2 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Baru</span>}
                    </article>
                ))}
            </div>
        </div>
    );
}