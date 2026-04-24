<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBase;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseController extends Controller
{
    public function index(Request $request): Response
    {
        $articles = KnowledgeBase::query()
            ->with(['category', 'author'])
            ->when($request->string('search')->isNotEmpty(), fn ($q) => $q->where('title', 'like', "%{$request->string('search')}%"))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/KnowledgeBase/Index', [
            'articles' => $articles,
            'categories' => Category::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'is_published' => ['boolean'],
        ]);

        KnowledgeBase::create([
            'title' => $request->string('title'),
            'slug' => Str::slug($request->string('title')),
            'content' => $request->string('content'),
            'category_id' => $request->integer('category_id') ?: null,
            'author_id' => auth()->id(),
            'is_published' => $request->boolean('is_published'),
        ]);

        return redirect()->route('admin.knowledge-base.index')->with('success', 'Artikel berhasil ditambahkan.');
    }

    public function update(Request $request, KnowledgeBase $knowledgeBase): RedirectResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'is_published' => ['boolean'],
        ]);

        $knowledgeBase->update([
            'title' => $request->string('title'),
            'slug' => Str::slug($request->string('title')),
            'content' => $request->string('content'),
            'category_id' => $request->integer('category_id') ?: null,
            'is_published' => $request->boolean('is_published'),
        ]);

        return redirect()->route('admin.knowledge-base.index')->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroy(KnowledgeBase $knowledgeBase): RedirectResponse
    {
        $knowledgeBase->delete();

        return redirect()->route('admin.knowledge-base.index')->with('success', 'Artikel berhasil dihapus.');
    }
}