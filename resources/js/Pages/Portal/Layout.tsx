import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

type NavItem = {
    href: string;
    label: string;
    icon: string;
    active: boolean;
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const user = usePage<{ auth: { user: { name: string; email: string } }; notifications: { unread_count: number } }>().props.auth.user;
    const unreadCount = usePage().props.notifications.unread_count;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems: NavItem[] = [
        { href: '/portal/dashboard', label: 'Dashboard', icon: '🏠', active: currentPath === '/portal/dashboard' },
        { href: '/portal/tickets', label: 'Tiket Saya', icon: '📋', active: currentPath.startsWith('/portal/tickets') },
        { href: '/portal/knowledge-base', label: 'Pusat Bantuan', icon: '📖', active: currentPath.startsWith('/portal/knowledge-base') },
    ];

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-slate-200 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">H</div>
                    <span className="text-lg font-bold text-slate-800">Helpdesk</span>
                </div>

                <nav className="mt-4 space-y-1 px-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${item.active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <div className="flex flex-1 flex-col lg:ml-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>

                    <Link href="/portal/tickets/create" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
                        + Buat Tiket
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unreadCount}</span>
                            )}
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-slate-800">{user.name}</p>
                                <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-rose-600">Keluar</button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}