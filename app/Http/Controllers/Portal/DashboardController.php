<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $tickets = Ticket::query()
            ->where('user_id', $user->id)
            ->with(['category', 'assignee'])
            ->latest()
            ->limit(5)
            ->get();

        $stats = [
            'total' => Ticket::query()->where('user_id', $user->id)->count(),
            'open' => Ticket::query()->where('user_id', $user->id)->where('status', 'open')->count(),
            'in_progress' => Ticket::query()->where('user_id', $user->id)->where('status', 'in_progress')->count(),
            'resolved' => Ticket::query()->where('user_id', $user->id)->where('status', 'resolved')->count(),
        ];

        return Inertia::render('Portal/Dashboard', [
            'recentTickets' => $tickets,
            'stats' => $stats,
        ]);
    }
}