import { Link } from '@inertiajs/react';
import PortalLayout from './Layout';

type Article = {
    id: number;
    title: string;
    content: string;
    is_published: boolean;
    created_at: string | null;
    category: { id: number; name: string } | null;
    author: { id: number; name: string } | null;
};

type Props = {
    article: Article;
};

export default function KnowledgeBaseShow({ article }: Props) {
    return (
        <PortalLayout>
            <div className="mb-6">
                <Link href="/portal/knowledge-base" className="text-sm text-indigo-600 hover:text-indigo-500">← Kembali ke Pusat Bantuan</Link>
            </div>

            <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                {article.category && (
                    <span className="mb-3 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{article.category.name}</span>
                )}
                <h1 className="mb-4 text-2xl font-bold text-slate-800">{article.title}</h1>
                <div className="mb-6 text-xs text-slate-500">
                    {article.author && <span>Oleh {article.author.name}</span>}
                    {article.created_at && <span className="ml-3">{article.created_at}</span>}
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">{article.content}</div>
            </article>
        </PortalLayout>
    );
}