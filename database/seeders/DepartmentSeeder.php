<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = ['IT', 'Marketing', 'Finance', 'HR', 'Operations', 'Legal', 'Sales', 'Engineering'];

        foreach ($departments as $name) {
            Department::firstOrCreate(
                ['name' => $name],
                ['slug' => Str::slug($name)],
            );
        }
    }
}
