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
                <Link href="/portal/knowledge-base" className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    Kembali ke Basis Pengetahuan
                </Link>
            </div>

            <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8">
                {article.category && (
                    <span className="mb-3 inline-block rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">{article.category.name}</span>
                )}
                <h1 className="mb-4 text-lg font-semibold text-slate-900">{article.title}</h1>
                <div className="mb-6 flex items-center gap-3 text-xs text-slate-400">
                    {article.author && (
                        <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                            {article.author.name}
                        </span>
                    )}
                    {article.created_at && (
                        <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                            {article.created_at}
                        </span>
                    )}
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-600">{article.content}</div>
            </article>
        </PortalLayout>
    );
}