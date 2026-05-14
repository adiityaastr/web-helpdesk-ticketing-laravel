<?php

namespace Database\Seeders;

use App\Models\KnowledgeBase;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $articles = [
            [
                'title' => 'Cara Reset Password Email',
                'slug' => 'cara-reset-password-email',
                'content' => "Berikut langkah-langkah untuk mereset password email:\n\n1. Buka halaman login email perusahaan\n2. Klik \"Lupa Password\"\n3. Masukkan email yang terdaftar\n4. Cek inbox untuk link reset\n5. Buat password baru minimal 8 karakter\n\nJika masih mengalami kendala, silakan buat tiket bantuan.",
                'category_id' => 4,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Panduan Koneksi VPN Kantor',
                'slug' => 'panduan-koneksi-vpn-kantor',
                'content' => "Untuk mengakses jaringan kantor dari rumah:\n\n1. Download aplikasi VPN dari portal IT\n2. Install dan buka aplikasi\n3. Masukkan server: vpn.company.com\n4. Login dengan kredensial Active Directory\n5. Tunggu hingga status Connected\n\nPastikan koneksi internet stabil sebelum menghubungkan VPN.",
                'category_id' => 3,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Prosedur Permintaan Laptop Baru',
                'slug' => 'prosedur-permintaan-laptop-baru',
                'content' => "Untuk mengajukan permintaan laptop baru atau penggantian:\n\n1. Buat tiket dengan kategori \"Hardware\"\n2. Sertakan alasan permintaan\n3. Lampirkan persetujuan atasan\n4. Tim IT akan memproses dalam 3-5 hari kerja\n\nSpesifikasi laptop disesuaikan dengan kebutuhan departemen.",
                'category_id' => 1,
                'author_id' => 1,
                'is_published' => true,
            ],
        ];

        foreach ($articles as $article) {
            KnowledgeBase::firstOrCreate(['slug' => $article['slug']], $article);
        }
    }
}
