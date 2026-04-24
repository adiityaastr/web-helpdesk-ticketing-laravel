import { FormEvent, useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '../Layout';

type UserItem = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    roles: string[];
    created_at: string | null;
};

type Props = {
    users: { data: UserItem[] };
    filters: { search?: string; role?: string };
    roles: string[];
};

const roleBadge = (role: string) => {
    const map: Record<string, string> = { admin: 'bg-rose-100 text-rose-700', staff: 'bg-blue-100 text-blue-700', customer: 'bg-green-100 text-green-700' };
    return map[role] ?? 'bg-slate-100 text-slate-700';
};

const roleLabel: Record<string, string> = { admin: 'Admin', staff: 'Staff IT', customer: 'Pengguna' };

export default function UserIndex({ users, filters, roles }: Props) {
    const page = usePage<{ flash: { success?: string; error?: string }; auth: { user: { id: number } } }>();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        department: '',
        password: '',
        role: 'customer',
    });

    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        department: '',
        password: '',
        role: 'customer',
    });

    const updateFilter = (key: string, value: string) => {
        router.get('/admin/users', { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const openCreate = () => {
        setEditingUser(null);
        createForm.reset();
        setShowModal(true);
    };

    const openEdit = (user: UserItem) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            department: user.department ?? '',
            password: '',
            role: user.roles[0] ?? 'customer',
        });
        setShowModal(true);
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/users', {
            onSuccess: () => { setShowModal(false); createForm.reset(); },
        });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        editForm.put(`/admin/users/${editingUser.id}`, {
            onSuccess: () => { setShowModal(false); },
        });
    };

    return (
        <AdminLayout>
            {page.props.flash.success && <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{page.props.flash.success}</div>}
            {page.props.flash.error && <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{page.props.flash.error}</div>}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kelola Pengguna</h1>
                    <p className="text-sm text-slate-500">Kelola akun pengguna dan peran mereka</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">+ Tambah Pengguna</button>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <input type="text" placeholder="Cari pengguna..." className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm" defaultValue={filters.search ?? ''} onChange={(e) => updateFilter('search', e.target.value)} />
                <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm" value={filters.role ?? ''} onChange={(e) => updateFilter('role', e.target.value)}>
                    <option value="">Semua Peran</option>
                    {roles.map((r) => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                            <th className="px-5 py-3 font-medium">Nama</th>
                            <th className="px-5 py-3 font-medium">Email</th>
                            <th className="px-5 py-3 font-medium">Departemen</th>
                            <th className="px-5 py-3 font-medium">Peran</th>
                            <th className="px-5 py-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.map((user) => (
                            <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-5 py-3 font-medium text-slate-800">{user.name}</td>
                                <td className="px-5 py-3 text-slate-600">{user.email}</td>
                                <td className="px-5 py-3 text-slate-600">{user.department ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.map((role) => (
                                            <span key={role} className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge(role)}`}>{roleLabel[role] ?? role}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(user)} className="text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                                        {user.id !== page.props.auth.user?.id && (
                                            <button onClick={() => { if (confirm('Yakin ingin menghapus?')) router.delete(`/admin/users/${user.id}`); }} className="text-sm text-rose-600 hover:text-rose-800">Hapus</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>

                        {editingUser ? (
                            <form onSubmit={submitEdit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
                                    <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                    {editForm.errors.name && <p className="mt-1 text-xs text-rose-600">{editForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                    <input type="email" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                                    {editForm.errors.email && <p className="mt-1 text-xs text-rose-600">{editForm.errors.email}</p>}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Telepon</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Departemen</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={editForm.data.department} onChange={(e) => editForm.setData('department', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Password (kosongkan jika tidak diubah)</label>
                                    <input type="password" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={editForm.data.password} onChange={(e) => editForm.setData('password', e.target.value)} />
                                    {editForm.errors.password && <p className="mt-1 text-xs text-rose-600">{editForm.errors.password}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Peran</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={editForm.data.role} onChange={(e) => editForm.setData('role', e.target.value)}>
                                        {roles.map((r) => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" disabled={editForm.processing}>Simpan</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
                                    <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} />
                                    {createForm.errors.name && <p className="mt-1 text-xs text-rose-600">{createForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                    <input type="email" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={createForm.data.email} onChange={(e) => createForm.setData('email', e.target.value)} />
                                    {createForm.errors.email && <p className="mt-1 text-xs text-rose-600">{createForm.errors.email}</p>}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Telepon</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={createForm.data.phone} onChange={(e) => createForm.setData('phone', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Departemen</label>
                                        <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={createForm.data.department} onChange={(e) => createForm.setData('department', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                                    <input type="password" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={createForm.data.password} onChange={(e) => createForm.setData('password', e.target.value)} />
                                    {createForm.errors.password && <p className="mt-1 text-xs text-rose-600">{createForm.errors.password}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Peran</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={createForm.data.role} onChange={(e) => createForm.setData('role', e.target.value)}>
                                        {roles.map((r) => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700" disabled={createForm.processing}>Tambah</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}