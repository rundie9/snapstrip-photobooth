<?php

namespace Database\Factories;

use App\Models\BoothOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BoothOrder>
 */
class BoothOrderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'public_id' => BoothOrder::generatePublicId(),
            'email' => fake()->safeEmail(),
            'status' => BoothOrder::STATUS_OPEN,
        ];
    }
}
