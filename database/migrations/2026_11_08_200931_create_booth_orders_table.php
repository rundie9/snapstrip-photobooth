<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booth_orders', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->string('email');
            $table->string('layout_id')->nullable();
            $table->string('arrangement')->nullable();
            $table->unsignedTinyInteger('shot_count')->default(0);
            $table->unsignedInteger('amount')->default(0);
            $table->string('access_code', 8)->nullable();
            $table->json('photo_paths')->nullable();
            $table->string('strip_path')->nullable();
            $table->string('status')->default('open');
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booth_orders');
    }
};
