import { FormEvent, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../Layout';

type TemplateItem = {
    id: number;
    title: string;
    content: string;
    category: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
};

type CategoryOption = { id: number; name: string };

type Props = {
    templates: { data: TemplateItem[] };
    categories: CategoryOption[];
};

export default function TemplateIndex({ templates, categories }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editTemplate, setEditTemplate] = useState<TemplateItem | null>(null);

    const createForm = useForm({
        title: '',
        content: '',
        category_id: '',
    });

    const editForm = useForm({
        title: '',
        content: '',
        category_id: '',
    });

    const openCreate = () => {
        setEditTemplate(null);
        createForm.reset();
        setShowModal(true);
    };

    const openEdit = (template: TemplateItem) => {
        setEditTemplate(template);
        editForm.setData({
            title: template.title,
            content: template.content,
            category_id: template.category?.id?.toString() ?? '',
        });
        setShowModal(true);
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/templates', {
            onSuccess: () => {
                setShowModal(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editTemplate) return;
        editForm.put(`/admin/templates/${editTemplate.id}`, {
            onSuccess: () => {
                setShowModal(false);
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus template ini?')) {
            router.delete(`/admin/templates/${id}`);
        }
    };

    return (
        <AdminLayout>
            {flash.success && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Template Respon</h1>
                    <p className="text-sm text-slate-500">Kelola template respons cepat untuk tiket</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Tambah Template</button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 text-left">
                        <tr>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Judul</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Kategori</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Dibuat Oleh</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.data.map((template) => (
                            <tr key={template.id} className="border-b border-slate-100 last:border-0">
                                <td className="px-5 py-3 font-medium text-slate-900">{template.title}</td>
                                <td className="px-5 py-3 text-slate-500">{template.category?.name ?? '-'}</td>
                                <td className="px-5 py-3 text-slate-500">{template.creator?.name ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-3">
                                        <button onClick={() => openEdit(template)} className="text-sm text-teal-600 hover:text-teal-700">Edit</button>
                                        <button onClick={() => handleDelete(template.id)} className="text-sm text-rose-600 hover:text-rose-700">Hapus</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {templates.data.length === 0 && (
                            <tr><td className="px-5 py-8 text-center text-slate-400" colSpan={4}>Belum ada template.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-sm font-semibold text-slate-900">{editTemplate ? 'Edit Template' : 'Tambah Template'}</h2>

                        {editTemplate ? (
                            <form onSubmit={submitEdit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Judul</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} />
                                    {editForm.errors.title && <p className="mt-1 text-xs text-rose-600">{editForm.errors.title}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategori</label>
                                    <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={editForm.data.category_id} onChange={(e) => editForm.setData('category_id', e.target.value)}>
                                        <option value="">Tanpa kategori</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Konten Template</label>
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={6} value={editForm.data.content} onChange={(e) => editForm.setData('content', e.target.value)} placeholder="Isi template respons..." />
                                    {editForm.errors.content && <p className="mt-1 text-xs text-rose-600">{editForm.errors.content}</p>}
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700" disabled={editForm.processing}>Simpan</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Judul</label>
                                    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.title} onChange={(e) => createForm.setData('title', e.target.value)} />
                                    {createForm.errors.title && <p className="mt-1 text-xs text-rose-600">{createForm.errors.title}</p>}
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategori</label>
                                    <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={createForm.data.category_id} onChange={(e) => createForm.setData('category_id', e.target.value)}>
                                        <option value="">Tanpa kategori</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Konten Template</label>
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={6} value={createForm.data.content} onChange={(e) => createForm.setData('content', e.target.value)} placeholder="Isi template respons..." />
                                    {createForm.errors.content && <p className="mt-1 text-xs text-rose-600">{createForm.errors.content}</p>}
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