import { FormEvent, useState } from 'react';
import { usePage } from '@inertiajs/react';
import AdminLayout from '../Layout';

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
    const [form, setForm] = useState({ name: '', description: '' });

    const openCreate = () => {
        setEditCategory(null);
        setForm({ name: '', description: '' });
        setShowModal(true);
    };

    const openEdit = (category: CategoryItem) => {
        setEditCategory(category);
        setForm({ name: category.name, description: category.description ?? '' });
        setShowModal(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const url = editCategory ? `/admin/categories/${editCategory.id}` : '/admin/categories';
        const method = editCategory ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
            body: JSON.stringify(form),
        }).then((response) => {
            if (response.ok) {
                window.location.reload();
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus kategori ini?')) {
            fetch(`/admin/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            }).then(() => window.location.reload());
        }
    };

    return (
        <AdminLayout>
            {flash.success && <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Kelola Kategori</h1>
                    <p className="text-sm text-slate-500">Kelola kategori tiket helpdesk</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">+ Tambah Kategori</button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                            <th className="px-5 py-3 font-medium">Nama</th>
                            <th className="px-5 py-3 font-medium">Slug</th>
                            <th className="px-5 py-3 font-medium">Deskripsi</th>
                            <th className="px-5 py-3 font-medium">Jumlah Tiket</th>
                            <th className="px-5 py-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.data.map((category) => (
                            <tr key={category.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-5 py-3 font-medium text-slate-800">{category.name}</td>
                                <td className="px-5 py-3 font-mono text-xs text-slate-500">{category.slug}</td>
                                <td className="px-5 py-3 text-slate-600">{category.description ?? '-'}</td>
                                <td className="px-5 py-3"><span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{category.tickets_count}</span></td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(category)} className="text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                                        <button onClick={() => handleDelete(category.id)} className="text-sm text-rose-600 hover:text-rose-800">Hapus</button>
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
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">{editCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Nama</label>
                                <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">{editCategory ? 'Simpan' : 'Tambah'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}