<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The composed strip is also kept in the row so phpMyAdmin shows the
     * picture for each session instead of a bare file path. The full size
     * photos stay on disk; this is one preview per order.
     *
     * Laravel has no mediumBlob() helper, so MySQL gets a raw ALTER while
     * other drivers fall back to a plain binary column.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE booth_orders ADD strip_blob MEDIUMBLOB NULL AFTER strip_path');
            DB::statement('ALTER TABLE booth_orders ADD strip_mime VARCHAR(40) NULL AFTER strip_blob');

            return;
        }

        Schema::table('booth_orders', function (Blueprint $table) {
            $table->binary('strip_blob')->nullable();
            $table->string('strip_mime', 40)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('booth_orders', function (Blueprint $table) {
            $table->dropColumn(['strip_blob', 'strip_mime']);
        });
    }
};
