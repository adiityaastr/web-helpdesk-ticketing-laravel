<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dateTime('sla_deadline')->nullable()->after('assigned_to');
            $table->dateTime('resolved_at')->nullable()->after('sla_deadline');
            $table->unsignedTinyInteger('rating')->nullable()->after('resolved_at');
            $table->text('rating_comment')->nullable()->after('rating');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['sla_deadline', 'resolved_at', 'rating', 'rating_comment']);
        });
    }
};