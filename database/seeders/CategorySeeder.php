<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Hardware', 'description' => 'Permasalahan perangkat keras seperti komputer, printer, monitor, dll.'],
            ['name' => 'Software', 'description' => 'Permasalahan perangkat lunak seperti aplikasi, sistem operasi, dll.'],
            ['name' => 'Jaringan', 'description' => 'Permasalahan jaringan seperti WiFi, VPN, koneksi internet, dll.'],
            ['name' => 'Akses Akun', 'description' => 'Permasalahan akun seperti reset password, akses aplikasi, dll.'],
            ['name' => 'Lainnya', 'description' => 'Permasalahan lainnya yang tidak masuk kategori di atas.'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['slug' => Str::slug($cat['name'])],
                ['name' => $cat['name'], 'description' => $cat['description']],
            );
        }
    }
}