<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketActivityNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

class TicketService
{
    /**
     * Create a new ticket from a request and reporter user.
     */
    public function createTicket(Request $request, User $user): Ticket
    {
        $attachmentPaths = [];

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attachment) {
                $attachmentPaths[] = $attachment->store('tickets/attachments', 'public');
            }
        }

        $ticket = Ticket::query()->create([
            'user_id' => $user->id,
            'category_id' => $request->integer('category_id'),
            'title' => $request->string('title'),
            'description' => $request->string('description'),
            'priority' => $request->input('priority'),
            'status' => 'open',
        ]);

        $ticket->comments()->create([
            'user_id' => $user->id,
            'message' => 'Tiket berhasil dibuat.',
            'is_internal' => false,
            'attachments' => $attachmentPaths,
        ]);

        $ticket->activityLogs()->create([
            'user_id' => $user->id,
            'action' => 'created',
            'description' => 'Tiket dibuat oleh pelapor.',
        ]);

        $this->notifyRelatedUsers($ticket, 'created');

        Cache::forget("portal_dashboard_stats_{$user->id}");
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_charts');
        (new SawService())->invalidateCache();

        return $ticket;
    }

    /** Update ticket with payload. */
    public function updateTicket(Ticket $ticket, array $payload, User $user): Ticket
    {
        $oldStatus = $ticket->status;
        $oldAssignee = $ticket->assigned_to;

        // Normalize missing fields
        $payload = array_merge([
            'title' => $ticket->title,
            'description' => $ticket->description,
        ], $payload);

        if (isset($payload['status']) && $payload['status'] === 'resolved' && $oldStatus !== 'resolved') {
            $payload['resolved_at'] = now();
            $payload['cancelled_at'] = null;
        }

        if (isset($payload['status']) && $payload['status'] === 'cancelled' && $oldStatus !== 'cancelled') {
            $payload['cancelled_at'] = now();
            $payload['resolved_at'] = null;
        }

        if (isset($payload['status']) && $payload['status'] === 'in_progress') {
            if ($oldStatus === 'resolved') {
                $payload['resolved_at'] = null;
            }
            if ($oldStatus === 'cancelled') {
                $payload['cancelled_at'] = null;
            }
        }

        $ticket->update($payload);

        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_charts');
        (new SawService())->invalidateCache();

        $changes = [];
        if ($oldStatus !== $ticket->status) {
            $changes[] = "Status berubah dari {$oldStatus} menjadi {$ticket->status}";
        }
        if ($oldAssignee !== $ticket->assigned_to) {
            $newAssignee = $ticket->assignee?->name ?? 'Tidak ada';
            $changes[] = "Ditugaskan ke {$newAssignee}";
        }

        if (! empty($changes)) {
            $ticket->activityLogs()->create([
                'user_id' => $user->id,
                'action' => 'updated',
                'description' => implode('. ', $changes),
            ]);
        }

        $this->notifyRelatedUsers($ticket, 'updated');

        return $ticket;
    }

    public function cancelTicket(Ticket $ticket, User $user): Ticket
    {
        $ticket->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $ticket->activityLogs()->create([
            'user_id' => $user->id,
            'action' => 'cancelled',
            'description' => 'Tiket dibatalkan oleh pelapor.',
        ]);

        $this->notifyRelatedUsers($ticket, 'cancelled');

        Cache::forget("portal_dashboard_stats_{$ticket->user_id}");
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_charts');
        (new SawService())->invalidateCache();

        return $ticket;
    }

    public function confirmResolution(Ticket $ticket, User $user): Ticket
    {
        if ($ticket->user_id !== $user->id) {
            throw new \Exception('Only reporter can confirm resolution');
        }

        if ($ticket->status !== 'resolved') {
            throw new \Exception('Ticket not resolved yet');
        }

        if ($ticket->resolved_confirmed_at) {
            throw new \Exception('Already confirmed');
        }

        $ticket->update([
            'resolved_confirmed_at' => now(),
            'status' => 'closed',
        ]);

        $ticket->comments()->create([
            'user_id' => $user->id,
            'message' => 'Pelapor mengonfirmasi penyelesaian. Tiket ditutup.',
            'is_internal' => false,
        ]);

        $ticket->activityLogs()->create([
            'user_id' => $user->id,
            'action' => 'confirmed',
            'description' => 'Pelapor mengonfirmasi penyelesaian tiket.',
        ]);

        $this->notifyRelatedUsers($ticket, 'confirmed');
        (new SawService())->invalidateCache();

        return $ticket;
    }

    public function rejectResolution(Ticket $ticket, string $reason, User $user): Ticket
    {
        if ($ticket->user_id !== $user->id) {
            throw new \Exception('Only reporter can reject resolution');
        }

        if ($ticket->status !== 'resolved') {
            throw new \Exception('Ticket not resolved yet');
        }

        if ($ticket->resolved_confirmed_at) {
            throw new \Exception('Already confirmed');
        }

        $ticket->update([
            'status' => 'in_progress',
            'resolved_at' => null,
        ]);

        $ticket->comments()->create([
            'user_id' => $user->id,
            'message' => 'Pelapor menyatakan permasalahan belum selesai. Alasan: ' . $reason,
            'is_internal' => false,
        ]);

        $ticket->activityLogs()->create([
            'user_id' => $user->id,
            'action' => 'rejected',
            'description' => 'Pelapor menolak penyelesaian. Tiket dibuka kembali.',
        ]);

        $this->notifyRelatedUsers($ticket, 'reopened');

        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_charts');
        (new SawService())->invalidateCache();

        return $ticket;
    }

    public function deleteTicket(Ticket $ticket): void
    {
        foreach ($ticket->comments as $comment) {
            foreach ($comment->attachments ?? [] as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $ticket->delete();

        Cache::forget("portal_dashboard_stats_{$ticket->user_id}");
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_charts');
        (new SawService())->invalidateCache();
    }

    public function getTicketDetail(Ticket $ticket, User $user): array
    {
        // Build a lightweight detail structure including only public comments for non-staff
        $ticket->load(['category', 'reporter', 'assignee', 'comments.user']);

        $comments = $ticket->publicComments->map(function ($comment) {
            return [
                'id' => $comment->id,
                'message' => $comment->message,
                'attachments' => $comment->attachments ?? [],
                'created_at' => $comment->created_at?->toDateTimeString(),
                'user' => [
                    'id' => $comment->user?->id,
                    'name' => $comment->user?->name,
                ],
            ];
        })->values();

        return [
            'ticket' => $ticket,
            'comments' => $comments,
        ];
    }

    /**
     * Rate a resolved ticket.
     *
     * @throws \Exception if validation fails
     */
    public function rateTicket(Ticket $ticket, User $user, int $rating, ?string $ratingComment): Ticket
    {
        if ($ticket->user_id !== $user->id) {
            throw new \Exception('Hanya pelapor yang dapat memberi rating.');
        }

        if ($ticket->status !== 'resolved') {
            throw new \Exception('Tiket harus berstatus selesai untuk memberi rating.');
        }

        if ($ticket->rating !== null) {
            throw new \Exception('Rating sudah diberikan.');
        }

        $ticket->update([
            'rating' => $rating,
            'rating_comment' => $ratingComment,
        ]);

        (new SawService())->invalidateCache();

        return $ticket;
    }

    /**
     * Get paginated tickets for a specific user with filters.
     */
    public function getUserTickets(User $user, array $filters = [], int $perPage = 10): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Ticket::query()
            ->where('user_id', $user->id)
            ->with(['category', 'reporter', 'assignee'])
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['priority'] ?? null, fn ($q, $priority) => $q->where('priority', $priority))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $search = addcslashes($search, '%_');
                $q->where(function ($sub) use ($search) {
                    $sub->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->latest();

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get all tickets with filters (for admin).
     */
    public function getAllTickets(array $filters = [], int $perPage = 15): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Ticket::query()
            ->with(['category', 'reporter', 'assignee'])
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['priority'] ?? null, fn ($q, $priority) => $q->where('priority', $priority))
            ->when($filters['category_id'] ?? null, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $search = addcslashes($search, '%_');
                $q->where(function ($sub) use ($search) {
                    $sub->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->latest();

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get ticket with formatted comments and activity logs.
     */
    public function getTicketWithDetails(Ticket $ticket, bool $includeInternal = false): array
    {
        $ticket->load(['category', 'reporter', 'assignee', 'comments.user']);

        $comments = $ticket->comments
            ->when(! $includeInternal, fn ($c) => $c->reject(fn ($comment) => $comment->is_internal))
            ->map(fn ($comment) => [
                'id' => $comment->id,
                'message' => $comment->message,
                'is_internal' => $comment->is_internal,
                'attachments' => $comment->attachments ?? [],
                'created_at' => $comment->created_at?->toDateTimeString(),
                'user' => [
                    'id' => $comment->user?->id,
                    'name' => $comment->user?->name,
                ],
            ])
            ->values();

        $activityLogs = $ticket->activityLogs()
            ->with('user')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'created_at' => $log->created_at?->toDateTimeString(),
                'user' => $log->user ? ['name' => $log->user->name] : null,
            ]);

        return [
            'ticket' => $ticket,
            'comments' => $comments,
            'activityLogs' => $activityLogs,
        ];
    }

    protected function notifyRelatedUsers(Ticket $ticket, string $action, ?Comment $comment = null): void
    {
        $ticket->loadMissing(['reporter', 'assignee']);

        $users = collect([$ticket->reporter, $ticket->assignee])
            ->filter()
            ->unique('id');

        if ($action === 'created') {
            $staffs = User::role('staff')->get();
            $users = $users->merge($staffs)->unique('id');
        }

        $users = $users->values();

        if ($users->isNotEmpty()) {
            Notification::send($users, new TicketActivityNotification($ticket, $comment, $action));
        }
    }
}
