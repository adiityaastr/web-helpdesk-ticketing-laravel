<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['customer', 'staff', 'admin']);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->hasAnyRole(['staff', 'admin'])) {
            return true;
        }

        return $ticket->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['customer', 'staff', 'admin']);
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('staff')) {
            return true;
        }

        return $ticket->user_id === $user->id && in_array($ticket->status, ['open', 'in_progress'], true);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($user->hasAnyRole(['staff', 'admin'])) {
            return true;
        }

        return $ticket->user_id === $user->id && $ticket->status === 'open';
    }

    public function comment(User $user, Ticket $ticket): bool
    {
        if ($user->hasAnyRole(['staff', 'admin'])) {
            return true;
        }

        return $ticket->user_id === $user->id;
    }
}