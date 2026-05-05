<?php

namespace Tests\Feature\Portal;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\TestCase;

class TicketControllerTest extends TestCase
{
    protected User $customer;
    protected User $staff;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles and permissions
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $this->customer = User::factory()->create();
        $this->customer->syncRoles(['customer']);

        $this->staff = User::factory()->create();
        $this->staff->syncRoles(['staff']);

        $this->category = Category::first();
    }

    public function test_create_ticket_flow(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.store'), [
                'category_id' => $this->category->id,
                'title' => 'Test Ticket Title',
                'description' => 'Test ticket description',
                'priority' => 'medium',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Tiket berhasil dibuat.');

        $this->assertDatabaseHas('tickets', [
            'title' => 'Test Ticket Title',
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'priority' => 'medium',
            'status' => 'open',
        ]);
    }

    public function test_create_ticket_with_attachments(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('screenshot.png');

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.store'), [
                'category_id' => $this->category->id,
                'title' => 'Ticket with attachment',
                'description' => 'Description with attachment',
                'priority' => 'high',
                'attachments' => [$file],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $ticket = Ticket::where('title', 'Ticket with attachment')->first();
        $this->assertNotNull($ticket);
    }

    public function test_show_ticket_with_comments(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Test Ticket',
            'description' => 'Test description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $ticket->comments()->create([
            'user_id' => $this->customer->id,
            'message' => 'Initial comment',
            'is_internal' => false,
        ]);

        $response = $this->actingAs($this->customer)
            ->get(route('portal.tickets.show', $ticket));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Tickets/Show')
            ->has('ticket')
            ->has('comments')
        );
    }

    public function test_show_ticket_unauthorized_for_other_customer(): void
    {
        $otherCustomer = User::factory()->create();
        $otherCustomer->syncRoles(['customer']);

        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Private Ticket',
            'description' => 'Private description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($otherCustomer)
            ->get(route('portal.tickets.show', $ticket));

        $response->assertForbidden();
    }

    public function test_staff_can_view_any_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Customer Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->staff)
            ->get(route('portal.tickets.show', $ticket));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Tickets/Show')
        );
    }

    public function test_cancel_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to cancel',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.cancel', $ticket));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Tiket berhasil dibatalkan.');

        $ticket->refresh();
        $this->assertEquals('cancelled', $ticket->status);
        $this->assertNotNull($ticket->cancelled_at);
    }

    public function test_cannot_cancel_already_cancelled_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Already cancelled',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.cancel', $ticket));

        $response->assertForbidden();
    }

    public function test_cannot_cancel_other_users_ticket(): void
    {
        $otherCustomer = User::factory()->create();
        $otherCustomer->syncRoles(['customer']);

        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'My Ticket',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($otherCustomer)
            ->post(route('portal.tickets.cancel', $ticket));

        $response->assertForbidden();
    }

    public function test_confirm_resolution(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Resolved Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolved_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.confirm', $ticket));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Konfirmasi berhasil. Tiket telah ditutup.');

        $ticket->refresh();
        $this->assertEquals('closed', $ticket->status);
        $this->assertNotNull($ticket->resolved_confirmed_at);
    }

    public function test_cannot_confirm_non_resolved_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Open Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.confirm', $ticket));

        $response->assertSessionHasErrors('error');
    }

    public function test_reject_resolution(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Resolved Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolved_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.reject', $ticket), [
                'reason' => 'Problem still exists',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Tiket dibuka kembali. Admin akan meninjau ulang.');

        $ticket->refresh();
        $this->assertEquals('in_progress', $ticket->status);
        $this->assertNull($ticket->resolved_at);
    }

    public function test_reject_requires_reason(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Resolved Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolved_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.reject', $ticket), []);

        $response->assertSessionHasErrors('reason');
    }

    public function test_comment_on_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket with comments',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.comment', $ticket), [
                'message' => 'This is my comment',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Komentar berhasil ditambahkan.');

        $this->assertDatabaseHas('comments', [
            'ticket_id' => $ticket->id,
            'user_id' => $this->customer->id,
            'message' => 'This is my comment',
            'is_internal' => false,
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

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.comment', $ticket), [
                'message' => 'Trying to comment',
            ]);

        $response->assertSessionHasErrors('error');
    }

    public function test_rate_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to rate',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolved_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.rate', $ticket), [
                'rating' => 5,
                'rating_comment' => 'Great service!',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $ticket->refresh();
        $this->assertEquals(5, $ticket->rating);
        $this->assertEquals('Great service!', $ticket->rating_comment);
    }

    public function test_rate_requires_valid_rating(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to rate',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolved_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.rate', $ticket), [
                'rating' => 10, // Invalid: must be 1-5
            ]);

        $response->assertSessionHasErrors('rating');
    }

    public function test_cannot_rate_already_rated_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Already rated',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolved_at' => now()->subDay(),
            'rating' => 4,
        ]);

        $response = $this->actingAs($this->customer)
            ->post(route('portal.tickets.rate', $ticket), [
                'rating' => 5,
            ]);

        $response->assertSessionHasErrors('error');
    }

    public function test_delete_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Ticket to delete',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->delete(route('portal.tickets.destroy', $ticket));

        $response->assertRedirect(route('portal.tickets.index'));
        $response->assertSessionHas('success', 'Tiket berhasil dihapus.');

        $this->assertDatabaseMissing('tickets', [
            'id' => $ticket->id,
        ]);
    }

    public function test_cannot_delete_in_progress_ticket(): void
    {
        $ticket = Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'In Progress Ticket',
            'description' => 'Description',
            'priority' => 'medium',
            'status' => 'in_progress',
        ]);

        $response = $this->actingAs($this->customer)
            ->delete(route('portal.tickets.destroy', $ticket));

        $response->assertForbidden();
    }

    public function test_ticket_list_page_loads(): void
    {
        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'My Ticket',
            'description' => 'Description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->customer)
            ->get(route('portal.tickets.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Tickets/Index')
            ->has('tickets')
            ->has('filters')
            ->has('statuses')
            ->has('priorities')
        );
    }

    public function test_create_ticket_page_loads(): void
    {
        $response = $this->actingAs($this->customer)
            ->get(route('portal.tickets.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Tickets/Create')
            ->has('categories')
            ->has('priorities')
        );
    }
}
