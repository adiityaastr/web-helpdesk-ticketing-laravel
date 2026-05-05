import { Link, router, usePage } from '@inertiajs/react';
import React, { useEffect, useRef } from 'react';
import PortalLayout from '../Layout';
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
    assignee: { id: number; name: string } | null;
    created_at: string | null;
};

type Props = {
    tickets: { data: TicketItem[] };
    filters: { status?: string; priority?: string; search?: string };
    statuses: string[];
    priorities: string[];
};

export default React.memo(function PortalTicketIndex({ tickets, filters, statuses, priorities }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const searchTimer = useRef<ReturnType<typeof setTimeout>>();

    const updateFilter = (key: string, value: string) => {
        router.get('/portal/tickets', { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const handleSearch = (value: string) => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            router.get('/portal/tickets', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
        }, 400);
    };

    useEffect(() => {
        return () => clearTimeout(searchTimer.current);
    }, []);

    return (
        <PortalLayout>
            <FlashMessage success={flash.success} />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Tiket Saya</h1>
                    <p className="text-sm text-slate-500">Kelola dan pantau status tiket Anda</p>
                </div>
                <Link href="/portal/tickets/create" className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
                    <Icon name="add" size={18} filled />
                    Buat Tiket Baru
                </Link>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari tiket..."
                        className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        defaultValue={filters.search ?? ''}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <select
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                    value={filters.status ?? ''}
                    onChange={(e) => updateFilter('status', e.target.value)}
                >
                    <option value="">Semua Status</option>
                    {statuses.map((s) => <option key={s} value={s}><Badge variant="status" value={s} /></option>)}
                </select>
                <select
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                    value={filters.priority ?? ''}
                    onChange={(e) => updateFilter('priority', e.target.value)}
                >
                    <option value="">Semua Prioritas</option>
                    {priorities.map((p) => <option key={p} value={p}><Badge variant="priority" value={p} /></option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {tickets.data.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <Icon name="inbox" size={48} className="text-slate-300" />
                        <p className="mt-2 text-slate-400">Belum ada tiket.</p>
                        <Link href="/portal/tickets/create" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Buat Tiket</Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {tickets.data.map((ticket) => (
                            <Link key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-slate-400">#{ticket.uuid?.slice(0, 8)}</span>
                                        <Badge variant="status" value={ticket.status} />
                                        <Badge variant="priority" value={ticket.priority} />
                                    </div>
                                    <h4 className="mt-1 truncate text-sm font-medium text-slate-900">{ticket.title}</h4>
                                    <p className="mt-0.5 text-xs text-slate-500">{ticket.category?.name ?? '-'} &middot; {ticket.assignee?.name ?? 'Belum ditugaskan'}</p>
                                </div>
                                <div className="text-right text-xs text-slate-400">{ticket.created_at ?? '-'}</div>
                                <Icon name="chevron_right" size={20} className="text-slate-300" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </PortalLayout>
    );
});
