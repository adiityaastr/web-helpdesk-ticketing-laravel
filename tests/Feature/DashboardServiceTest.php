<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! Category::count()) {
            DB::table('categories')->truncate();
            DB::table('categories')->insert([
                ['name' => 'Hardware', 'slug' => 'hardware'],
                ['name' => 'Software', 'slug' => 'software'],
                ['name' => 'Jaringan', 'slug' => 'jaringan'],
            ]);
        }
    }

    public function test_admin_dashboard_stats()
    {
        $admin = User::factory()->create();
        $admin->assignRole('staff');

        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $category = Category::first();

        Ticket::factory()->count(3)->create(['user_id' => $customer->id, 'category_id' => $category->id, 'status' => 'open']);
        Ticket::factory()->count(2)->create(['user_id' => $customer->id, 'category_id' => $category->id, 'status' => 'in_progress']);
        Ticket::factory()->count(1)->create(['user_id' => $customer->id, 'category_id' => $category->id, 'status' => 'resolved']);

        $service = new DashboardService();
        $stats = $service->getAdminStats();

        $this->assertArrayHasKey('total', $stats);
        $this->assertArrayHasKey('open', $stats);
        $this->assertArrayHasKey('in_progress', $stats);
        $this->assertArrayHasKey('resolved', $stats);
        $this->assertArrayHasKey('closed', $stats);
        $this->assertArrayHasKey('overdue', $stats);
        $this->assertEquals(6, $stats['total']);
        $this->assertEquals(3, $stats['open']);
        $this->assertEquals(2, $stats['in_progress']);
        $this->assertEquals(1, $stats['resolved']);
        $this->assertEquals(0, $stats['closed']);
        $this->assertEquals(0, $stats['overdue']);
    }

    public function test_admin_dashboard_charts()
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $category = Category::first();

        Ticket::factory()->count(2)->create(['user_id' => $customer->id, 'category_id' => $category->id, 'priority' => 'high', 'status' => 'open']);
        Ticket::factory()->count(3)->create(['user_id' => $customer->id, 'category_id' => $category->id, 'priority' => 'medium', 'status' => 'in_progress']);

        $service = new DashboardService();
        $charts = $service->getAdminCharts();

        $this->assertArrayHasKey('priorityChart', $charts);
        $this->assertArrayHasKey('statusChart', $charts);

        $this->assertArrayHasKey('labels', $charts['priorityChart']);
        $this->assertArrayHasKey('values', $charts['priorityChart']);
        $this->assertContains('high', $charts['priorityChart']['labels']);
        $this->assertContains('medium', $charts['priorityChart']['labels']);

        $this->assertArrayHasKey('labels', $charts['statusChart']);
        $this->assertArrayHasKey('values', $charts['statusChart']);
    }

    public function test_portal_dashboard_stats()
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $otherUser = User::factory()->create();
        $otherUser->assignRole('customer');

        $category = Category::first();

        Ticket::factory()->count(2)->create(['user_id' => $customer->id, 'category_id' => $category->id, 'status' => 'open']);
        Ticket::factory()->count(1)->create(['user_id' => $customer->id, 'category_id' => $category->id, 'status' => 'resolved']);
        Ticket::factory()->count(3)->create(['user_id' => $otherUser->id, 'category_id' => $category->id, 'status' => 'open']);

        $service = new DashboardService();
        $stats = $service->getPortalStats($customer);

        $this->assertArrayHasKey('total', $stats);
        $this->assertArrayHasKey('open', $stats);
        $this->assertArrayHasKey('in_progress', $stats);
        $this->assertArrayHasKey('resolved', $stats);
        $this->assertEquals(3, $stats['total']);
        $this->assertEquals(2, $stats['open']);
        $this->assertEquals(0, $stats['in_progress']);
        $this->assertEquals(1, $stats['resolved']);
    }

    public function test_dashboard_cache_invalidation()
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $category = Category::first();

        Ticket::factory()->create(['user_id' => $customer->id, 'category_id' => $category->id, 'status' => 'open']);

        $service = new DashboardService();

        $service->getAdminStats();
        $this->assertTrue(Cache::has('admin_dashboard_stats'));

        $service->invalidateDashboardCache();
        $this->assertFalse(Cache::has('admin_dashboard_stats'));
        $this->assertFalse(Cache::has('admin_dashboard_charts'));

        $service->getPortalStats($customer);
        $this->assertTrue(Cache::has("portal_dashboard_stats_{$customer->id}"));

        $service->invalidateDashboardCache($customer->id);
        $this->assertFalse(Cache::has("portal_dashboard_stats_{$customer->id}"));
    }
}