<?php

namespace Database\Factories;

use App\Models\AccessCode;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AccessCode>
 */
class AccessCodeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => Str::upper(Str::random(6)),
            'status' => AccessCode::STATUS_ACTIVE,
        ];
    }

    public function used(): static
    {
        return $this->state(fn (): array => [
            'status' => AccessCode::STATUS_USED,
            'used_email' => fake()->safeEmail(),
            'used_at' => now(),
        ]);
    }
}
