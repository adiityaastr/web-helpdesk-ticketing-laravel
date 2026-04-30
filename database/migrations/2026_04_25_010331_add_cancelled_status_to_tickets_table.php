<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check");
            DB::statement("ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled'))");
        } else {
            DB::statement("ALTER TABLE tickets MODIFY COLUMN status ENUM('open','in_progress','resolved','closed','cancelled') NOT NULL DEFAULT 'open'");
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check");
            DB::statement("ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))");
        } else {
            DB::statement("ALTER TABLE tickets MODIFY COLUMN status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open'");
        }
    }
};
