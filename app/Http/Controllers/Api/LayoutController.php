<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class LayoutController extends Controller
{
    public function index(): JsonResponse
    {
        $layouts = array_values(array_map(fn (array $layout): array => [
            'id' => $layout['id'],
            'name' => $layout['name'],
            'columns' => $layout['columns'],
            'rows' => $layout['rows'],
            'shotsUsed' => $layout['shots_used'],
            'price' => $layout['price'],
            'paper' => $layout['paper'],
            'note' => $layout['note'],
        ], config('booth.layouts')));

        return ApiResponse::ok($layouts, 'Daftar layout cetak.');
    }
}
