import { FormEvent, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../Layout';
import FlashMessage from '@/Components/FlashMessage';
import ConfirmDialog from '@/Components/ConfirmDialog';

type ArticleItem = {
    id: number;
    title: string;
    slug: string;
    content: string;
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
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

    const createForm = useForm({ title: '', content: '', category_id: '', is_published: false as boolean });
    const editForm = useForm({ title: '', content: '', category_id: '', is_published: false as boolean });

    const openCreate = () => { setEditArticle(null); createForm.reset(); setShowModal(true); };

    const openEdit = (article: ArticleItem) => {
        setEditArticle(article);
        editForm.setData({ title: article.title, content: article.content ?? '', category_id: article.category?.id?.toString() ?? '', is_published: article.is_published });
        setShowModal(true);
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/knowledge-base', { onSuccess: () => { setShowModal(false); createForm.reset(); } });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editArticle) return;
        editForm.put(`/admin/knowledge-base/${editArticle.id}`, { onSuccess: () => { setShowModal(false); } });
    };

    return (
        <AdminLayout>
            <FlashMessage success={flash.success} />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Pusat Bantuan</h1>
                    <p className="text-sm text-slate-500">Kelola artikel bantuan untuk pengguna</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Tambah Artikel</button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 text-left">
                        <tr>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Judul</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Kategori</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Penulis</th>
                            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.data.map((article) => (
                            <tr key={article.id} className="border-b border-slate-100 last:border-0">
                                <td className="px-5 py-3 font-medium text-slate-900">{article.title}</td>
                                <td className="px-5 py-3 text-slate-500">{article.category?.name ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${article.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {article.is_published ? 'Publikasi' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-slate-500">{article.author?.name ?? '-'}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-3">
                                        <button onClick={() => openEdit(article)} className="text-sm text-teal-600 hover:text-teal-700">Edit</button>
                                        <button onClick={() => setDeleteTarget({ id: article.id, title: article.title })} className="text-sm text-rose-600 hover:text-rose-700">Hapus</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-sm font-semibold text-slate-900">{editArticle ? 'Edit Artikel' : 'Tambah Artikel'}</h2>

                        {editArticle ? (
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
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Konten</label>
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={6} value={editForm.data.content} onChange={(e) => editForm.setData('content', e.target.value)} />
                                    {editForm.errors.content && <p className="mt-1 text-xs text-rose-600">{editForm.errors.content}</p>}
                                </div>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={editForm.data.is_published} onChange={(e) => editForm.setData('is_published', e.target.checked)} className="rounded border-slate-300" />
                                    <span className="text-sm text-slate-700">Publikasikan</span>
                                </label>
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
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Konten</label>
                                    <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={6} value={createForm.data.content} onChange={(e) => createForm.setData('content', e.target.value)} />
                                    {createForm.errors.content && <p className="mt-1 text-xs text-rose-600">{createForm.errors.content}</p>}
                                </div>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={createForm.data.is_published} onChange={(e) => createForm.setData('is_published', e.target.checked)} className="rounded border-slate-300" />
                                    <span className="text-sm text-slate-700">Publikasikan</span>
                                </label>
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
                title="Hapus Artikel"
                message={`Yakin ingin menghapus artikel "${deleteTarget?.title ?? ''}"?`}
                confirmLabel="Hapus"
                variant="danger"
                onConfirm={() => { if (deleteTarget) router.delete(`/admin/knowledge-base/${deleteTarget.id}`); setDeleteTarget(null); }}
                onCancel={() => setDeleteTarget(null)}
            />
        </AdminLayout>
    );
}
