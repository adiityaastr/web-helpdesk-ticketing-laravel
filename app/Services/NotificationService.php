<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use App\Notifications\TicketActivityNotification;

class NotificationService
{
    /**
     * Notify related users (and optionally all staff) about a ticket event.
     *
     * @param Ticket  $ticket
     * @param string  $action
     * @param Comment|null $comment
     * @param bool    $notifyAllStaff If true, also notify all staff users
     *
     * @return void
     */
    public function notifyTicketUpdate(
        Ticket $ticket,
        string $action,
        ?Comment $comment = null,
        bool $notifyAllStaff = false
    ): void {
        $ticket->loadMissing(['reporter', 'assignee']);

        $users = collect([$ticket->reporter, $ticket->assignee])
            ->filter()
            ->unique('id')
            ->values();

        if ($notifyAllStaff) {
            // Load staff users with caching to avoid repeated DB queries
            $staffs = Cache::remember('notifications.staff_users', 300, function () {
                return User::role('staff')->get();
            });
            $users = $users->merge($staffs)->values();
        }

        if ($users->isNotEmpty()) {
            Notification::send($users, new TicketActivityNotification($ticket, $comment, $action));
        }
    }
}
