<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;

class CommentService
{
    /**
     * Create a new comment for a ticket with file uploads.
     *
     * @param Ticket $ticket
     * @param User $user
     * @param string $message
     * @param bool $isInternal
     * @param array $uploadedFiles Array of UploadedFile objects
     * @return Comment
     * @throws \RuntimeException when the ticket is locked
     */
    public function addCommentWithAttachments(Ticket $ticket, User $user, string $message, bool $isInternal, array $uploadedFiles = []): Comment
    {
        if ($this->isCommentLocked($ticket)) {
            throw new \RuntimeException('Cannot add comment to a closed or cancelled ticket.');
        }

        $attachmentPaths = [];
        foreach ($uploadedFiles as $file) {
            $attachmentPaths[] = $file->store('tickets/comments', 'public');
        }

        /** @var Comment $comment */
        $comment = $ticket->comments()->create([
            'user_id' => $user->id,
            'message' => $message,
            'is_internal' => $isInternal,
            'attachments' => $attachmentPaths,
        ]);

        return $comment;
    }

    /**
     * Create a new comment for a ticket.
     *
     * @param Ticket $ticket
     * @param User $user
     * @param string $message
     * @param bool $isInternal
     * @param array $attachments
     * @return Comment
     * @throws \InvalidArgumentException when the ticket is locked
     */
    public function addComment(Ticket $ticket, User $user, string $message, bool $isInternal, array $attachments): Comment
    {
        if ($this->isCommentLocked($ticket)) {
            throw new \RuntimeException('Cannot add comment to a closed or cancelled ticket.');
        }

        /** @var Comment $comment */
        $comment = $ticket->comments()->create([
            'user_id' => $user->id,
            'message' => $message,
            'is_internal' => $isInternal,
            'attachments' => $attachments,
        ]);

        return $comment;
    }

    /**
     * Determine if a ticket is locked for commenting.
     */
    public function isCommentLocked(Ticket $ticket): bool
    {
        return in_array($ticket->status, ['closed', 'cancelled']);
    }
}
