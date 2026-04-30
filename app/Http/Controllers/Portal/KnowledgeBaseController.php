<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBase;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseController extends Controller
{
    public function index(): Response
    {
        $articles = KnowledgeBase::query()
            ->where('is_published', \Illuminate\Support\Facades\DB::raw('true'))
            ->with('category')
            ->latest()
            ->paginate(12);

        return Inertia::render('Portal/KnowledgeBase', [
            'articles' => $articles,
        ]);
    }

    public function show(KnowledgeBase $knowledgeBase): Response
    {
        if (! $knowledgeBase->is_published) {
            abort(404);
        }

        return Inertia::render('Portal/KnowledgeBaseShow', [
            'article' => $knowledgeBase->load('category', 'author'),
        ]);
    }
}