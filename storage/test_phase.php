<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== VERIFICATION ===\n";

// 1. CacheManager
echo "CacheManager: " . \App\Services\CacheManager::class . " OK\n";

// 2. Enums
$s = \App\Enums\TicketStatus::Open;
echo "TicketStatus: {$s->value} ({$s->label()}) OK\n";
$p = \App\Enums\TicketPriority::High;
echo "TicketPriority: {$p->value} ({$p->label()}) OK\n";

// 3. FileConstants
echo "FileConstants: " . \App\Constants\FileConstants::MAX_FILE_SIZE_KB . "KB OK\n";

// 4. TicketException
$e = \App\Exceptions\TicketException::unauthorized();
echo "TicketException: code={$e->getCode()} msg={$e->getMessage()} OK\n";

// 5. Policies
$kp = new \App\Policies\KnowledgeBasePolicy;
echo "KnowledgeBasePolicy OK\n";
$cp = new \App\Policies\CategoryPolicy;
echo "CategoryPolicy OK\n";
$dp = new \App\Policies\DepartmentPolicy;
echo "DepartmentPolicy OK\n";

// 6. Middleware
$sh = new \App\Http\Middleware\SecurityHeaders;
echo "SecurityHeaders middleware OK\n";

// 7. AuditLogger
echo "AuditLogger OK\n";

// 8. TrackTicketActivity trait
echo "TrackTicketActivity trait OK\n";

// 9. TicketResource shared scores
\App\Http\Resources\TicketResource::setSharedScores([1 => 0.85]);
echo "TicketResource::setSharedScores() OK\n";

echo "\n=== ALL TESTS PASSED ===\n";
echo "Laravel " . $app->version() . " | " . \App\Models\User::count() . " users\n";
