<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'tickets.create',
            'tickets.view.own',
            'tickets.view.all',
            'tickets.update',
            'tickets.comment',
            'categories.manage',
            'users.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $customer = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $staff = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $customer->syncPermissions(['tickets.create', 'tickets.view.own', 'tickets.comment']);
        $staff->syncPermissions(['tickets.view.all', 'tickets.update', 'tickets.comment']);
        $admin->syncPermissions($permissions);

        $adminUser = User::where('email', 'test@example.com')->first();
        if ($adminUser) {
            $adminUser->syncRoles(['admin']);
        }
    }
}
