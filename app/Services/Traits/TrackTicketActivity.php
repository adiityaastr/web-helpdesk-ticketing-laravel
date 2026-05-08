<?php

namespace App\Services\Traits;

use App\Models\Ticket;
use App\Models\User;
use App\Services\CacheManager;

trait TrackTicketActivity
{
    protected function logActivity(Ticket $ticket, User $user, string $action, string $description): void
    {
        $ticket->activityLogs()->create([
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
        ]);
    }

    protected function invalidateTicketCaches(Ticket $ticket, ?int $userId = null): void
    {
        CacheManager::forgetAdminDashboard();

        if ($userId !== null) {
            CacheManager::forgetPortalDashboard($userId);
        }

        (new \App\Services\SawService())->invalidateCache();
    }
}
