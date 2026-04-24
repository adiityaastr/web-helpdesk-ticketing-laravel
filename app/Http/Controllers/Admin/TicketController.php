<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketActivityNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $ticketQuery = Ticket::query()
            ->with(['category', 'reporter', 'assignee'])
            ->when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->string('priority')->isNotEmpty(), fn ($query) => $query->where('priority', $request->string('priority')))
            ->when($request->string('category_id')->isNotEmpty(), fn ($query) => $query->where('category_id', $request->string('category_id')))
            ->when($request->string('assigned_to')->isNotEmpty(), fn ($query) => $query->where('assigned_to', $request->string('assigned_to')))
            ->when($request->string('search')->isNotEmpty(), fn ($query) => $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->string('search')}%")
                  ->orWhere('description', 'like', "%{$request->string('search')}%");
            }));

        $tickets = $ticketQuery
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Tickets/Index', [
            'tickets' => TicketResource::collection($tickets),
            'filters' => $request->only(['status', 'priority', 'category_id', 'assigned_to', 'search']),
            'statuses' => ['open', 'in_progress', 'resolved', 'closed'],
            'priorities' => ['low', 'medium', 'high', 'critical'],
            'categories' => Category::query()->select('id', 'name')->orderBy('name')->get(),
            'staffUsers' => User::role(['staff', 'admin'])->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function show(Ticket $ticket): Response
    {
        $ticket->load(['category', 'reporter', 'assignee', 'comments.user']);

        $comments = $ticket->comments->map(fn ($comment) => [
            'id' => $comment->id,
            'message' => $comment->message,
            'is_internal' => $comment->is_internal,
            'attachments' => $comment->attachments ?? [],
            'created_at' => $comment->created_at?->toDateTimeString(),
            'user' => [
                'id' => $comment->user?->id,
                'name' => $comment->user?->name,
            ],
        ])->values();

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

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => new TicketResource($ticket),
            'comments' => $comments,
            'activityLogs' => $activityLogs,
            'categories' => Category::query()->select('id', 'name')->orderBy('name')->get(),
            'staffUsers' => User::role(['staff', 'admin'])->select('id', 'name')->orderBy('name')->get(),
            'statuses' => ['open', 'in_progress', 'resolved', 'closed'],
            'priorities' => ['low', 'medium', 'high', 'critical'],
            'templates' => \App\Models\TicketTemplate::query()->select('id', 'title', 'content')->orderBy('title')->get(),
        ]);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $oldStatus = $ticket->status;
        $oldAssignee = $ticket->assigned_to;

        $payload = $request->validated();

        if ($payload['status'] === 'resolved' && $oldStatus !== 'resolved') {
            $payload['resolved_at'] = now();
        }

        $ticket->update($payload);

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
                'user_id' => auth()->id(),
                'action' => 'updated',
                'description' => implode('. ', $changes),
            ]);
        }

        $this->notifyRelatedUsers($ticket, 'updated');

        return redirect()->route('admin.tickets.show', $ticket)->with('success', 'Tiket berhasil diperbarui.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        foreach ($ticket->comments as $comment) {
            foreach ($comment->attachments ?? [] as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $ticket->delete();

        return redirect()->route('admin.tickets.index')->with('success', 'Tiket berhasil dihapus.');
    }

    public function comment(StoreCommentRequest $request, Ticket $ticket): RedirectResponse
    {
        $attachmentPaths = [];

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attachment) {
                $attachmentPaths[] = $attachment->store('tickets/comments', 'public');
            }
        }

        $isInternal = $request->boolean('is_internal', false);

        $comment = $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'message' => $request->string('message')->toString(),
            'is_internal' => $isInternal,
            'attachments' => $attachmentPaths,
        ]);

        $ticket->activityLogs()->create([
            'user_id' => auth()->id(),
            'action' => 'commented',
            'description' => $isInternal ? 'Catatan internal ditambahkan' : 'Komentar ditambahkan',
        ]);

        if (! $isInternal) {
            $this->notifyRelatedUsers($ticket, 'commented', $comment);
        }

        return redirect()->route('admin.tickets.show', $ticket)->with('success', 'Komentar berhasil ditambahkan.');
    }

    private function notifyRelatedUsers(Ticket $ticket, string $action, ?Comment $comment = null): void
    {
        $ticket->loadMissing(['reporter', 'assignee']);

        $users = collect([$ticket->reporter, $ticket->assignee])
            ->filter()
            ->unique('id')
            ->values();

        if ($users->isNotEmpty()) {
            Notification::send($users, new TicketActivityNotification($ticket, $comment, $action));
        }
    }
}