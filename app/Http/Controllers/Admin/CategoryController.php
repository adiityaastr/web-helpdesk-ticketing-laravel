<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\CacheManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->withCount('tickets')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        Category::create([
            'name' => $request->string('name'),
            'slug' => Str::slug($request->string('name')),
            'description' => $request->string('description') ?: null,
        ]);

        CacheManager::forgetReferences();

        return redirect()->route('admin.categories.index')->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $category->update([
            'name' => $request->string('name'),
            'slug' => Str::slug($request->string('name')),
            'description' => $request->string('description') ?: null,
        ]);

        CacheManager::forgetReferences();

        return redirect()->route('admin.categories.index')->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $this->authorize('delete', $category);

        if ($category->tickets()->exists()) {
            return redirect()->route('admin.categories.index')
                ->withErrors(['error' => 'Kategori tidak dapat dihapus karena masih memiliki tiket. Pindahkan tiket ke kategori lain terlebih dahulu.']);
        }

        $category->delete();

        CacheManager::forgetReferences();

        return redirect()->route('admin.categories.index')->with('success', 'Kategori berhasil dihapus.');
    }
}