import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

type NavItem = {
    href: string;
    label: string;
    icon: string;
    active: boolean;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = usePage<{ auth: { user: { name: string } }; notifications: { unread_count: number } }>().props.auth.user;
    const unreadCount = usePage().props.notifications.unread_count;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems: NavItem[] = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', active: currentPath === '/admin/dashboard' },
        { href: '/admin/tickets', label: 'Kelola Tiket', icon: 'mail', active: currentPath.startsWith('/admin/tickets') },
        { href: '/admin/users', label: 'Pengguna', icon: 'people', active: currentPath.startsWith('/admin/users') },
        { href: '/admin/categories', label: 'Kategori', icon: 'category', active: currentPath.startsWith('/admin/categories') },
        { href: '/admin/knowledge-base', label: 'Pusat Bantuan', icon: 'article', active: currentPath.startsWith('/admin/knowledge-base') },
        { href: '/admin/templates', label: 'Template Respon', icon: 'description', active: currentPath.startsWith('/admin/templates') },
    ];

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex-shrink-0 transform border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>support_agent</span>
                    </div>
                    <div>
                        <span className="text-lg font-semibold text-slate-900">Helpdesk</span>
                        <span className="ml-1.5 rounded bg-teal-600 px-1.5 py-0.5 text-[10px] font-medium text-white">ADMIN</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                item.active
                                    ? 'bg-teal-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <span className={`material-symbols-outlined ${item.active ? 'text-white' : 'text-slate-400'}`} style={{ fontSize: '20px', ...(item.active ? { fontVariationSettings: "'FILL' 1" } : {}) }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-slate-100 p-4">
                    <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 cursor-pointer" onClick={handleLogout}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500 hover:text-rose-600">Keluar</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-slate-400" style={{ fontSize: '18px' }}>logout</span>
                    </div>
                </div>
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <div className="flex flex-1 flex-col lg:ml-72">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 lg:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu</span>
                    </button>

                    <div className="hidden h-9 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 lg:flex lg:max-w-sm">
                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>search</span>
                        <input
                            type="text"
                            placeholder="Cari..."
                            className="flex-1 border-none bg-transparent text-sm text-slate-600 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">{unreadCount}</span>
                            )}
                        </Link>
                    </div>
                </header>

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}