# Snapstrip Photobooth

Bilik foto digital untuk acara, kafe, atau studio kecil. Operator membuat kode akses, tamu memakai kode itu untuk membuka satu sesi, memotret enam kali, memilih susunan cetak, lalu strip dikirim ke email dan semua foto masuk ke Google Drive.

![Laravel](https://img.shields.io/badge/Laravel-13-ff2d20?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-8-4479a1?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-6f7f63?style=flat-square)

## Isi

- [Fitur](#fitur)
- [Cara kerja](#cara-kerja)
- [Kebutuhan](#kebutuhan)
- [Instalasi](#instalasi)
- [Menjalankan](#menjalankan)
- [Akun staff](#akun-staff)
- [Menyambungkan Google Drive](#menyambungkan-google-drive)
- [Pengaturan](#pengaturan)
- [Alamat API](#alamat-api)
- [Struktur folder](#struktur-folder)
- [Panduan PDF](#panduan-pdf)

## Fitur

| Fitur | Keterangan |
| --- | --- |
| Kode akses sekali pakai | Enam karakter, dibuat admin, hangus setelah dipakai satu sesi |
| Sesi berbatas waktu | Enam menit per sesi, dihitung dari kode diterima |
| Enam potret | Hitungan tiga detik, potret ulang per foto sebelum lanjut |
| Tiga susunan cetak | Strip Six, Grid Six, Postcard Four |
| File strip | Disusun di server dengan GD sesuai susunan yang dipilih |
| Kirim email | Strip sebagai lampiran, tautan ke file dan ke folder Drive |
| Google Drive | Satu folder per sesi, dinamai kode akses, berisi enam foto dan strip |
| Strip di database | Lembar strip juga disimpan di kolom `strip_blob`, jadi phpMyAdmin bisa menampilkan gambarnya per sesi |
| Dashboard staff | Admin membuat kode, operator memantau kode dan sesi |
| Responsif | Tampilan berbeda untuk ponsel, tablet, desktop, dan layar lebar |

## Cara kerja

```
tamu                server                         google
 |                    |                              |
 |-- kode + email --> | validasi kode                |
 |                    | buat sesi (SNAP-XXXXXXXX)    |
 |-- 6 foto + bingkai->| simpan foto, susun strip     |
 |                    |-- kirim email -------------->|
 |                    |-- buat folder + unggah ----->|
 |<-- tautan strip ---|                              |
```

Kode akses hanya bisa dipakai sekali. Pengecekannya dilakukan di dalam transaksi database dengan penguncian baris, jadi dua tamu tidak bisa memakai kode yang sama meski menekan tombol bersamaan.

## Kebutuhan

- PHP 8.3 atau lebih baru, dengan ekstensi `gd`, `pdo_mysql`, `zip`
- Composer 2
- Node.js 20 atau lebih baru
- MySQL 8
- Browser yang mendukung `getUserMedia` (Chrome, Edge, Safari, Firefox terbaru)

Akses kamera hanya berjalan di `localhost` atau `https`. Membuka lewat alamat IP biasa akan ditolak browser.

## Instalasi

```bash
composer install
cp .env.example .env        # Windows: copy .env.example .env
php artisan key:generate
```

Buat database kosong bernama `snapstrip` (lewat phpMyAdmin atau `mysql -u root -e "CREATE DATABASE snapstrip"`), lalu cocokkan `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=snapstrip
DB_USERNAME=root
DB_PASSWORD=
```

Bangun tabel, akun staff, dan lima kode contoh:

```bash
php artisan migrate:fresh --seed
php artisan storage:link
npm install
```

`migrate:fresh` menghapus seluruh isi database lebih dulu. Jangan dipakai kalau sudah ada data sungguhan.

## Menjalankan

Dua terminal:

```bash
php artisan serve
npm run dev
```

Buka `http://localhost:8000`. Atau satu perintah saja:

```bash
composer run dev
```

Cek kesehatan server:

```bash
curl http://localhost:8000/health/live
curl http://localhost:8000/health/ready
```

`ready` menjawab `DOWN` bila MySQL mati atau nama database di `.env` belum cocok.

Untuk pemakaian tanpa terminal, jalankan `npm run build` sekali lalu akses lewat server web Laragon.

## Akun staff

Dibuat oleh `migrate:fresh --seed`:

| Peran | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `password` |
| Operator | `operator` | `password` |

Ganti sebelum dipakai di acara sungguhan:

```bash
php artisan tinker
>>> App\Models\User::where('username', 'admin')->update(['password' => Hash::make('sandi-baru')]);
```

Masuk lewat tombol **Staff** di pojok kanan atas.

## Menyambungkan Google Drive

Bagian ini opsional. Tanpa sambungan Google, foto tetap tersimpan di server dan tetap dikirim lewat email.

1. Buka [Google Cloud Console](https://console.cloud.google.com), buat project baru.
2. **APIs & Services > Library**, cari **Google Drive API**, tekan **Enable**.
3. **IAM & Admin > Service Accounts > Create Service Account**, beri nama bebas. Peran project boleh dikosongkan.
4. Tab **Keys > Add key > Create new key > JSON**. File `.json` akan terunduh.
5. Simpan file itu sebagai `storage/app/google/service-account.json`.
6. Buat folder di Google Drive, lalu **Share** ke alamat `client_email` dari file JSON tersebut dengan akses **Editor**.
7. Ambil ID folder dari alamatnya (`.../folders/1AbCdEfGhIjK` berarti `1AbCdEfGhIjK`), lalu isi `.env`:

```env
GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjK
# opsional, kalau file kunci disimpan di luar project
GOOGLE_SERVICE_ACCOUNT_JSON=/alamat/lengkap/service-account.json
```

8. Bersihkan cache dan uji:

```bash
php artisan config:clear
php artisan tinker
>>> app(App\Services\GoogleDriveUploader::class)->isConfigured()
```

Hasil `true` berarti kunci dan ID folder sudah terbaca. Setiap sesi akan membuat folder baru bernama `<KODE> SNAP-XXXXXXXX` berisi `potret-1.jpg` sampai `potret-6.jpg` dan `strip-SNAP-XXXXXXXX.jpg`.

Lembar strip yang sama juga disimpan sebagai gambar di kolom `strip_blob` pada tabel `booth_orders`, jadi phpMyAdmin bisa menampilkan pratinjaunya per sesi.

Kegagalan Drive tidak membatalkan sesi. Sebabnya dicatat di `storage/logs/laravel.log` dengan awalan `Upload Drive gagal`.

### Email

Pada pemasangan baru `MAIL_MAILER=log`, jadi email hanya ditulis ke `storage/logs/laravel.log`. Untuk mengirim sungguhan:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=alamat@gmail.com
MAIL_PASSWORD=kata-sandi-aplikasi
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=alamat@gmail.com
MAIL_FROM_NAME="Snapstrip"
```

Untuk Gmail, gunakan App Password, bukan kata sandi akun.

## Pengaturan

Semua pengaturan booth ada di `config/booth.php`:

```php
'shots_required'  => 6,      // jumlah potret per sesi
'session_seconds' => 6 * 60, // batas waktu sesi
'layouts'         => [ ... ] // susunan cetak, harga, warna kertas
```

Tampilan mengambil jumlah potret dari API, jadi mengubah `shots_required` ikut mengubah jumlah kotak di layar tanpa menyentuh React.

Warna, huruf, dan sudut lengkung ada di `resources/css/tokens.css`. Tidak ada komponen yang menulis kode warna langsung, jadi satu perubahan token berlaku ke seluruh halaman.

## Alamat API

Semua balasan memakai envelope yang sama:

```json
{ "message": "Data retrieved", "data": {}, "meta": { "timestamp": "", "version": "1.0.0" } }
```

```json
{ "error": { "message": "", "traceId": "", "details": [{ "field": "", "issue": "" }] } }
```

`traceId` selalu sama dengan header `X-Request-ID`.

| Metode | Alamat | Perlu masuk |
| --- | --- | --- |
| GET | `/api/v1/layouts` | tidak |
| POST | `/api/v1/booth-sessions` | tidak |
| POST | `/api/v1/booth-sessions/{id}/captures` | tidak |
| POST | `/api/v1/auth/login` | tidak |
| GET | `/api/v1/auth/session` | tidak |
| POST | `/api/v1/auth/logout` | tidak |
| GET | `/api/v1/access-codes` | ya |
| POST | `/api/v1/access-codes` | ya, admin |
| GET | `/health/live` | tidak |
| GET | `/health/ready` | tidak |

`/health/live` tidak menyentuh dependency apa pun. `/health/ready` memeriksa database dan menjawab `503` bila mati.

## Struktur folder

```
app/
  Http/Controllers/Api/     AuthController, AccessCodeController,
                            BoothSessionController, LayoutController
  Http/Middleware/          AssignRequestId
  Http/Requests/            validasi login, sesi, kiriman foto
  Http/Resources/           bentuk balasan access code dan order
  Mail/                     BoothStripMail
  Models/                   User, AccessCode, BoothOrder
  Services/                 StripComposer, GoogleDriveUploader
  Support/                  ApiResponse (envelope + pemetaan error)
config/booth.php            jumlah potret, durasi sesi, daftar bingkai
resources/css/              tokens, base, components
resources/js/
  ui/                       Container, Button, TextField, Toast, Steps, AppShell
  features/welcome/         halaman awal
  features/access/          kode akses
  features/capture/         kamera dan potret
  features/frames/          pilih susunan cetak
  features/done/            struk hasil
  features/staff/           role, login, admin, operator
  lib/                      api client, helper
routes/web.php              halaman + seluruh endpoint API
```

Tidak ada API terpisah. Halaman React dan endpoint berada di satu aplikasi Laravel.

## Panduan PDF

Panduan bergambar untuk pemula (18 halaman, Bahasa Indonesia) ada di
[`docs/Snapstrip-Panduan.pdf`](docs/Snapstrip-Panduan.pdf). Isinya: penjelasan project, instalasi langkah demi langkah, alur tamu dan staff, penyambungan Google Drive, cara membaca data di phpMyAdmin, daftar alamat API, dan pemecahan masalah umum.

## Lisensi

MIT.
