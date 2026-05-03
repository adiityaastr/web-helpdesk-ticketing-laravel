import React, { FormEvent, useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '../Layout';

type UserItem = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    employee_number: string | null;
    position: string | null;
    department: string | null;
    roles: string[];
    created_at: string | null;
};

type Props = {
    users: { data: UserItem[] };
    filters: { search?: string; role?: string };
    roles: string[];
    positions: string[];
    departments: { id: number; name: string }[];
};

const roleBadge = (role: string) => {
    const map: Record<string, string> = { staff: 'bg-blue-50 text-blue-700', customer: 'bg-slate-100 text-slate-600' };
    return map[role] ?? 'bg-slate-100 text-slate-600';
};

const roleLabel: Record<string, string> = { staff: 'Staff IT', customer: 'Pengguna' };

const positionBadge = (position: string) => {
    const map: Record<string, string> = {
        Manager: 'bg-teal-50 text-teal-700',
        SPV: 'bg-blue-50 text-blue-700',
        Staff: 'bg-slate-100 text-slate-600'
    };
    return map[position] ?? 'bg-slate-100 text-slate-600';
};

export default React.memo(function UserIndex({ users, filters, roles, positions, departments }: Props) {
    const page = usePage<{ flash: { success?: string; error?: string }; auth: { user: { id: number } } }>();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const createForm = useForm({
        employee_number: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        department_id: '',
        password: '',
        role: 'customer',
    });

    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        position: '',
        department_id: '',
        password: '',
        role: 'customer',
    });

    const updateFilter = (key: string, value: string) => {
        router.get('/admin/users', { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const openCreate = () => {
        setEditingUser(null);
        createForm.reset();
        const nip = String(Math.floor(10000000 + Math.random() * 90000000));
        createForm.setData({
            ...createForm.data,
            employee_number: nip,
            email: `${nip}@company.com`,
        });
        setShowPassword(false);
        setShowModal(true);
    };

    const openEdit = (user: UserItem) => {
        setEditingUser(user);
        const dept = departments.find(d => d.name === user.department);
        editForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            position: user.position ?? '',
            department_id: dept ? String(dept.id) : '',
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
            {page.props.flash.success && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{page.props.flash.success}</div>}
            {page.props.flash.error && <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{page.props.flash.error}</div>}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Kelola Pengguna</h1>
                    <p className="text-sm text-slate-500">Kelola akun pengguna dan peran mereka</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Tambah Pengguna</button>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input type="text" placeholder="Cari pengguna..." className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" defaultValue={filters.search ?? ''} onChange={(e) => updateFilter('search', e.target.value)} />
                <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={filters.role ?? ''} onChange={(e) => updateFilter('role', e.target.value)}>
                    <option value="">Semua Peran</option>
                    {roles.map((r) => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 text-left">
                        <tr>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nama</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Departemen</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Peran</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">NIP</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Jabatan</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.map((user) => (
                            <tr key={user.id} className="border-b border-slate-100 last:border-0">
                                <td className="px-5 py-3 font-medium text-slate-900">{user.name}</td>
                                <td className="px-5 py-3 text-slate-500">{user.email}</td>
                                <td className="px-5 py-3 text-slate-500">{user.department ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.map((role) => (
                                            <span key={role} className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadge(role)}`}>{roleLabel[role] ?? role}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-5 py-3 font-mono text-slate-400">{user.employee_number ?? '-'}</td>
                                <td className="px-5 py-3">
                                    {user.position ? (
                                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${positionBadge(user.position)}`}>{user.position}</span>
                                    ) : '-'}
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-3">
                                        <button onClick={() => openEdit(user)} className="text-sm text-teal-600 hover:text-teal-700">Edit</button>
                                        {user.id !== page.props.auth.user?.id && (
                                            <button onClick={() => { if (confirm('Yakin ingin menghapus?')) router.delete(`/admin/users/${user.id}`); }} className="text-sm text-rose-600 hover:text-rose-700">Hapus</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-sm font-semibold text-slate-900">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}</h2>

                        {editingUser ? (
                            <form onSubmit={submitEdit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                    {editForm.errors.name && <p className="mt-1 text-xs text-rose-600">{editForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                                    <input type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                                    {editForm.errors.email && <p className="mt-1 text-xs text-rose-600">{editForm.errors.email}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Telepon</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Departemen</label>
                                        <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.department_id} onChange={(e) => editForm.setData('department_id', e.target.value)}>
                                            <option value="">Pilih departemen</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Jabatan</label>
                                        <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.position} onChange={(e) => editForm.setData('position', e.target.value)}>
                                            <option value="">Pilih jabatan</option>
                                            {positions.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">NIP</label>
                                    <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">{editingUser?.employee_number ?? '-'}</div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Password (kosongkan jika tidak diubah)</label>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.password} onChange={(e) => editForm.setData('password', e.target.value)} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                    {editForm.errors.password && <p className="mt-1 text-xs text-rose-600">{editForm.errors.password}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Peran</label>
                                    <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.role} onChange={(e) => editForm.setData('role', e.target.value)}>
                                        {roles.map((r) => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700" disabled={editForm.processing}>Simpan</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} />
                                    {createForm.errors.name && <p className="mt-1 text-xs text-rose-600">{createForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                                    <input type="email" className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 focus:outline-none" value={createForm.data.email} readOnly />
                                    {createForm.errors.email && <p className="mt-1 text-xs text-rose-600">{createForm.errors.email}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Telepon</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.phone} onChange={(e) => createForm.setData('phone', e.target.value)} />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Departemen</label>
                                        <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.department_id} onChange={(e) => createForm.setData('department_id', e.target.value)}>
                                            <option value="">Pilih departemen</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Jabatan</label>
                                        <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.position} onChange={(e) => createForm.setData('position', e.target.value)}>
                                            <option value="">Pilih jabatan</option>
                                            {positions.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">NIP (Auto)</label>
                                    <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-600">{createForm.data.employee_number}</div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.password} onChange={(e) => createForm.setData('password', e.target.value)} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                    {createForm.errors.password && <p className="mt-1 text-xs text-rose-600">{createForm.errors.password}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Peran</label>
                                    <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.role} onChange={(e) => createForm.setData('role', e.target.value)}>
                                        {roles.map((r) => <option key={r} value={r}>{roleLabel[r] ?? r}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700" disabled={createForm.processing}>Tambah</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
});