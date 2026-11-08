<?php

namespace App\Services;

use App\Models\BoothOrder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

/**
 * Uploads one finished run to Drive as its own folder named after the access
 * code, then returns the shareable folder link.
 *
 * Talks to the Drive REST API directly with a service-account JWT signed by
 * OpenSSL. That avoids the multi-hundred-megabyte google/apiclient package for
 * two endpoints. Ceiling: only files.create and files.get are covered; add the
 * SDK when Drive features beyond upload and link are needed.
 */
class GoogleDriveUploader
{
    private const SCOPE = 'https://www.googleapis.com/auth/drive.file';

    private const FOLDER_MIME = 'application/vnd.google-apps.folder';

    public function isConfigured(): bool
    {
        return (string) config('services.google.drive_folder_id') !== ''
            && is_file((string) config('services.google.service_account_json'));
    }

    /**
     * @return array{folderId: string, link: string}
     */
    public function uploadOrder(BoothOrder $order): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Google Drive belum dikonfigurasi.');
        }

        $token = $this->accessToken();
        $folderId = $this->createFolder($token, trim(($order->access_code ?? 'SESI').' '.$order->public_id));

        foreach ($order->photo_paths ?? [] as $index => $path) {
            $this->uploadFile($token, $folderId, $path, 'potret-'.($index + 1).'.jpg');
        }

        if ($order->strip_path) {
            $this->uploadFile($token, $folderId, $order->strip_path, 'strip-'.$order->public_id.'.jpg');
        }

        return ['folderId' => $folderId, 'link' => $this->folderLink($token, $folderId)];
    }

    /**
     * Fire-and-forget wrapper: a dead Drive must never lose the photos or the
     * customer's session.
     */
    public function tryUploadOrder(BoothOrder $order): void
    {
        if (! $this->isConfigured()) {
            return;
        }

        try {
            $result = $this->uploadOrder($order);

            $order->update([
                'drive_folder_id' => $result['folderId'],
                'drive_link' => $result['link'],
            ]);
        } catch (Throwable $exception) {
            Log::warning('Upload Drive gagal untuk '.$order->public_id.': '.$exception->getMessage());
        }
    }

    private function createFolder(string $token, string $name): string
    {
        $response = Http::withToken($token)
            ->acceptJson()
            ->post('https://www.googleapis.com/drive/v3/files?fields=id', [
                'name' => $name,
                'mimeType' => self::FOLDER_MIME,
                'parents' => [(string) config('services.google.drive_folder_id')],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Folder Drive gagal dibuat: '.$response->body());
        }

        return (string) $response->json('id');
    }

    private function uploadFile(string $token, string $folderId, string $path, string $name): void
    {
        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            return;
        }

        $boundary = 'snapstrip'.bin2hex(random_bytes(8));
        $metadata = json_encode([
            'name' => $name,
            'parents' => [$folderId],
            'mimeType' => 'image/jpeg',
        ], JSON_THROW_ON_ERROR);

        $body = "--{$boundary}\r\n"
            ."Content-Type: application/json; charset=UTF-8\r\n\r\n"
            .$metadata."\r\n"
            ."--{$boundary}\r\n"
            ."Content-Type: image/jpeg\r\n\r\n"
            .$disk->get($path)."\r\n"
            ."--{$boundary}--";

        $response = Http::withToken($token)
            ->withBody($body, "multipart/related; boundary={$boundary}")
            ->post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');

        if ($response->failed()) {
            throw new RuntimeException('Unggah file Drive gagal: '.$response->body());
        }
    }

    private function folderLink(string $token, string $folderId): string
    {
        $response = Http::withToken($token)
            ->acceptJson()
            ->get("https://www.googleapis.com/drive/v3/files/{$folderId}?fields=webViewLink");

        return (string) ($response->json('webViewLink') ?? "https://drive.google.com/drive/folders/{$folderId}");
    }

    /**
     * Service-account JWT grant, cached until shortly before it expires so one
     * batch of uploads reuses a single token.
     */
    private function accessToken(): string
    {
        $cacheKey = 'google-drive-token:'.md5((string) config('services.google.service_account_json'));

        return Cache::remember($cacheKey, 3000, function (): string {
            $key = json_decode(
                (string) file_get_contents((string) config('services.google.service_account_json')),
                true,
            );

            if (! is_array($key) || ! isset($key['client_email'], $key['private_key'])) {
                throw new RuntimeException('File kunci service account tidak lengkap.');
            }

            $now = time();
            $claims = [
                'iss' => $key['client_email'],
                'scope' => self::SCOPE,
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ];

            $unsigned = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']))
                .'.'.$this->base64Url(json_encode($claims));

            $signature = '';
            $signed = openssl_sign($unsigned, $signature, $key['private_key'], OPENSSL_ALGO_SHA256);

            if (! $signed) {
                throw new RuntimeException('Tanda tangan JWT gagal dibuat.');
            }

            $assertion = $unsigned.'.'.$this->base64Url($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $assertion,
            ]);

            if ($response->failed() || ! $response->json('access_token')) {
                throw new RuntimeException('Token Google ditolak: '.$response->body());
            }

            return (string) $response->json('access_token');
        });
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
