<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            CategorySeeder::class,
            DepartmentSeeder::class,
        ]);

        $itDepartment = Department::where('name', 'IT')->first();
        $marketingDepartment = Department::where('name', 'Marketing')->first();

        User::firstOrCreate(['email' => 'admin@helpdesk.com'], [
            'employee_number' => '00000001',
            'name' => 'Administrator',
            'password' => bcrypt('password'),
            'position' => 'Manager',
            'department_id' => $itDepartment?->id,
        ]);

        User::firstOrCreate(['email' => 'staff@helpdesk.com'], [
            'employee_number' => '00000002',
            'name' => 'Staff IT',
            'password' => bcrypt('password'),
            'position' => 'Staff',
            'department_id' => $itDepartment?->id,
        ]);

        User::firstOrCreate(['email' => 'user@helpdesk.com'], [
            'employee_number' => '00000003',
            'name' => 'Pengguna',
            'password' => bcrypt('password'),
            'position' => 'Staff',
            'department_id' => $marketingDepartment?->id,
        ]);

        $admin = User::where('email', 'admin@helpdesk.com')->first();
        $admin?->syncRoles(['staff']);

        $staff = User::where('email', 'staff@helpdesk.com')->first();
        $staff?->syncRoles(['staff']);

        $customer = User::where('email', 'user@helpdesk.com')->first();
        $customer?->syncRoles(['customer']);
    }
}