<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Services\CommentService;
use App\Services\NotificationService;
use App\Services\SawService;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function __construct(
        private TicketService $ticketService,
        private CommentService $commentService,
        private NotificationService $notificationService
    ) {}

    public function index(Request $request): Response
    {
        $tickets = $this->ticketService->getAllTickets(
            $request->only(['status', 'priority', 'category_id', 'search']),
            15
        );

        $sawScores = (new SawService())->getScores();

        $ticketData = TicketResource::collection($tickets)->resolve();
        foreach ($ticketData as &$t) {
            $t['saw_score'] = $sawScores[$t['id']] ?? null;
        }

        return Inertia::render('Admin/Tickets/Index', [
            'tickets' => ['data' => $ticketData],
            'filters' => $request->only(['status', 'priority', 'category_id', 'search']),
            'statuses' => ['in_progress', 'resolved', 'closed', 'cancelled'],
            'priorities' => ['low', 'medium', 'high', 'critical'],
            'categories' => Cache::rememberForever('reference_categories', fn () => Category::query()->select('id', 'name')->orderBy('name')->get()),
        ]);
    }

    public function show(Ticket $ticket): Response
    {
        $detail = $this->ticketService->getTicketWithDetails($ticket, true);

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => new TicketResource($detail['ticket']),
            'comments' => $detail['comments'],
            'activityLogs' => $detail['activityLogs'],
            'categories' => Cache::rememberForever('reference_categories', fn () => Category::query()->select('id', 'name')->orderBy('name')->get()),
            'staffUsers' => User::role('staff')->select('id', 'name')->orderBy('name')->get(),
            'statuses' => ['in_progress', 'resolved', 'closed', 'cancelled'],
            'priorities' => ['low', 'medium', 'high', 'critical'],
        ]);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('update', $ticket);
        $this->ticketService->updateTicket($ticket, $request->validated(), $request->user());
        $this->notificationService->notifyTicketUpdate($ticket, 'updated', null, false);
        return redirect()->route('admin.tickets.show', $ticket)->with('success', 'Tiket berhasil diperbarui.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        $this->ticketService->deleteTicket($ticket);
        return redirect()->route('admin.tickets.index')->with('success', 'Tiket berhasil dihapus.');
    }

    public function comment(StoreCommentRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('comment', $ticket);
        if ($this->commentService->isCommentLocked($ticket)) {
            return redirect()->route('admin.tickets.show', $ticket)->withErrors(['error' => 'Kolom komentar ditutup — tiket sudah selesai.']);
        }

        $isInternal = $request->boolean('is_internal', false);
        $comment = $this->commentService->addCommentWithAttachments(
            $ticket,
            $request->user(),
            $request->string('message')->toString(),
            $isInternal,
            $request->file('attachments', [])
        );

        $ticket->activityLogs()->create([
            'user_id' => auth()->id(),
            'action' => 'commented',
            'description' => $isInternal ? 'Catatan internal ditambahkan' : 'Komentar ditambahkan',
        ]);

        if (! $isInternal) {
            $this->notificationService->notifyTicketUpdate($ticket, 'commented', $comment, false);
        }

        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_charts');

        return redirect()->route('admin.tickets.show', $ticket)->with('success', 'Komentar berhasil ditambahkan.');
    }
}
