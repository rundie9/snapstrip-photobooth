<?php

namespace App\Support;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Response envelope for every /api/v1 endpoint.
 *
 * Shape is fixed by the house API standard: success
 * { message, data, meta{timestamp,version} }, failure
 * { error{message,traceId,details} }. The traceId always equals X-Request-ID.
 */
class ApiResponse
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public static function ok(mixed $data, string $message = 'Data retrieved', array $meta = []): JsonResponse
    {
        return self::envelope($data, $message, Response::HTTP_OK, $meta);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public static function created(mixed $data, string $message = 'Resource created', array $meta = []): JsonResponse
    {
        return self::envelope($data, $message, Response::HTTP_CREATED, $meta);
    }

    public static function noContent(): Response
    {
        return response()->noContent();
    }

    /**
     * @param  list<array{field: string, issue: string}>  $details
     */
    public static function error(
        string $message,
        int $status,
        array $details = [],
        ?string $traceId = null,
    ): JsonResponse {
        return response()->json([
            'error' => [
                'message' => $message,
                'traceId' => $traceId ?? self::traceId(request()),
                'details' => $details,
            ],
        ], $status);
    }

    /**
     * Maps any exception thrown inside the API surface onto the envelope.
     */
    public static function fromException(Throwable $exception, Request $request): JsonResponse
    {
        $traceId = self::traceId($request);

        if ($exception instanceof ValidationException) {
            $details = [];

            foreach ($exception->errors() as $field => $issues) {
                foreach ($issues as $issue) {
                    $details[] = ['field' => $field, 'issue' => $issue];
                }
            }

            return self::error('Data yang dikirim belum lengkap atau tidak valid.', 422, $details, $traceId);
        }

        if ($exception instanceof AuthenticationException) {
            return self::error('Sesi kamu sudah berakhir. Silakan masuk lagi.', 401, [], $traceId);
        }

        if ($exception instanceof AuthorizationException) {
            return self::error('Kamu tidak punya akses ke aksi ini.', 403, [], $traceId);
        }

        if ($exception instanceof ThrottleRequestsException) {
            return self::error(
                'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
                429,
                [],
                $traceId,
            )->withHeaders($exception->getHeaders());
        }

        if ($exception instanceof ModelNotFoundException || $exception instanceof NotFoundHttpException) {
            return self::error('Data yang dicari tidak ditemukan.', 404, [], $traceId);
        }

        if ($exception instanceof HttpExceptionInterface) {
            $status = $exception->getStatusCode();

            if ($status < 500) {
                return self::error($exception->getMessage() ?: 'Permintaan tidak bisa diproses.', $status, [], $traceId);
            }
        }

        report($exception);

        return self::error('Ada gangguan di server. Coba lagi sebentar lagi.', 500, [], $traceId);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private static function envelope(mixed $data, string $message, int $status, array $meta): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'data' => $data,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'version' => (string) config('booth.version'),
                ...$meta,
            ],
        ], $status);
    }

    private static function traceId(Request $request): string
    {
        $fromRequest = (string) $request->attributes->get('request_id', '');

        return $fromRequest !== '' ? $fromRequest : (string) Str::uuid();
    }
}
