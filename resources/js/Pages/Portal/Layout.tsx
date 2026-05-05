import { Link, usePage } from '@inertiajs/react';
import AppShell from '../../Components/AppShell';
import Icon from '@/Components/Icon';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const user = usePage<{ auth: { user: { name: string; email: string } }; notifications: { unread_count: number } }>().props.auth.user;
    const unreadCount = (usePage().props.notifications as { unread_count?: number } | undefined)?.unread_count ?? 0;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems = [
        { href: '/portal/dashboard', label: 'Dashboard', icon: 'dashboard', active: currentPath === '/portal/dashboard' },
        { href: '/portal/tickets', label: 'Tiket Saya', icon: 'mail', active: currentPath.startsWith('/portal/tickets') },
        { href: '/portal/knowledge-base', label: 'Basis Pengetahuan', icon: 'article', active: currentPath.startsWith('/portal/knowledge-base') },
    ];

    return (
        <AppShell
            navItems={navItems}
            user={user}
            unreadCount={unreadCount}
            variant="portal"
            actions={
                <Link
                    href="/portal/tickets/create"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                    <Icon name="add" size={18} filled />
                    Buat Tiket Baru
                </Link>
            }
        >
            {children}
        </AppShell>
    );
}
