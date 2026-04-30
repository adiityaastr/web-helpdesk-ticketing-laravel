<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $stats = Cache::remember("portal_dashboard_stats_{$user->id}", 300, function () use ($user) {
            return [
                'total' => Ticket::query()->where('user_id', $user->id)->count(),
                'open' => Ticket::query()->where('user_id', $user->id)->where('status', 'open')->count(),
                'in_progress' => Ticket::query()->where('user_id', $user->id)->where('status', 'in_progress')->count(),
                'resolved' => Ticket::query()->where('user_id', $user->id)->where('status', 'resolved')->count(),
            ];
        });

        $tickets = Ticket::query()
            ->where('user_id', $user->id)
            ->with(['category', 'assignee'])
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Portal/Dashboard', [
            'recentTickets' => $tickets,
            'stats' => $stats,
        ]);
    }
}