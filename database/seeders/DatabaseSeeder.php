<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::firstOrCreate(['email' => 'admin@helpdesk.com'], [
            'name' => 'Administrator',
            'password' => bcrypt('password'),
            'department' => 'IT',
        ]);

        User::firstOrCreate(['email' => 'staff@helpdesk.com'], [
            'name' => 'Staff IT',
            'password' => bcrypt('password'),
            'department' => 'IT',
        ]);

        User::firstOrCreate(['email' => 'user@helpdesk.com'], [
            'name' => 'Pengguna',
            'password' => bcrypt('password'),
            'department' => 'Marketing',
        ]);

        $this->call([
            RolePermissionSeeder::class,
            CategorySeeder::class,
        ]);

        $admin = User::where('email', 'admin@helpdesk.com')->first();
        $admin?->syncRoles(['admin']);

        $staff = User::where('email', 'staff@helpdesk.com')->first();
        $staff?->syncRoles(['staff']);

        $customer = User::where('email', 'user@helpdesk.com')->first();
        $customer?->syncRoles(['customer']);
    }
}