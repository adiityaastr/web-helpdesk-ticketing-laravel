<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\TestCase;

class TicketControllerTest extends TestCase
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

    public function test_admin_ticket_list(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Test Ticket 1',
            'description' => 'Description 1',
            'priority' => 'high',
            'status' => 'open',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Test Ticket 2',
            'description' => 'Description 2',
            'priority' => 'medium',
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.tickets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Tickets/Index')
            ->has('tickets')
            ->has('filters')
            ->has('statuses')
            ->has('priorities')
            ->has('categories')
        );
    }

    public function test_admin_ticket_list_with_filters(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'High Priority Ticket',
            'description' => 'Description',
            'priority' => 'high',
            'status' => 'open',
        ]);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Low Priority Ticket',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.tickets.index', ['priority' => 'high']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Tickets/Index')
            ->where('filters.priority', 'high')
        );
    }

    public function test_admin_ticket_list_with_search(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Unique Search Term',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.tickets.index', ['search' => 'Unique Search Term']));

        $response->assertOk();
    }

    public function test_customer_cannot_access_admin_ticket_list(): void
    {
        $response = $this->actingAs($this->customer)
            ->get(route('admin.tickets.index'));

        $response->assertForbidden();
    }

    public function test_admin_ticket_detail(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket Detail Test',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $ticket->comments()->create([
            'user_id' => $this->customer->id,
            'message' => 'Customer comment',
            'is_internal' => false,
        ]);

        $ticket->activityLogs()->create([
            'user_id' => $this->customer->id,
            'action' => 'created',
            'description' => 'Ticket created',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.tickets.show', $ticket));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Tickets/Show')
            ->has('ticket')
            ->has('comments')
            ->has('activityLogs')
            ->has('categories')
            ->has('staffUsers')
            ->has('statuses')
            ->has('priorities')
        );
    }

    public function test_admin_update_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to Update',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->put(route('admin.tickets.update', $ticket), [
                'priority' => 'high',
                'status' => 'in_progress',
                'assigned_to' => $this->staff->id,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Tiket berhasil diperbarui.');

        $ticket->refresh();
        $this->assertEquals('high', $ticket->priority);
        $this->assertEquals('in_progress', $ticket->status);
        $this->assertEquals($this->staff->id, $ticket->assigned_to);
    }

    public function test_admin_resolve_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to Resolve',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($this->staff)
            ->put(route('admin.tickets.update', $ticket), [
                'priority' => 'medium',
                'status' => 'resolved',
            ]);

        $response->assertRedirect();

        $ticket->refresh();
        $this->assertEquals('resolved', $ticket->status);
        $this->assertNotNull($ticket->resolved_at);
    }

    public function test_admin_cancel_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to Cancel',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->put(route('admin.tickets.update', $ticket), [
                'priority' => 'medium',
                'status' => 'cancelled',
            ]);

        $response->assertRedirect();

        $ticket->refresh();
        $this->assertEquals('cancelled', $ticket->status);
        $this->assertNotNull($ticket->cancelled_at);
    }

    public function test_admin_update_ticket_validation(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to Update',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->put(route('admin.tickets.update', $ticket), [
                'priority' => 'invalid_priority',
                'status' => 'invalid_status',
            ]);

        $response->assertSessionHasErrors(['priority', 'status']);
    }

    public function test_admin_comment(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket for Comment',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->post(route('admin.tickets.comment', $ticket), [
                'message' => 'Admin comment here',
                'is_internal' => false,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Komentar berhasil ditambahkan.');

        $this->assertDatabaseHas('comments', [
            'ticket_id' => $ticket->id,
            'user_id' => $this->staff->id,
            'message' => 'Admin comment here',
            'is_internal' => false,
        ]);
    }

    public function test_admin_internal_comment(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket for Internal Comment',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->post(route('admin.tickets.comment', $ticket), [
                'message' => 'Internal note',
                'is_internal' => true,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('comments', [
            'ticket_id' => $ticket->id,
            'user_id' => $this->staff->id,
            'message' => 'Internal note',
            'is_internal' => true,
        ]);
    }

    public function test_cannot_comment_on_closed_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Closed Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'closed',
        ]);

        $response = $this->actingAs($this->staff)
            ->post(route('admin.tickets.comment', $ticket), [
                'message' => 'Trying to comment',
                'is_internal' => false,
            ]);

        $response->assertSessionHasErrors('error');
    }

    public function test_admin_delete_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to Delete',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->delete(route('admin.tickets.destroy', $ticket));

        $response->assertRedirect(route('admin.tickets.index'));
        $response->assertSessionHas('success', 'Tiket berhasil dihapus.');

        $this->assertDatabaseMissing('tickets', [
            'id' => $ticket->id,
        ]);
    }

    public function test_admin_delete_ticket_with_comments(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket with Comments',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $ticket->comments()->create([
            'user_id' => $this->customer->id,
            'message' => 'Comment to delete',
            'is_internal' => false,
        ]);

        $response = $this->actingAs($this->staff)
            ->delete(route('admin.tickets.destroy', $ticket));

        $response->assertRedirect();

        $this->assertDatabaseMissing('tickets', [
            'id' => $ticket->id,
        ]);
        $this->assertDatabaseMissing('comments', [
            'ticket_id' => $ticket->id,
        ]);
    }

    public function test_customer_cannot_delete_ticket_via_admin_route(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'My Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->delete(route('admin.tickets.destroy', $ticket));

        $response->assertForbidden();
    }

    public function test_admin_sees_internal_comments(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket with Internal Comments',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $ticket->comments()->create([
            'user_id' => $this->staff->id,
            'message' => 'Public comment',
            'is_internal' => false,
        ]);

        $ticket->comments()->create([
            'user_id' => $this->staff->id,
            'message' => 'Internal note',
            'is_internal' => true,
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.tickets.show', $ticket));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Tickets/Show')
            ->has('comments', 2)
        );
    }

    public function test_admin_ticket_list_includes_saw_scores(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket with SAW',
            'description' => 'Description',
            'priority' => 'critical',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('admin.tickets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Tickets/Index')
            ->has('tickets.data')
        );
    }
}
