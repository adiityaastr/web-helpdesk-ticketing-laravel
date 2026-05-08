<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class CacheManager
{
    public const ADMIN_DASHBOARD_STATS = 'admin_dashboard_stats';
    public const ADMIN_DASHBOARD_CHARTS = 'admin_dashboard_charts';
    public const PORTAL_DASHBOARD_STATS = 'portal_dashboard_stats';
    public const ADMIN_SAW_SCORES = 'admin_saw_scores';
    public const REFERENCE_CATEGORIES = 'reference_categories';
    public const REFERENCE_DEPARTMENTS = 'reference_departments';

    public const TTL_SHORT = 300;
    public const TTL_MEDIUM = 3600;
    public const TTL_LONG = 86400;

    public static function forgetAdminDashboard(): void
    {
        Cache::forget(self::ADMIN_DASHBOARD_STATS);
        Cache::forget(self::ADMIN_DASHBOARD_CHARTS);
    }

    public static function forgetPortalDashboard(int $userId): void
    {
        Cache::forget(self::PORTAL_DASHBOARD_STATS . "_{$userId}");
    }

    public static function forgetReferences(): void
    {
        Cache::forget(self::REFERENCE_CATEGORIES);
        Cache::forget(self::REFERENCE_DEPARTMENTS);
    }

    public static function forgetSawScores(): void
    {
        Cache::forget(self::ADMIN_SAW_SCORES);
    }
}
