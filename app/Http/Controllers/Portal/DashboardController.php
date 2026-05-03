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
            $row = Ticket::query()
                ->where('user_id', $user->id)
                ->selectRaw("
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
                ")
                ->first();
            return [
                'total' => (int) $row->total,
                'open' => (int) $row->open,
                'in_progress' => (int) $row->in_progress,
                'resolved' => (int) $row->resolved,
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