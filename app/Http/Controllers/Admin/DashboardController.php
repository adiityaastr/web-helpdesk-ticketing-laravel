<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = Cache::remember('admin_dashboard_stats', 300, function () {
            $row = Ticket::query()
                ->selectRaw("
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'open') as open,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                    COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
                    COUNT(*) FILTER (WHERE status = 'closed') as closed,
                    COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed') AND sla_deadline IS NOT NULL AND sla_deadline < NOW()) as overdue
                ")
                ->first();

            return [
                'total' => (int) $row->total,
                'open' => (int) $row->open,
                'in_progress' => (int) $row->in_progress,
                'resolved' => (int) $row->resolved,
                'closed' => (int) $row->closed,
                'overdue' => (int) $row->overdue,
            ];
        });

        $charts = Cache::remember('admin_dashboard_charts', 300, function () {
            $priorityChart = Ticket::query()
                ->selectRaw('priority, COUNT(*) as total')
                ->groupBy('priority')
                ->pluck('total', 'priority');

            $statusChart = Ticket::query()
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            return [
                'priorityChart' => [
                    'labels' => $priorityChart->keys()->values(),
                    'values' => $priorityChart->values(),
                ],
                'statusChart' => [
                    'labels' => $statusChart->keys()->values(),
                    'values' => $statusChart->values(),
                ],
            ];
        });

        $recentTickets = Ticket::query()
            ->with(['category', 'reporter', 'assignee'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'uuid' => $t->uuid,
                'title' => $t->title,
                'status' => $t->status,
                'priority' => $t->priority,
                'category' => $t->category?->name,
                'reporter' => $t->reporter?->name,
                'assignee' => $t->assignee?->name,
                'created_at' => $t->created_at?->toDateTimeString(),
            ]);

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
            'priorityChart' => $charts['priorityChart'],
            'statusChart' => $charts['statusChart'],
            'recentTickets' => $recentTickets,
            'staffWorkload' => $staffWorkload,
        ]);
    }
}