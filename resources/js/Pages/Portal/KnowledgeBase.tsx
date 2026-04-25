import { Link } from '@inertiajs/react';
import PortalLayout from './Layout';

type Article = {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    created_at: string | null;
    category: { id: number; name: string } | null;
};

type Props = {
    articles: { data: Article[] };
};

export default function KnowledgeBase({ articles }: Props) {
    return (
        <PortalLayout>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-slate-900">Basis Pengetahuan</h1>
                <p className="text-sm text-slate-500">Temukan artikel dan solusi untuk masalah umum</p>
            </div>

            {articles.data.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
                    <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '48px' }}>article</span>
                    <p className="mt-2 text-slate-400">Belum ada artikel yang tersedia.</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {articles.data.map((article) => (
                        <Link
                            key={article.id}
                            href={`/portal/knowledge-base/${article.id}`}
                            className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-teal-300"
                        >
                            {article.category && (
                                <span className="mb-2 inline-block rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">{article.category.name}</span>
                            )}
                            <h3 className="text-sm font-semibold text-slate-900">{article.title}</h3>
                            <p className="mt-1 text-xs text-slate-400">{article.created_at ?? '-'}</p>
                        </Link>
                    ))}
                </div>
            )}
        </PortalLayout>
    );
}