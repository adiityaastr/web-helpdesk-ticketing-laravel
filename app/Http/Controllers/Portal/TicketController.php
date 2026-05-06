<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Category;
use App\Models\Ticket;
use App\Services\CommentService;
use App\Services\NotificationService;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
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
        $tickets = $this->ticketService->getUserTickets(
            $request->user(),
            $request->only(['status', 'priority', 'search']),
            10
        );

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
            'categories' => Cache::rememberForever('reference_categories', fn () => Category::query()->select('id', 'name', 'slug')->orderBy('name')->get()->toArray()),
            'priorities' => ['low', 'medium', 'high', 'critical'],
        ]);
    }

    public function store(StoreTicketRequest $request): RedirectResponse
    {
        $ticket = $this->ticketService->createTicket($request, $request->user());
        $this->notificationService->notifyTicketUpdate($ticket, 'created', null, true);
        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Tiket berhasil dibuat.');
    }

    public function show(Ticket $ticket): Response
    {
        $this->authorize('view', $ticket);
        $detail = $this->ticketService->getTicketWithDetails($ticket, false);

        return Inertia::render('Portal/Tickets/Show', [
            'ticket' => new TicketResource($detail['ticket']),
            'comments' => $detail['comments'],
        ]);
    }

    public function rate(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'rating_comment' => ['nullable', 'string'],
        ]);

        try {
            $this->ticketService->rateTicket($ticket, $request->user(), $validated['rating'], $validated['rating_comment'] ?? null);
        } catch (\Exception $e) {
            throw ValidationException::withMessages(['error' => $e->getMessage()]);
        }

        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Rating berhasil dikirim.');
    }

    public function cancel(Ticket $ticket): RedirectResponse
    {
        $this->authorize('cancel', $ticket);
        $this->ticketService->cancelTicket($ticket, auth()->user());
        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Tiket berhasil dibatalkan.');
    }

    public function confirmResolution(Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);
        try {
            $this->ticketService->confirmResolution($ticket, auth()->user());
        } catch (\Exception $e) {
            throw ValidationException::withMessages(['error' => $e->getMessage()]);
        }
        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Konfirmasi berhasil. Tiket telah ditutup.');
    }

    public function rejectResolution(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);
        $validated = $request->validate(['reason' => ['required', 'string', 'max:500']]);

        try {
            $this->ticketService->rejectResolution($ticket, $validated['reason'], auth()->user());
        } catch (\Exception $e) {
            throw ValidationException::withMessages(['error' => $e->getMessage()]);
        }

        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Tiket dibuka kembali. Admin akan meninjau ulang.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        $this->authorize('delete', $ticket);
        $this->ticketService->deleteTicket($ticket);
        return redirect()->route('portal.tickets.index')->with('success', 'Tiket berhasil dihapus.');
    }

    public function comment(StoreCommentRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('comment', $ticket);
        if ($this->commentService->isCommentLocked($ticket)) {
            return redirect()->route('portal.tickets.show', $ticket)->withErrors(['error' => 'Kolom komentar ditutup — tiket sudah selesai.']);
        }

        $comment = $this->commentService->addCommentWithAttachments(
            $ticket,
            $request->user(),
            $request->string('message')->toString(),
            false,
            $request->file('attachments', [])
        );
        $this->notificationService->notifyTicketUpdate($ticket, 'commented', $comment, false);

        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Komentar berhasil ditambahkan.');
    }
}
