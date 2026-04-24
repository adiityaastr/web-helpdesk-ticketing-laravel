<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TicketTemplate;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(): Response
    {
        $templates = TicketTemplate::query()
            ->with(['category', 'creator'])
            ->orderBy('title')
            ->paginate(20);

        return Inertia::render('Admin/Templates/Index', [
            'templates' => $templates,
            'categories' => Category::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
        ]);

        TicketTemplate::create([
            'title' => $request->string('title'),
            'content' => $request->string('content'),
            'category_id' => $request->integer('category_id') ?: null,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('admin.templates.index')->with('success', 'Template berhasil ditambahkan.');
    }

    public function update(Request $request, TicketTemplate $ticketTemplate): RedirectResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
        ]);

        $ticketTemplate->update([
            'title' => $request->string('title'),
            'content' => $request->string('content'),
            'category_id' => $request->integer('category_id') ?: null,
        ]);

        return redirect()->route('admin.templates.index')->with('success', 'Template berhasil diperbarui.');
    }

    public function destroy(TicketTemplate $ticketTemplate): RedirectResponse
    {
        $ticketTemplate->delete();

        return redirect()->route('admin.templates.index')->with('success', 'Template berhasil dihapus.');
    }
}