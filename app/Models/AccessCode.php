<?php

namespace App\Models;

use Database\Factories\AccessCodeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['code', 'status', 'created_by', 'used_email', 'used_at'])]
class AccessCode extends Model
{
    /** @use HasFactory<AccessCodeFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_USED = 'used';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'used_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
