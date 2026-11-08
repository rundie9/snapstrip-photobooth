<?php

use App\Http\Controllers\Api\AccessCodeController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoothSessionController;
use App\Http\Controllers\Api\LayoutController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health/live', [HealthController::class, 'live']);
Route::get('/health/ready', [HealthController::class, 'ready']);

Route::prefix('api/v1')->group(function (): void {
    Route::get('layouts', [LayoutController::class, 'index']);

    Route::middleware('throttle:20,1')->group(function (): void {
        Route::post('booth-sessions', [BoothSessionController::class, 'store']);
        Route::post('booth-sessions/{order:public_id}/captures', [BoothSessionController::class, 'capture']);
    });

    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('auth/session', [AuthController::class, 'session']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::middleware('auth')->group(function (): void {
        Route::get('access-codes', [AccessCodeController::class, 'index']);
        Route::post('access-codes', [AccessCodeController::class, 'store']);
    });
});

Route::view('/', 'app');
