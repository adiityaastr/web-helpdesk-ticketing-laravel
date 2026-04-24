import { FormEvent, useState } from 'react';
import { usePage } from '@inertiajs/react';
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
    const [form, setForm] = useState({ title: '', content: '', category_id: '' });

    const openCreate = () => {
        setEditTemplate(null);
        setForm({ title: '', content: '', category_id: '' });
        setShowModal(true);
    };

    const openEdit = (template: TemplateItem) => {
        setEditTemplate(template);
        setForm({ title: template.title, content: template.content, category_id: template.category?.id?.toString() ?? '' });
        setShowModal(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const url = editTemplate ? `/admin/templates/${editTemplate.id}` : '/admin/templates';
        const method = editTemplate ? 'PUT' : 'POST';

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
            if (response.ok) window.location.reload();
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus template ini?')) {
            fetch(`/admin/templates/${id}`, {
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
                    <h1 className="text-2xl font-bold text-slate-800">Template Respon</h1>
                    <p className="text-sm text-slate-500">Kelola template respons cepat untuk tiket</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">+ Tambah Template</button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                            <th className="px-5 py-3 font-medium">Judul</th>
                            <th className="px-5 py-3 font-medium">Kategori</th>
                            <th className="px-5 py-3 font-medium">Dibuat Oleh</th>
                            <th className="px-5 py-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.data.map((template) => (
                            <tr key={template.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-5 py-3 font-medium text-slate-800">{template.title}</td>
                                <td className="px-5 py-3 text-slate-600">{template.category?.name ?? '-'}</td>
                                <td className="px-5 py-3 text-slate-600">{template.creator?.name ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(template)} className="text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                                        <button onClick={() => handleDelete(template.id)} className="text-sm text-rose-600 hover:text-rose-800">Hapus</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {templates.data.length === 0 && (
                            <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={4}>Belum ada template.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">{editTemplate ? 'Edit Template' : 'Tambah Template'}</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
                                <input className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                                <select className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                    <option value="">Tanpa kategori</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Konten Template</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Isi template respons..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">{editTemplate ? 'Simpan' : 'Tambah'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}