<?php

namespace App\Http\Resources;

use App\Models\BoothOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin BoothOrder
 */
class BoothOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->public_id,
            'email' => $this->email,
            'layoutId' => $this->layout_id,
            'arrangement' => $this->arrangement,
            'shotCount' => $this->shot_count,
            'amount' => $this->amount,
            'status' => $this->status,
            'stripUrl' => $this->strip_path ? Storage::disk('public')->url($this->strip_path) : null,
            'driveLink' => $this->drive_link,
            'photoUrls' => array_map(
                fn (string $path): string => Storage::disk('public')->url($path),
                $this->photo_paths ?? [],
            ),
            'emailSentAt' => $this->email_sent_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
