<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $userQuery = User::query()
            ->with(['roles', 'dept'])
            ->when($request->string('search')->isNotEmpty(), fn ($query) => $query->where(function ($q) use ($request) {
                $search = addcslashes($request->string('search')->toString(), '%_');
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when($request->string('role')->isNotEmpty(), fn ($query) => $query->role($request->string('role')));

        $users = $userQuery
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $users->through(fn ($user) => [
            'id' => $user->id,
            'employee_number' => $user->employee_number,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'position' => $user->position,
            'department' => $user->dept?->name,
            'roles' => $user->roles->pluck('name')->values()->all(),
            'created_at' => $user->created_at?->toDateTimeString(),
        ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
            'roles' => ['customer', 'staff'],
            'positions' => ['Manager', 'SPV', 'Staff'],
            'departments' => Cache::rememberForever('reference_departments', fn () => Department::query()->select('id', 'name')->orderBy('name')->get()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:20'],
            'position' => ['nullable', 'string', 'in:Manager,SPV,Staff'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'password' => ['required', Rules\Password::defaults()],
            'employee_number' => ['nullable', 'string', 'max:8', 'unique:users,employee_number'],
            'role' => ['required', Rule::in(['customer', 'staff'])],
        ]);

        $employeeNumber = $request->string('employee_number')->toString() ?: null;
        if (! $employeeNumber) {
            do {
                $employeeNumber = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
            } while (User::where('employee_number', $employeeNumber)->exists());
        }

        $user = User::create([
            'employee_number' => $employeeNumber,
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'phone' => $request->string('phone') ?: null,
            'position' => $request->string('position') ?: null,
            'department_id' => $request->integer('department_id') ?: null,
            'password' => Hash::make($request->string('password')),
        ]);

        $user->assignRole($request->string('role'));

        return redirect()->route('admin.users.index')->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'position' => ['nullable', 'string', 'in:Manager,SPV,Staff'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'password' => ['nullable', Rules\Password::defaults()],
            'role' => ['required', Rule::in(['customer', 'staff'])],
        ]);

        $user->update([
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'phone' => $request->string('phone') ?: null,
            'position' => $request->string('position') ?: null,
            'department_id' => $request->integer('department_id') ?: null,
            ...($request->filled('password') ? ['password' => Hash::make($request->string('password'))] : []),
        ]);

        $user->syncRoles([$request->string('role')]);

        return redirect()->route('admin.users.index')->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.users.index')->withErrors(['error' => 'Tidak dapat menghapus akun sendiri.']);
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'Pengguna berhasil dihapus.');
    }
}