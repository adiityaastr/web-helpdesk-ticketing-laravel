import { FormEvent, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../Layout';

type DepartmentItem = {
    id: number;
    name: string;
    slug: string;
};

type Props = {
    departments: { data: DepartmentItem[] };
};

export default function DepartmentIndex({ departments }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editDepartment, setEditDepartment] = useState<DepartmentItem | null>(null);

    const createForm = useForm({
        name: '',
    });

    const editForm = useForm({
        name: '',
    });

    const openCreate = () => {
        setEditDepartment(null);
        createForm.reset();
        setShowModal(true);
    };

    const openEdit = (department: DepartmentItem) => {
        setEditDepartment(department);
        editForm.setData({
            name: department.name,
        });
        setShowModal(true);
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/departments', {
            onSuccess: () => {
                setShowModal(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editDepartment) return;
        editForm.put(`/admin/departments/${editDepartment.id}`, {
            onSuccess: () => {
                setShowModal(false);
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus departemen ini?')) {
            router.delete(`/admin/departments/${id}`);
        }
    };

    return (
        <AdminLayout>
            {flash.success && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Kelola Departemen</h1>
                    <p className="text-sm text-slate-500">Kelola departemen perusahaan</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Tambah Departemen</button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 text-left">
                        <tr>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nama</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Slug</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.data.map((department) => (
                            <tr key={department.id} className="border-b border-slate-100 last:border-0">
                                <td className="px-5 py-3 font-medium text-slate-900">{department.name}</td>
                                <td className="px-5 py-3 font-mono text-xs text-slate-400">{department.slug}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-3">
                                        <button onClick={() => openEdit(department)} className="text-sm text-teal-600 hover:text-teal-700">Edit</button>
                                        <button onClick={() => handleDelete(department.id)} className="text-sm text-rose-600 hover:text-rose-700">Hapus</button>
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
                        <h2 className="mb-4 text-sm font-semibold text-slate-900">{editDepartment ? 'Edit Departemen' : 'Tambah Departemen'}</h2>

                        {editDepartment ? (
                            <form onSubmit={submitEdit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                    {editForm.errors.name && <p className="mt-1 text-xs text-rose-600">{editForm.errors.name}</p>}
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
}
