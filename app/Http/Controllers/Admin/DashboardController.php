<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $charts = $this->dashboardService->getAdminCharts();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $this->dashboardService->getAdminStats(),
            'priorityChart' => $charts['priorityChart'],
            'statusChart' => $charts['statusChart'],
            'recentTickets' => $this->dashboardService->getRecentTickets(10),
            'staffWorkload' => $this->dashboardService->getStaffWorkload(),
        ]);
    }
}
