<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccessCodeResource;
use App\Models\AccessCode;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AccessCodeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $codes = AccessCode::query()->latest('id')->limit(60)->get();

        return ApiResponse::ok(
            AccessCodeResource::collection($codes)->resolve(),
            'Daftar kode akses.',
            [
                'counts' => [
                    'total' => AccessCode::query()->count(),
                    'active' => AccessCode::query()->where('status', AccessCode::STATUS_ACTIVE)->count(),
                    'used' => AccessCode::query()->where('status', AccessCode::STATUS_USED)->count(),
                ],
            ],
        );
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Hanya admin yang bisa membuat kode akses.');

        $code = AccessCode::query()->create([
            'code' => $this->uniqueCode(),
            'status' => AccessCode::STATUS_ACTIVE,
            'created_by' => $request->user()->id,
        ]);

        return ApiResponse::created(
            (new AccessCodeResource($code))->resolve(),
            'Kode akses baru dibuat.',
        );
    }

    private function uniqueCode(): string
    {
        do {
            $code = Str::upper(Str::random(6));
        } while (AccessCode::query()->where('code', $code)->exists());

        return $code;
    }
}
