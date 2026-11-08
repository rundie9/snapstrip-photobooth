<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Health probes follow the house standard: liveness must never touch a
 * dependency, readiness checks only critical ones and reports a spectrum
 * (UP / DEGRADED / DOWN) instead of a binary.
 */
class HealthController extends Controller
{
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'UP',
            'service' => strtolower((string) config('booth.name')).'-booth-api',
            'version' => (string) config('booth.version'),
            'timestamp' => now()->toIso8601String(),
            'checks' => new \stdClass,
        ]);
    }

    public function ready(): JsonResponse
    {
        $database = 'UP';

        try {
            DB::select('select 1');
        } catch (Throwable $exception) {
            report($exception);
            $database = 'DOWN';
        }

        $healthy = $database === 'UP';

        return response()->json([
            'status' => $healthy ? 'UP' : 'DOWN',
            'service' => strtolower((string) config('booth.name')).'-booth-api',
            'version' => (string) config('booth.version'),
            'timestamp' => now()->toIso8601String(),
            'checks' => ['database' => $database],
        ], $healthy ? 200 : 503);
    }
}
