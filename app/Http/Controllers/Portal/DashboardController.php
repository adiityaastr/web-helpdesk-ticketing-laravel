<?php

namespace App\Http\Controllers\Portal;

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
        $user = auth()->user();

        return Inertia::render('Portal/Dashboard', [
            'recentTickets' => $this->dashboardService->getRecentTickets(5, $user),
            'stats' => $this->dashboardService->getPortalStats($user),
        ]);
    }
}
