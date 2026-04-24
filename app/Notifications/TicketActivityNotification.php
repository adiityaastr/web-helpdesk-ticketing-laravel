<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TicketActivityNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Ticket $ticket,
        protected ?Comment $comment = null,
        protected string $action = 'updated',
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'ticket_uuid' => $this->ticket->uuid,
            'title' => $this->ticket->title,
            'action' => $this->action,
            'comment_message' => $this->comment?->message,
        ];
    }
}
