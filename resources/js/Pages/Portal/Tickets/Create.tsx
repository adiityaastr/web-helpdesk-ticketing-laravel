import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import PortalLayout from '../Layout';

type Category = { id: number; name: string; slug: string };

type Props = {
    categories: Category[];
    priorities: string[];
};

const priorityLabel: Record<string, string> = { critical: 'Kritis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

export default function PortalTicketCreate({ categories, priorities }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        title: '',
        description: '',
        priority: 'medium',
        attachments: [] as File[],
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/portal/tickets');
    };

    return (
        <PortalLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Buat Tiket Baru</h1>
                <p className="text-sm text-slate-500">Laporkan masalah atau permintaan kepada tim IT</p>
            </div>

            <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                    <select
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={data.category_id}
                        onChange={(e) => setData('category_id', e.target.value)}
                    >
                        <option value="">Pilih kategori</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.category_id && <p className="mt-1 text-xs text-rose-600">{errors.category_id}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
                    <input
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Deskripsi singkat masalah Anda"
                    />
                    {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi Lengkap</label>
                    <textarea
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        rows={6}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Jelaskan masalah atau permintaan Anda secara detail..."
                    />
                    {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Prioritas</label>
                    <select
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={data.priority}
                        onChange={(e) => setData('priority', e.target.value)}
                    >
                        {priorities.map((p) => <option key={p} value={p}>{priorityLabel[p] ?? p}</option>)}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Lampiran (jpg/png/pdf, maks 5 file)</label>
                    <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                        onChange={(e) => setData('attachments', Array.from(e.target.files ?? []))}
                    />
                    {errors.attachments && <p className="mt-1 text-xs text-rose-600">{errors.attachments}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50" disabled={processing}>
                        Kirim Tiket
                    </button>
                    <Link href="/portal/tickets" className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Batal
                    </Link>
                </div>
            </form>
        </PortalLayout>
    );
}