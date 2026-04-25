<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
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
        $user = $request->user();

        $ticketQuery = Ticket::query()
            ->where('user_id', $user->id)
            ->with(['category', 'reporter', 'assignee'])
            ->when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->string('priority')->isNotEmpty(), fn ($query) => $query->where('priority', $request->string('priority')))
            ->when($request->string('search')->isNotEmpty(), fn ($query) => $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->string('search')}%")
                    ->orWhere('description', 'like', "%{$request->string('search')}%");
            }));

        $tickets = $ticketQuery
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Portal/Tickets/Index', [
            'tickets' => TicketResource::collection($tickets),
            'filters' => $request->only(['status', 'priority', 'search']),
            'statuses' => ['open', 'in_progress', 'resolved', 'closed', 'cancelled'],
            'priorities' => ['low', 'medium', 'high', 'critical'],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Portal/Tickets/Create', [
            'categories' => Category::query()->select('id', 'name', 'slug')->orderBy('name')->get(),
            'priorities' => ['low', 'medium', 'high', 'critical'],
        ]);
    }

    public function store(StoreTicketRequest $request): RedirectResponse
    {
        $attachmentPaths = [];

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attachment) {
                $attachmentPaths[] = $attachment->store('tickets/attachments', 'public');
            }
        }

        $slaDeadline = null;
        $prioritySla = [
            'critical' => 2,
            'high' => 8,
            'medium' => 24,
            'low' => 48,
        ];

        $priority = $request->input('priority');
        if (isset($prioritySla[$priority])) {
            $slaDeadline = now()->addHours($prioritySla[$priority]);
        }

        $ticket = Ticket::query()->create([
            'user_id' => $request->user()->id,
            'category_id' => $request->integer('category_id'),
            'title' => $request->string('title'),
            'description' => $request->string('description'),
            'priority' => $priority,
            'status' => 'open',
            'sla_deadline' => $slaDeadline,
        ]);

        $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'message' => 'Tiket berhasil dibuat.',
            'is_internal' => false,
            'attachments' => $attachmentPaths,
        ]);

        $ticket->activityLogs()->create([
            'user_id' => $request->user()->id,
            'action' => 'created',
            'description' => 'Tiket dibuat oleh pelapor.',
        ]);

        $this->notifyRelatedUsers($ticket, 'created');

        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Tiket berhasil dibuat.');
    }

    public function show(Ticket $ticket): Response
    {
        $this->authorize('view', $ticket);

        $ticket->load(['category', 'reporter', 'assignee', 'comments.user']);

        $comments = $ticket->comments
            ->filter(fn ($c) => ! $c->is_internal || auth()->user()->isStaffOrAdmin())
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

        return Inertia::render('Portal/Tickets/Show', [
            'ticket' => new TicketResource($ticket),
            'comments' => $comments,
        ]);
    }

    public function rate(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);

        if ($ticket->user_id !== $request->user()->id) {
            return redirect()->route('portal.tickets.show', $ticket)->withErrors(['error' => 'Hanya pelapor yang dapat memberi rating.']);
        }

        if ($ticket->status !== 'resolved') {
            return redirect()->route('portal.tickets.show', $ticket)->withErrors(['error' => 'Tiket harus berstatus selesai untuk memberi rating.']);
        }

        if ($ticket->rating !== null) {
            return redirect()->route('portal.tickets.show', $ticket)->withErrors(['error' => 'Rating sudah diberikan.']);
        }

        $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'rating_comment' => ['nullable', 'string'],
        ]);

        $ticket->update([
            'rating' => $request->integer('rating'),
            'rating_comment' => $request->string('rating_comment') ?: null,
        ]);

        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Rating berhasil dikirim.');
    }

    public function cancel(Ticket $ticket): RedirectResponse
    {
        $this->authorize('cancel', $ticket);

        $ticket->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $ticket->activityLogs()->create([
            'user_id' => auth()->id(),
            'action' => 'cancelled',
            'description' => 'Tiket dibatalkan oleh pelapor.',
        ]);

        $this->notifyRelatedUsers($ticket, 'cancelled');

        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Tiket berhasil dibatalkan.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        $this->authorize('delete', $ticket);

        foreach ($ticket->comments as $comment) {
            foreach ($comment->attachments ?? [] as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        $ticket->delete();

        return redirect()->route('portal.tickets.index')->with('success', 'Tiket berhasil dihapus.');
    }

    public function comment(StoreCommentRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('comment', $ticket);

        $attachmentPaths = [];

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attachment) {
                $attachmentPaths[] = $attachment->store('tickets/comments', 'public');
            }
        }

        $comment = $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'message' => $request->string('message')->toString(),
            'is_internal' => $request->boolean('is_internal', false),
            'attachments' => $attachmentPaths,
        ]);

        $this->notifyRelatedUsers($ticket, 'commented', $comment);

        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Komentar berhasil ditambahkan.');
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
