<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoothSessionRequest;
use App\Http\Requests\StoreCaptureRequest;
use App\Http\Resources\BoothOrderResource;
use App\Mail\BoothStripMail;
use App\Models\AccessCode;
use App\Models\BoothOrder;
use App\Services\GoogleDriveUploader;
use App\Services\StripComposer;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Throwable;

class BoothSessionController extends Controller
{
    public function __construct(
        private readonly StripComposer $composer,
        private readonly GoogleDriveUploader $drive,
    ) {}

    /**
     * Opens one run: consumes an active access code and creates the order.
     */
    public function store(StoreBoothSessionRequest $request): JsonResponse
    {
        $email = (string) $request->string('email');
        $code = (string) $request->string('code');

        return DB::transaction(function () use ($code, $email): JsonResponse {
            $accessCode = AccessCode::query()
                ->where('code', $code)
                ->lockForUpdate()
                ->first();

            if (! $accessCode instanceof AccessCode || ! $accessCode->isActive()) {
                return ApiResponse::error('Kode akses tidak valid atau sudah dipakai.', 422, [
                    ['field' => 'code', 'issue' => 'Kode akses tidak valid atau sudah dipakai.'],
                ]);
            }

            $order = BoothOrder::query()->create([
                'public_id' => BoothOrder::generatePublicId(),
                'email' => $email,
                'access_code' => $accessCode->code,
                'status' => BoothOrder::STATUS_OPEN,
            ]);

            $accessCode->update([
                'status' => AccessCode::STATUS_USED,
                'used_email' => $email,
                'used_at' => now(),
            ]);

            return ApiResponse::created([
                'id' => $order->public_id,
                'email' => $order->email,
                'shotsRequired' => (int) config('booth.shots_required'),
                'sessionSeconds' => (int) config('booth.session_seconds'),
                'status' => $order->status,
            ], 'Sesi foto dibuka.');
        });
    }

    /**
     * Receives the six shots, renders the print file, and mails it.
     */
    public function capture(StoreCaptureRequest $request, BoothOrder $order): JsonResponse
    {
        if (! $order->isOpen()) {
            return ApiResponse::error('Sesi ini sudah dikirim sebelumnya.', 409);
        }

        $layoutId = (string) $request->string('layout_id');
        $layout = collect(config('booth.layouts'))->firstWhere('id', $layoutId);

        if (! is_array($layout)) {
            return ApiResponse::error('Layout cetak tidak dikenal.', 422, [
                ['field' => 'layout_id', 'issue' => 'Layout cetak tidak dikenal.'],
            ]);
        }

        $directory = 'photos/'.$order->public_id;
        $paths = [];

        foreach ($request->file('photos', []) as $index => $file) {
            $extension = strtolower($file->extension() ?: 'jpg');
            $paths[] = $file->storeAs($directory, 'shot-'.($index + 1).'.'.$extension, 'public');
        }

        $stripPath = $this->composer->compose($paths, $layout, $order->public_id);

        $order->update([
            'layout_id' => $layout['id'],
            'arrangement' => $layout['columns'].'x'.$layout['rows'],
            'shot_count' => count($paths),
            'amount' => $layout['price'],
            'photo_paths' => $paths,
            'strip_path' => $stripPath,
            'strip_blob' => Storage::disk('public')->get($stripPath),
            'strip_mime' => 'image/jpeg',
            'status' => BoothOrder::STATUS_CAPTURED,
        ]);

        try {
            Mail::to($order->email)->send(new BoothStripMail($order));
            $order->update(['email_sent_at' => now()]);
        } catch (Throwable $exception) {
            // A dead mailer must not lose the photos the customer just took.
            report($exception);
        }

        // Folder in Drive is named after the access code, so the operator can
        // match a printed strip back to the code shown on the admin screen.
        $this->drive->tryUploadOrder($order);

        return ApiResponse::created(
            (new BoothOrderResource($order->refresh()))->resolve(),
            'Foto tersimpan dan dikirim ke email.',
        );
    }
}
