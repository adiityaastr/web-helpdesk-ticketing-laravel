<?php

namespace Database\Seeders;

use App\Models\KnowledgeBase;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $articles = [
            // === AKSES AKUN (category_id=4) ===
            [
                'title' => 'Cara Reset Password Email',
                'slug' => 'cara-reset-password-email',
                'content' => "Berikut langkah-langkah untuk mereset password email:\n\n1. Buka halaman login email perusahaan\n2. Klik \"Lupa Password\"\n3. Masukkan email yang terdaftar\n4. Cek inbox untuk link reset\n5. Buat password baru minimal 8 karakter\n\nJika masih mengalami kendala, silakan buat tiket bantuan.",
                'category_id' => 4,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Aktivasi Akun Pengguna Baru',
                'slug' => 'aktivasi-akun-pengguna-baru',
                'content' => "Untuk karyawan baru yang membutuhkan akun:\n\n1. HRD mengirimkan data karyawan ke IT\n2. IT membuat akun Active Directory\n3. Email dan password sementara dikirim via HRD\n4. Karyawan wajib mengganti password saat login pertama\n5. Aktifkan 2FA untuk keamanan tambahan\n\nProses aktivasi memakan waktu 1x24 jam kerja.",
                'category_id' => 4,
                'author_id' => 2,
                'is_published' => true,
            ],
            [
                'title' => 'Mengatasi Akun Terkunci',
                'slug' => 'mengatasi-akun-terkunci',
                'content' => "Jika akun Anda terkunci setelah beberapa kali gagal login:\n\n1. Tunggu 15 menit — akun akan otomatis terbuka\n2. Jika masih terkunci, hubungi IT via tiket\n3. Sertakan NIP dan nama lengkap\n4. IT akan mereset akun dalam 30 menit\n\nTips: Gunakan password manager untuk menghindari lupa password.",
                'category_id' => 4,
                'author_id' => 1,
                'is_published' => true,
            ],

            // === JARINGAN (category_id=3) ===
            [
                'title' => 'Panduan Koneksi VPN Kantor',
                'slug' => 'panduan-koneksi-vpn-kantor',
                'content' => "Untuk mengakses jaringan kantor dari rumah:\n\n1. Download aplikasi VPN dari portal IT\n2. Install dan buka aplikasi\n3. Masukkan server: vpn.company.com\n4. Login dengan kredensial Active Directory\n5. Tunggu hingga status Connected\n\nPastikan koneksi internet stabil sebelum menghubungkan VPN.",
                'category_id' => 3,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Troubleshooting WiFi Tidak Konek',
                'slug' => 'troubleshooting-wifi-tidak-konek',
                'content' => "Langkah-langkah jika WiFi kantor tidak terhubung:\n\n1. Restart laptop/komputer Anda\n2. Lupakan jaringan WiFi, lalu sambungkan ulang\n3. Pastikan password WiFi benar (case-sensitive)\n4. Cek apakah perangkat lain bisa konek\n5. Jika tetap gagal, restart router di ruang server\n\nSSID Kantor: Corp-WiFi | Frekuensi: 5GHz",
                'category_id' => 3,
                'author_id' => 2,
                'is_published' => true,
            ],
            [
                'title' => 'Akses File Server dari Rumah',
                'slug' => 'akses-file-server-dari-rumah',
                'content' => "Untuk mengakses file server (SMB Share) saat WFH:\n\n1. Pastikan VPN sudah terkoneksi\n2. Buka File Explorer\n3. Ketik \\\\fileserver\shared di address bar\n4. Login dengan kredensial AD\n5. Drive akan muncul di Network Locations\n\nFolder yang bisa diakses:\n- \\\\fileserver\departemen\n- \\\\fileserver\public\n- \\\\fileserver\projects",
                'category_id' => 3,
                'author_id' => 1,
                'is_published' => true,
            ],

            // === HARDWARE (category_id=1) ===
            [
                'title' => 'Prosedur Permintaan Laptop Baru',
                'slug' => 'prosedur-permintaan-laptop-baru',
                'content' => "Untuk mengajukan permintaan laptop baru atau penggantian:\n\n1. Buat tiket dengan kategori \"Hardware\"\n2. Sertakan alasan permintaan\n3. Lampirkan persetujuan atasan\n4. Tim IT akan memproses dalam 3-5 hari kerja\n\nSpesifikasi laptop disesuaikan dengan kebutuhan departemen.",
                'category_id' => 1,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Perawatan Rutin Printer Kantor',
                'slug' => 'perawatan-rutin-printer-kantor',
                'content' => "Jadwal perawatan printer setiap bulan:\n\n1. Bersihkan kepala printer dengan cairan khusus\n2. Cek dan ganti tinta/toner yang hampir habis\n3. Bersihkan roller kertas dari debu\n4. Kalibrasi alignment via menu printer\n5. Cek koneksi jaringan untuk printer network\n\nJika terjadi paper jam, buka panel belakang perlahan — jangan paksa tarik kertas.",
                'category_id' => 1,
                'author_id' => 2,
                'is_published' => true,
            ],
            [
                'title' => 'Spesifikasi Standar Komputer Kantor',
                'slug' => 'spesifikasi-standar-komputer-kantor',
                'content' => "Standar spesifikasi PC/Laptop yang disetujui IT:\n\n**PC Desktop:**\n- Prosesor: Intel Core i5 gen 12+\n- RAM: 16GB DDR4\n- Storage: SSD 512GB\n- Monitor: 24\" Full HD\n\n**Laptop:**\n- Prosesor: Intel Core i7 / AMD Ryzen 7\n- RAM: 16GB DDR5\n- Storage: SSD 1TB\n- Layar: 15.6\" FHD IPS\n\nPengajuan di luar spesifikasi memerlukan justifikasi khusus.",
                'category_id' => 1,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Panduan Penggantian Toner Printer',
                'slug' => 'panduan-penggantian-toner-printer',
                'content' => "Jika indikator toner menyala, ikuti langkah berikut:\n\n1. Buka panel depan printer\n2. Tarik cartridge toner yang habis\n3. Keluarkan toner baru dari kemasan\n4. Goyangkan toner 5-6 kali (horizontal)\n5. Lepaskan segel pelindung\n6. Masukkan toner hingga terdengar klik\n7. Tutup panel dan tunggu printer warm-up\n\nGunakan toner original untuk hasil terbaik.",
                'category_id' => 1,
                'author_id' => 2,
                'is_published' => false,
            ],

            // === SOFTWARE (category_id=2) ===
            [
                'title' => 'Installasi Microsoft Office dari Portal',
                'slug' => 'installasi-microsoft-office-dari-portal',
                'content' => "Semua karyawan berhak mendapatkan lisensi Microsoft 365:\n\n1. Buka portal.office.com\n2. Login dengan email perusahaan\n3. Klik \"Install Office\" di kanan atas\n4. Download Office 365 Apps installer\n5. Jalankan installer dan ikuti wizard\n6. Aktivasi otomatis dengan akun perusahaan\n\nLisensi mencakup: Word, Excel, PowerPoint, Outlook, Teams, OneDrive.",
                'category_id' => 2,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Software yang Dilarang Dipasang',
                'slug' => 'software-yang-dilarang-dipasang',
                'content' => "Demi keamanan jaringan, software berikut DILARANG di perangkat kantor:\n\n1. Software bajakan/crack\n2. Torrent client (uTorrent, BitTorrent)\n3. Game online/offline\n4. VPN pihak ketiga (ExpressVPN, NordVPN)\n5. Remote desktop tools tidak resmi\n6. Crypto miner\n\nPelanggaran akan dikenakan sanksi sesuai peraturan perusahaan.\nJika butuh software khusus, ajukan via tiket.",                'category_id' => 2,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Update Windows dan Antivirus',
                'slug' => 'update-windows-dan-antivirus',
                'content' => "Pembaruan sistem wajib dilakukan berkala:\n\n**Windows Update:**\n1. Buka Settings > Windows Update\n2. Klik \"Check for updates\"\n3. Install semua update yang tersedia\n4. Restart jika diminta\n\n**Antivirus (Windows Defender):**\n1. Buka Windows Security\n2. Klik \"Virus & threat protection\"\n3. Klik \"Check for updates\"\n4. Lakukan Quick Scan mingguan\n\nIT akan melakukan remote update setiap Sabtu pukul 02:00 WIB.",
                'category_id' => 2,
                'author_id' => 2,
                'is_published' => true,
            ],
            [
                'title' => 'Panduan Penggunaan Microsoft Teams',
                'slug' => 'panduan-penggunaan-microsoft-teams',
                'content' => "Microsoft Teams adalah aplikasi utama komunikasi internal:\n\n**Memulai Meeting:**\n1. Buka Teams > Calendar\n2. Klik \"New Meeting\"\n3. Tambahkan peserta dan waktu\n4. Klik Save — undangan otomatis terkirim\n\n**Fitur Penting:**\n- Share screen untuk presentasi\n- Record meeting (tersimpan di OneDrive)\n- Background blur/virtual\n- Live caption (bahasa Indonesia tersedia)\n\nGunakan headset untuk kualitas audio terbaik.",
                'category_id' => 2,
                'author_id' => 2,
                'is_published' => true,
            ],

            // === LAINNYA (category_id=5) ===
            [
                'title' => 'Kebijakan Penggunaan Internet Kantor',
                'slug' => 'kebijakan-penggunaan-internet-kantor',
                'content' => "Penggunaan internet kantor diatur sebagai berikut:\n\n**Diperbolehkan:**\n- Akses portal pemerintah dan mitra bisnis\n- E-learning dan webinar terkait pekerjaan\n- Portal berita (maksimal 30 menit/hari)\n\n**Dilarang:**\n- Streaming video/film (YouTube kerja dikecualikan)\n- Social media non-pekerjaan\n- Situs judi dan pornografi\n- Download file besar (>500MB) tanpa izin\n\nBandwidth per user: 10 Mbps.",
                'category_id' => 5,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Jadwal Maintenance Server Bulanan',
                'slug' => 'jadwal-maintenance-server-bulanan',
                'content' => "Maintenance server rutin dilaksanakan:\n\n**Jadwal:** Setiap Sabtu minggu ke-2, pukul 22:00 - 04:00 WIB\n\n**Dampak:**\n- Semua layanan internal tidak tersedia\n- Email tetap berfungsi (cloud-based)\n- VPN tidak dapat digunakan\n\n**Aktivitas Maintenance:**\n- Update OS dan security patch\n- Backup database ke storage eksternal\n- Pembersihan log dan temporary files\n- Health check hardware (RAID, suhu, kipas)\n\nSimpan pekerjaan sebelum jam maintenance!",
                'category_id' => 5,
                'author_id' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Prosedur Pelaporan Insiden Keamanan',
                'slug' => 'prosedur-pelaporan-insiden-keamanan',
                'content' => "Jika Anda mencurigai insiden keamanan siber:\n\n1. **JANGAN** matikan komputer\n2. Cabut kabel jaringan/LAN\n3. Catat apa yang terjadi (waktu, gejala)\n4. Segera buat tiket kategori \"Lainnya\" dengan prioritas TINGGI\n5. Hubungi IT via telepon darurat: ext. 999\n\n**Tanda-tanda insiden:**\n- Pop-up aneh atau ransomware\n- Komputer tiba-tiba lambat\n- Email phishing yang mencurigakan\n- File hilang atau berubah sendiri\n\nJangan tunda pelaporan!",
                'category_id' => 5,
                'author_id' => 2,
                'is_published' => true,
            ],
        ];

        foreach ($articles as $article) {
            KnowledgeBase::firstOrCreate(['slug' => $article['slug']], $article);
        }
    }
}
