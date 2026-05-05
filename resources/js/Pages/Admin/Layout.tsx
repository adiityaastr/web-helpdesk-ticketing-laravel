import { usePage } from '@inertiajs/react';
import AppShell from '../../Components/AppShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = usePage<{ auth: { user: { name: string; email: string } }; notifications: { unread_count: number } }>().props.auth.user;
    const unreadCount = (usePage().props.notifications as { unread_count?: number } | undefined)?.unread_count ?? 0;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', active: currentPath === '/admin/dashboard' },
        { href: '/admin/tickets', label: 'Kelola Tiket', icon: 'mail', active: currentPath.startsWith('/admin/tickets') },
        { href: '/admin/users', label: 'Pengguna', icon: 'people', active: currentPath.startsWith('/admin/users') },
        { href: '/admin/categories', label: 'Kategori', icon: 'category', active: currentPath.startsWith('/admin/categories') },
        { href: '/admin/departments', label: 'Departemen', icon: 'apartment', active: currentPath.startsWith('/admin/departments') },
        { href: '/admin/knowledge-base', label: 'Pusat Bantuan', icon: 'article', active: currentPath.startsWith('/admin/knowledge-base') },
    ];

    return (
        <AppShell navItems={navItems} user={user} unreadCount={unreadCount} variant="admin">
            {children}
        </AppShell>
    );
}