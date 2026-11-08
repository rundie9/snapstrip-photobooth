<?php

namespace App\Models;

use Database\Factories\BoothOrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

#[Fillable([
    'public_id', 'email', 'layout_id', 'arrangement', 'shot_count',
    'amount', 'access_code', 'photo_paths', 'strip_path', 'status', 'email_sent_at',
])]
class BoothOrder extends Model
{
    /** @use HasFactory<BoothOrderFactory> */
    use HasFactory;

    public const STATUS_OPEN = 'open';

    public const STATUS_CAPTURED = 'captured';

    public static function generatePublicId(): string
    {
        do {
            $id = 'SNAP-'.Str::upper(Str::random(8));
        } while (self::query()->where('public_id', $id)->exists());

        return $id;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'photo_paths' => 'array',
            'email_sent_at' => 'datetime',
        ];
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }
}
