<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->index('status');
            $table->index('priority');
            $table->index('user_id');
            $table->index('assigned_to');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->index('ticket_id');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index('notifiable_id');
            $table->index('read_at');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['priority']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['assigned_to']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['ticket_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['notifiable_id']);
            $table->dropIndex(['read_at']);
        });
    }
};
