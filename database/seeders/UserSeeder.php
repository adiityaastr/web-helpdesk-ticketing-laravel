<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $staffUsers = User::factory(10)->create();
        foreach ($staffUsers as $user) {
            $user->syncRoles(['staff']);
        }

        $customerUsers = User::factory(20)->create();
        foreach ($customerUsers as $user) {
            $user->syncRoles(['customer']);
        }
    }
}
