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
                <h1 className="text-2xl font-bold text-slate-800">Pusat Bantuan</h1>
                <p className="text-sm text-slate-500">Temukan artikel dan solusi untuk masalah umum</p>
            </div>

            {articles.data.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <p className="text-slate-500">Belum ada artikel yang tersedia.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {articles.data.map((article) => (
                        <Link
                            key={article.id}
                            href={`/portal/knowledge-base/${article.id}`}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                        >
                            <div className="mb-2">
                                {article.category && (
                                    <span className="mb-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{article.category.name}</span>
                                )}
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">{article.title}</h3>
                            <p className="mt-1 text-xs text-slate-500">{article.created_at ?? '-'}</p>
                        </Link>
                    ))}
                </div>
            )}
        </PortalLayout>
    );
}