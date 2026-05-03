<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['customer', 'staff']);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }

        return $ticket->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['customer', 'staff']);
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }

        return $ticket->user_id === $user->id && in_array($ticket->status, ['open', 'in_progress'], true);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }

        return $ticket->user_id === $user->id && in_array($ticket->status, ['open', 'cancelled'], true);
    }

    public function comment(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }

        return $ticket->user_id === $user->id;
    }

    public function cancel(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return $ticket->isCancellable();
        }

        return $ticket->user_id === $user->id && $ticket->isCancellable();
    }
}
