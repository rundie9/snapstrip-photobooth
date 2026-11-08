<?php

namespace Database\Seeders;

use App\Models\AccessCode;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Creates the two staff accounts the booth needs, plus a pool of codes so
     * the flow can be exercised right after a fresh clone.
     */
    public function run(): void
    {
        $staff = [
            ['name' => 'Admin Booth', 'username' => 'admin', 'role' => User::ROLE_ADMIN],
            ['name' => 'Operator Booth', 'username' => 'operator', 'role' => User::ROLE_OPERATOR],
        ];

        foreach ($staff as $row) {
            User::query()->updateOrCreate(
                ['username' => $row['username']],
                [
                    'name' => $row['name'],
                    'email' => $row['username'].'@snapstrip.test',
                    'password' => Hash::make('password'),
                    'role' => $row['role'],
                ],
            );
        }

        if (AccessCode::query()->doesntExist()) {
            foreach (range(1, 5) as $ignored) {
                AccessCode::query()->create([
                    'code' => Str::upper(Str::random(6)),
                    'status' => AccessCode::STATUS_ACTIVE,
                ]);
            }
        }
    }
}
