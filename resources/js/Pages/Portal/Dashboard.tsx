import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import PortalLayout from './Layout';
import Icon from '@/Components/Icon';
import FlashMessage from '@/Components/FlashMessage';
import Badge from '@/Components/Badge';

type TicketItem = {
    id: number;
    uuid: string;
    title: string;
    priority: string;
    status: string;
    category: { id: number; name: string } | null;
    created_at: string | null;
};

type Props = {
    recentTickets: TicketItem[];
    stats: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
    };
};

export default React.memo(function PortalDashboard({ recentTickets, stats }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    return (
        <PortalLayout>
            <FlashMessage success={flash.success} />

            <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Halo, {usePage<{ auth: { user: { name: string } } }>().props.auth?.user?.name?.split(' ')[0] ?? 'Pengguna'}</h2>
                <p className="mt-1 text-sm text-slate-500">Selamat datang kembali di pusat bantuan teknis.</p>
            </section>

            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tiket Aktif</p>
                    <p className="mt-1 text-3xl font-bold text-teal-600">{stats.open + stats.in_progress}</p>
                    <div className="mt-3 flex gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-xs text-slate-600">{stats.open} Terbuka</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            <span className="text-xs text-slate-600">{stats.in_progress} Diproses</span>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Tiket</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{stats.total}</p>
                    <p className="mt-1 text-xs text-slate-400">Sepanjang waktu</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Diselesaikan</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{stats.resolved}</p>
                    <p className="mt-1 text-xs text-slate-400">Tiket selesai</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <Link href="/portal/tickets/create" className="flex h-full flex-col items-center justify-center gap-2 text-teal-600 transition hover:text-teal-700">
                        <Icon name="add_circle" size={28} />
                        <span className="text-sm font-medium">Buat Tiket Baru</span>
                    </Link>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Tiket Terbaru</h3>
                        <Link href="/portal/tickets" className="text-sm font-medium text-teal-600 hover:text-teal-700">Lihat Semua</Link>
                    </div>

                    {recentTickets.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
                            <Icon name="inbox" size={48} className="text-slate-300" />
                            <p className="mt-2 text-sm text-slate-400">Anda belum memiliki tiket.</p>
                            <Link href="/portal/tickets/create" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                                <Icon name="add" size={18} filled />
                                Buat Tiket Pertama
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <div className="divide-y divide-slate-100">
                                {recentTickets.map((ticket) => (
                                    <Link key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-slate-400">#{ticket.uuid?.slice(0, 8)}</span>
                                                <Badge variant="status" value={ticket.status} />
                                            </div>
                                            <h4 className="mt-1 truncate text-sm font-medium text-slate-900">{ticket.title}</h4>
                                            <p className="mt-0.5 text-xs text-slate-500">{ticket.created_at ?? '-'}</p>
                                        </div>
                                        <Icon name="chevron_right" size={20} className="text-slate-300" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Basis Pengetahuan</h3>
                    <div className="space-y-3">
                        <Link href="/portal/knowledge-base" className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-teal-300">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                                    <Icon name="article" size={20} className="text-teal-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900">Artikel Bantuan</h4>
                                    <p className="text-xs text-slate-500">Temukan solusi untuk masalah umum</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
});
