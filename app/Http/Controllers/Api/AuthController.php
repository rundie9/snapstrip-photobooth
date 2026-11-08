<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Session cookie login for booth staff. No tokens are ever handed to the
     * browser, so nothing sensitive can be read back out of localStorage.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $throttleKey = 'staff-login:'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 8)) {
            return ApiResponse::error(
                'Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi.',
                429,
            );
        }

        if (! Auth::attempt($request->only('username', 'password'))) {
            RateLimiter::hit($throttleKey, 60);

            return ApiResponse::error('Username atau password salah.', 422, [
                ['field' => 'password', 'issue' => 'Username atau password salah.'],
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        return ApiResponse::ok($this->staffPayload($request->user()), 'Berhasil masuk.');
    }

    public function session(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return ApiResponse::error('Belum ada sesi staff yang aktif.', 401);
        }

        return ApiResponse::ok($this->staffPayload($user), 'Sesi aktif.');
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function staffPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'role' => $user->role,
        ];
    }
}
