<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * One request id per call, echoed as X-Request-ID and attached to every log
 * line so an error envelope can be traced back to its log entry.
 */
class AssignRequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) ($request->header('X-Request-ID') ?: Str::uuid());

        $request->attributes->set('request_id', $requestId);
        Log::shareContext(['traceId' => $requestId]);

        $response = $next($request);
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}
