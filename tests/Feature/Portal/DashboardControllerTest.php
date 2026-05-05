<?php

namespace Tests\Feature\Portal;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\TestCase;

class DashboardControllerTest extends TestCase
{
    protected User $customer;
    protected User $staff;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $this->customer = User::factory()->create();
        $this->customer->syncRoles(['customer']);

        $this->staff = User::factory()->create();
        $this->staff->syncRoles(['staff']);

        $this->category = Category::first();
    }

    public function test_portal_dashboard(): void
    {
        // Create some tickets for the customer
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'My Open Ticket',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'My In Progress Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->has('recentTickets')
            ->has('stats')
        );
    }

    public function test_portal_dashboard_shows_only_own_tickets(): void
    {
        $otherCustomer = User::factory()->create();
        $otherCustomer->syncRoles(['customer']);

        // Create ticket for the main customer
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'My Ticket',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
        ]);

        // Create ticket for another customer
        Ticket::create([
            'user_id' => $otherCustomer->id,
            'category_id' => $this->category->id,
            'title' => 'Other Customer Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->where('stats.total', 1)
            ->where('stats.open', 1)
        );
    }

    public function test_portal_dashboard_stats_accuracy(): void
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

        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->where('stats.total', 3)
            ->where('stats.open', 1)
            ->where('stats.in_progress', 1)
            ->where('stats.resolved', 1)
        );
    }

    public function test_portal_dashboard_shows_recent_tickets(): void
    {
        // Create multiple tickets
        for ($i = 1; $i <= 7; $i++) {
            Ticket::create([
                'user_id' => $this->customer->id,
                'category_id' => $this->category->id,
                'title' => "Ticket {$i}",
                'description' => 'Description',
                'priority' => 'medium',
                'status' => 'open',
            ]);
        }

        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->has('recentTickets')
        );
    }

    public function test_staff_cannot_access_portal_dashboard(): void
    {
        $response = $this->actingAs($this->staff)
            ->get(route('portal.dashboard'));

        $response->assertForbidden();
    }

    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $response = $this->get(route('portal.dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_empty_portal_dashboard(): void
    {
        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->where('stats.total', 0)
            ->where('stats.open', 0)
            ->where('stats.in_progress', 0)
            ->where('stats.resolved', 0)
            ->has('recentTickets', 0)
        );
    }

    public function test_portal_dashboard_includes_ticket_details(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Detailed Ticket',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->has('recentTickets', 1)
            ->where('recentTickets.0.id', $ticket->id)
            ->where('recentTickets.0.title', 'Detailed Ticket')
            ->where('recentTickets.0.status', 'open')
            ->where('recentTickets.0.priority', 'high')
            ->where('recentTickets.0.category', $this->category->name)
        );
    }

    public function test_portal_dashboard_with_cancelled_tickets(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Cancelled Ticket',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->where('stats.total', 1)
        );
    }

    public function test_portal_dashboard_closed_tickets_not_in_resolved_count(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Closed Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'closed',
        ]);

        $response = $this->actingAs($this->customer)
            ->get(route('portal.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Dashboard')
            ->where('stats.total', 1)
            ->where('stats.resolved', 0)
        );
    }
}
