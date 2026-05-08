<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\CacheManager;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $departments = Department::query()
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $departments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:departments'],
        ]);

        Department::create([
            'name' => $request->string('name'),
        ]);

        CacheManager::forgetReferences();

        return redirect()->route('admin.departments.index')->with('success', 'Departemen berhasil ditambahkan.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('departments')->ignore($department->id)],
        ]);

        $department->update([
            'name' => $request->string('name'),
        ]);

        CacheManager::forgetReferences();

        return redirect()->route('admin.departments.index')->with('success', 'Departemen berhasil diperbarui.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        $this->authorize('delete', $department);

        if ($department->users()->exists()) {
            return redirect()->route('admin.departments.index')
                ->withErrors(['error' => 'Departemen tidak dapat dihapus karena masih memiliki pengguna. Pindahkan pengguna ke departemen lain terlebih dahulu.']);
        }

        $department->delete();

        CacheManager::forgetReferences();

        return redirect()->route('admin.departments.index')->with('success', 'Departemen berhasil dihapus.');
    }
}
