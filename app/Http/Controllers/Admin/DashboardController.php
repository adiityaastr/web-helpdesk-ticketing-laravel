<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBase;
use App\Models\Ticket;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total' => Ticket::query()->count(),
            'open' => Ticket::query()->where('status', 'open')->count(),
            'in_progress' => Ticket::query()->where('status', 'in_progress')->count(),
            'resolved' => Ticket::query()->where('status', 'resolved')->count(),
            'closed' => Ticket::query()->where('status', 'closed')->count(),
            'overdue' => Ticket::query()
                ->whereNotIn('status', ['resolved', 'closed'])
                ->whereNotNull('sla_deadline')
                ->where('sla_deadline', '<', now())
                ->count(),
        ];

        $priorityChart = Ticket::query()
            ->selectRaw('priority, COUNT(*) as total')
            ->groupBy('priority')
            ->pluck('total', 'priority');

        $statusChart = Ticket::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentTickets = Ticket::query()
            ->with(['category', 'reporter', 'assignee'])
            ->latest()
            ->limit(10)
            ->get();

        $staffWorkload = User::query()
            ->role(['staff', 'admin'])
            ->withCount(['assignedTickets'])
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'assigned_count' => $user->assigned_tickets_count,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'priorityChart' => [
                'labels' => $priorityChart->keys()->values(),
                'values' => $priorityChart->values(),
            ],
            'statusChart' => [
                'labels' => $statusChart->keys()->values(),
                'values' => $statusChart->values(),
            ],
            'recentTickets' => $recentTickets->map(fn ($t) => [
                'id' => $t->id,
                'uuid' => $t->uuid,
                'title' => $t->title,
                'status' => $t->status,
                'priority' => $t->priority,
                'category' => $t->category?->name,
                'reporter' => $t->reporter?->name,
                'assignee' => $t->assignee?->name,
                'created_at' => $t->created_at?->toDateTimeString(),
            ]),
            'staffWorkload' => $staffWorkload,
        ]);
    }
}