<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TicketResource;
use App\Models\Category;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $tickets = Ticket::query()
            ->where('user_id', $user->id)
            ->with(['category', 'assignee'])
            ->when($request->string('status')->isNotEmpty(), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->string('priority')->isNotEmpty(), fn ($q) => $q->where('priority', $request->string('priority')))
            ->when($request->string('search')->isNotEmpty(), fn ($q) => $q->where(function ($q) use ($request) {
                $search = addcslashes($request->string('search')->toString(), '%_');
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(10);

        return response()->json([
            'data' => TicketResource::collection($tickets),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attachment) {
                $attachmentPaths[] = $attachment->store('tickets/attachments', 'public');
            }
        }

        $ticket = Ticket::query()->create([
            'user_id' => $request->user()->id,
            'category_id' => $request->integer('category_id'),
            'title' => $request->string('title'),
            'description' => $request->string('description'),
            'priority' => $request->input('priority'),
            'status' => 'open',
        ]);

        $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'message' => 'Tiket berhasil dibuat.',
            'is_internal' => false,
            'attachments' => $attachmentPaths,
        ]);

        $ticket->load(['category', 'reporter', 'assignee']);

        return response()->json([
            'message' => 'Tiket berhasil dibuat.',
            'data' => new TicketResource($ticket),
        ], 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        if ($ticket->user_id !== auth()->id() && ! auth()->user()->isStaff()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $ticket->load(['category', 'reporter', 'assignee', 'comments.user']);

        return response()->json([
            'data' => new TicketResource($ticket),
        ]);
    }

    public function comment(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->user_id !== auth()->id() && ! auth()->user()->isStaff()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (in_array($ticket->status, ['resolved', 'closed'])) {
            return response()->json(['message' => 'Kolom komentar ditutup — tiket sudah selesai.'], 422);
        }

        $request->validate([
            'message' => ['required', 'string'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attachment) {
                $attachmentPaths[] = $attachment->store('tickets/comments', 'public');
            }
        }

        $ticket->comments()->create([
            'user_id' => $request->user()->id,
            'message' => $request->string('message')->toString(),
            'is_internal' => false,
            'attachments' => $attachmentPaths,
        ]);

        $ticket->load(['comments.user']);

        return response()->json([
            'message' => 'Komentar berhasil ditambahkan.',
            'data' => new TicketResource($ticket),
        ]);
    }
}
