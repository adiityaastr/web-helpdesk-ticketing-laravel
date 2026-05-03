import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../Admin/Layout';
import PortalLayout from '../Portal/Layout';

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
    cancelled: 'dibatalkan',
};

const actionIcon: Record<string, string> = {
    created: 'add_circle',
    updated: 'update',
    commented: 'chat',
    resolved: 'check_circle',
    closed: 'lock',
    cancelled: 'cancel',
};

export default function NotificationsIndex({ notifications }: Props) {
    const roles = usePage<{ auth: { user: { roles: string[] } } }>().props.auth.user?.roles ?? [];
    const isStaffOrAdmin = roles.includes('staff');

    const content = (
        <>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Notifikasi</h1>
                    <p className="text-sm text-slate-500">Riwayat aktivitas tiket terbaru</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => router.post('/notifications/read-all')}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>done_all</span>
                    Tandai semua dibaca
                </button>
            </div>

            <div className="space-y-2">
                {notifications.data.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                        <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '48px' }}>notifications_off</span>
                        <p className="mt-2 text-slate-400">Belum ada notifikasi.</p>
                    </div>
                )}
                {notifications.data.map((item) => (
                    <article key={item.id} className={`rounded-lg border p-4 ${item.read_at ? 'border-slate-200 bg-white' : 'border-teal-200 bg-teal-50'}`}>
                        <div className="mb-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>{actionIcon[item.data.action ?? 'update'] ?? 'update'}</span>
                                <p className="text-sm font-medium text-slate-900">{item.data.title ?? 'Aktivitas tiket'}</p>
                            </div>
                            <span className="text-xs text-slate-400">{item.created_at ?? '-'}</span>
                        </div>
                        <p className="text-sm text-slate-500">
                            Tiket {actionLabel[item.data.action ?? ''] ?? item.data.action ?? 'diperbarui'}
                        </p>
                        {item.data.comment_message && (
                            <p className="mt-1 text-sm text-slate-600">{item.data.comment_message}</p>
                        )}
                        {!item.read_at && <span className="mt-2 inline-block rounded bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">Baru</span>}
                    </article>
                ))}
            </div>
        </>
    );

    if (isStaffOrAdmin) {
        return <AdminLayout>{content}</AdminLayout>;
    }

    return <PortalLayout>{content}</PortalLayout>;
}