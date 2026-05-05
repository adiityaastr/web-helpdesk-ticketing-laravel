import { FormEvent, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../Layout';
import FlashMessage from '@/Components/FlashMessage';
import ConfirmDialog from '@/Components/ConfirmDialog';

type CategoryItem = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    tickets_count: number;
};

type Props = {
    categories: { data: CategoryItem[] };
};

export default function CategoryIndex({ categories }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

    const createForm = useForm({ name: '', description: '' });
    const editForm = useForm({ name: '', description: '' });

    const openCreate = () => { setEditCategory(null); createForm.reset(); setShowModal(true); };

    const openEdit = (category: CategoryItem) => {
        setEditCategory(category);
        editForm.setData({ name: category.name, description: category.description ?? '' });
        setShowModal(true);
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/categories', { onSuccess: () => { setShowModal(false); createForm.reset(); } });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editCategory) return;
        editForm.put(`/admin/categories/${editCategory.id}`, { onSuccess: () => { setShowModal(false); } });
    };

    return (
        <AdminLayout>
            <FlashMessage success={flash.success} />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Kelola Kategori</h1>
                    <p className="text-sm text-slate-500">Kelola kategori tiket helpdesk</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Tambah Kategori</button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 text-left">
                        <tr>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nama</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Slug</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Deskripsi</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Jumlah Tiket</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.data.map((category) => (
                            <tr key={category.id} className="border-b border-slate-100 last:border-0">
                                <td className="px-5 py-3 font-medium text-slate-900">{category.name}</td>
                                <td className="px-5 py-3 font-mono text-xs text-slate-400">{category.slug}</td>
                                <td className="px-5 py-3 text-slate-500">{category.description ?? '-'}</td>
                                <td className="px-5 py-3"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">{category.tickets_count}</span></td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-3">
                                        <button onClick={() => openEdit(category)} className="text-sm text-teal-600 hover:text-teal-700">Edit</button>
                                        <button onClick={() => setDeleteTarget({ id: category.id, name: category.name })} className="text-sm text-rose-600 hover:text-rose-700">Hapus</button>
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
                        <h2 className="mb-4 text-sm font-semibold text-slate-900">{editCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h2>

                        {editCategory ? (
                            <form onSubmit={submitEdit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                    {editForm.errors.name && <p className="mt-1 text-xs text-rose-600">{editForm.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} />
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
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Deskripsi</label>
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={createForm.data.description} onChange={(e) => createForm.setData('description', e.target.value)} />
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

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Kategori"
                message={`Yakin ingin menghapus kategori "${deleteTarget?.name ?? ''}"?`}
                confirmLabel="Hapus"
                variant="danger"
                onConfirm={() => { if (deleteTarget) router.delete(`/admin/categories/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AdminLayout>
    );
}
