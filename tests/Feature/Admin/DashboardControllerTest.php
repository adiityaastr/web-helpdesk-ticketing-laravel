<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\TestCase;

class DashboardControllerTest extends TestCase
{
    protected User $staff;
    protected User $customer;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $this->staff = User::factory()->create();
        $this->staff->syncRoles(['staff']);

        $this->customer = User::factory()->create();
        $this->customer->syncRoles(['customer']);

        $this->category = Category::first();
    }

    public function test_dashboard_shows_stats(): void
    {
        // Create tickets with different statuses
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Open Ticket',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'In Progress Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'in_progress',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Resolved Ticket',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Closed Ticket',
            'description' => 'Description',
            'priority' => 'critical',
            'status' => 'closed',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('stats')
            ->has('priorityChart')
            ->has('statusChart')
            ->has('recentTickets')
            ->has('staffWorkload')
        );
    }

    public function test_dashboard_stats_accuracy(): void
    {
        // Create multiple tickets
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket 1',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket 2',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        
        // Verify stats structure
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.total', 2)
            ->where('stats.open', 1)
            ->where('stats.in_progress', 1)
            ->has('stats.resolved')
            ->has('stats.closed')
            ->has('stats.overdue')
        );
    }

    public function test_dashboard_shows_priority_chart(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'High Priority',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Low Priority',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('priorityChart.labels')
            ->has('priorityChart.values')
        );
    }

    public function test_dashboard_shows_status_chart(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Open Status',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Resolved Status',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('statusChart.labels')
            ->has('statusChart.values')
        );
    }

    public function test_dashboard_shows_recent_tickets(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            Ticket::create([
                'user_id' => $this->customer->id,
                'category_id' => $this->category->id,
                'title' => "Recent Ticket {$i}",
                'description' => 'Description',
                'priority' => 'medium',
                'status' => 'open',
            ]);
        }

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('recentTickets')
        );
    }

    public function test_dashboard_shows_staff_workload(): void
    {
        // Create another staff member
        $staff2 = User::factory()->create();
        $staff2->syncRoles(['staff']);

        // Assign tickets to staff
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Assigned to Staff 1',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'in_progress',
            'assigned_to' => $this->staff->id,
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Assigned to Staff 2',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'in_progress',
            'assigned_to' => $staff2->id,
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('staffWorkload')
        );
    }

    public function test_customer_cannot_access_admin_dashboard(): void
    {
        $response = $this->actingAs($this->customer)
            ->get(route('admin.dashboard'));

        $response->assertForbidden();
    }

    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $response = $this->get(route('admin.dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_dashboard_with_overdue_tickets(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Overdue Ticket',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
            'sla_deadline' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.overdue', 1)
        );
    }

    public function test_resolved_and_closed_not_counted_as_overdue(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Resolved Overdue',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'resolved',
            'sla_deadline' => now()->subDay(),
            'resolved_at' => now(),
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Closed Overdue',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'closed',
            'sla_deadline' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.overdue', 0)
        );
    }
}
