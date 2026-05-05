<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    public function getAdminStats(): array
    {
        return Cache::remember('admin_dashboard_stats', 300, function () {
            $row = Ticket::query()
                ->selectRaw("
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
                    COUNT(CASE WHEN status NOT IN ('resolved', 'closed', 'cancelled') AND sla_deadline IS NOT NULL AND sla_deadline < NOW() THEN 1 END) as overdue
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
    }

    public function getAdminCharts(): array
    {
        return Cache::remember('admin_dashboard_charts', 300, function () {
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
                    'labels' => $priorityChart->keys()->values()->all(),
                    'values' => $priorityChart->values()->all(),
                ],
                'statusChart' => [
                    'labels' => $statusChart->keys()->values()->all(),
                    'values' => $statusChart->values()->all(),
                ],
            ];
        });
    }

    public function getRecentTickets(int $limit = 10, ?User $user = null): Collection
    {
        return Ticket::query()
            ->when($user, fn ($q) => $q->where('user_id', $user->id))
            ->with(['category', 'reporter', 'assignee'])
            ->latest()
            ->limit($limit)
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
    }

    public function getStaffWorkload(): Collection
    {
        return User::query()
            ->role('staff')
            ->withCount(['assignedTickets'])
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'assigned_count' => $user->assigned_tickets_count,
            ]);
    }

    public function getPortalStats(User $user): array
    {
        return Cache::remember("portal_dashboard_stats_{$user->id}", 300, function () use ($user) {
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
    }

    public function invalidateDashboardCache(?int $userId = null): void
    {
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_charts');

        if ($userId !== null) {
            Cache::forget("portal_dashboard_stats_{$userId}");
        }
    }
}