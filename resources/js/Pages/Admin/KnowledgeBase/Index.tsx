import { FormEvent, useState } from 'react';
import { usePage } from '@inertiajs/react';
import AdminLayout from '../Layout';

type ArticleItem = {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    created_at: string | null;
    category: { id: number; name: string } | null;
    author: { id: number; name: string } | null;
};

type CategoryOption = { id: number; name: string };

type Props = {
    articles: { data: ArticleItem[] };
    categories: CategoryOption[];
};

export default function KnowledgeBaseIndex({ articles, categories }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editArticle, setEditArticle] = useState<ArticleItem | null>(null);
    const [form, setForm] = useState({ title: '', content: '', category_id: '', is_published: false });

    const openCreate = () => {
        setEditArticle(null);
        setForm({ title: '', content: '', category_id: '', is_published: false });
        setShowModal(true);
    };

    const openEdit = (article: ArticleItem) => {
        setEditArticle(article);
        setForm({
            title: article.title,
            content: '',
            category_id: article.category?.id?.toString() ?? '',
            is_published: article.is_published,
        });
        setShowModal(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const url = editArticle ? `/admin/knowledge-base/${editArticle.id}` : '/admin/knowledge-base';
        const method = editArticle ? 'PUT' : 'POST';

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
        if (confirm('Yakin ingin menghapus artikel ini?')) {
            fetch(`/admin/knowledge-base/${id}`, {
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
                    <h1 className="text-2xl font-bold text-slate-800">Pusat Bantuan</h1>
                    <p className="text-sm text-slate-500">Kelola artikel bantuan untuk pengguna</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">+ Tambah Artikel</button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                            <th className="px-5 py-3 font-medium">Judul</th>
                            <th className="px-5 py-3 font-medium">Kategori</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium">Penulis</th>
                            <th className="px-5 py-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.data.map((article) => (
                            <tr key={article.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-5 py-3 font-medium text-slate-800">{article.title}</td>
                                <td className="px-5 py-3 text-slate-600">{article.category?.name ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${article.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {article.is_published ? 'Publikasi' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-slate-600">{article.author?.name ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(article)} className="text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                                        <button onClick={() => handleDelete(article.id)} className="text-sm text-rose-600 hover:text-rose-800">Hapus</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-semibold text-slate-800">{editArticle ? 'Edit Artikel' : 'Tambah Artikel'}</h2>
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
                                <label className="mb-1 block text-sm font-medium text-slate-700">Konten</label>
                                <textarea className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="rounded border-slate-300" />
                                <span className="text-sm text-slate-700">Publikasikan</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">{editArticle ? 'Simpan' : 'Tambah'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}