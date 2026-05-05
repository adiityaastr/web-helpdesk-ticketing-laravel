<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Comment;
use App\Notifications\TicketActivityNotification;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class NotificationServiceTest extends TestCase
{
    use WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure a base category exists
        if (!Category::count()) {
            DB::table('categories')->truncate();
            DB::table('categories')->insert([
                ['name' => 'Hardware', 'slug' => 'hardware'],
                ['name' => 'Software', 'slug' => 'software'],
                ['name' => 'Jaringan', 'slug' => 'jaringan'],
            ]);
        }
    }

    public function test_notify_on_ticket_creation_sends_to_staff()
    {
        Notification::fake();

        // Create portal user (reporter)
        $portal = User::factory()->create(['name' => 'Portal Reporter']);
        $portal->assignRole('customer');

        // Create staff users
        $staff1 = User::factory()->create(['name' => 'Staff One', 'email' => 'staff1@example.test']);
        $staff1->assignRole('staff');
        $staff2 = User::factory()->create(['name' => 'Staff Two', 'email' => 'staff2@example.test']);
        $staff2->assignRole('staff');

        $category = Category::first();

        // Create a ticket instance (relations will be loaded by the service)
        $ticket = Ticket::create([
            'user_id' => $portal->id,
            'category_id' => $category->id,
            'title' => 'Test ticket',
            'description' => 'desc',
            'priority' => 'low',
            'status' => 'open',
        ]);

        // Call service
        $service = new NotificationService();
        $service->notifyTicketUpdate($ticket, 'created', null, true);

        Notification::assertSentTo($staff1, TicketActivityNotification::class);
        Notification::assertSentTo($staff2, TicketActivityNotification::class);
    }

    public function test_notify_on_ticket_update_sends_to_related()
    {
        Notification::fake();

        $reporter = User::factory()->create(['name' => 'Reporter']);
        $reporter->assignRole('customer');
        $assignee = User::factory()->create(['name' => 'Assignee']);
        $assignee->assignRole('staff');

        $category = Category::first();
        $ticket = Ticket::create([
            'user_id' => $reporter->id,
            'category_id' => $category->id,
            'title' => 'Ticket for update',
            'description' => 'desc',
            'priority' => 'low',
            'status' => 'open',
            'assigned_to' => $assignee->id,
        ]);

        $service = new NotificationService();
        $service->notifyTicketUpdate($ticket, 'updated', null, false);

        Notification::assertSentTo($reporter, TicketActivityNotification::class);
        Notification::assertSentTo($assignee, TicketActivityNotification::class);
    }

    public function test_notify_on_comment_sends_to_related()
    {
        Notification::fake();

        $reporter = User::factory()->create(['name' => 'Reporter C']);
        $reporter->assignRole('customer');
        $assignee = User::factory()->create(['name' => 'Assignee C']);
        $assignee->assignRole('staff');

        $category = Category::first();
        $ticket = Ticket::create([
            'user_id' => $reporter->id,
            'category_id' => $category->id,
            'title' => 'Ticket with comment',
            'description' => 'desc',
            'priority' => 'low',
            'status' => 'open',
            'assigned_to' => $assignee->id,
        ]);

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $assignee->id,
            'message' => 'Test comment',
            'is_internal' => false,
        ]);

        $service = new NotificationService();
        $service->notifyTicketUpdate($ticket, 'commented', $comment, false);

        Notification::assertSentTo($reporter, TicketActivityNotification::class);
        Notification::assertSentTo($assignee, TicketActivityNotification::class);
    }

    public function test_notify_on_cancellation_sends_to_related()
    {
        Notification::fake();

        $reporter = User::factory()->create(['name' => 'Reporter Cancel']);
        $reporter->assignRole('customer');
        $assignee = User::factory()->create(['name' => 'Assignee Cancel']);
        $assignee->assignRole('staff');

        $category = Category::first();
        $ticket = Ticket::create([
            'user_id' => $reporter->id,
            'category_id' => $category->id,
            'title' => 'Ticket cancel',
            'description' => 'desc',
            'priority' => 'low',
            'status' => 'open',
            'assigned_to' => $assignee->id,
        ]);

        $service = new NotificationService();
        $service->notifyTicketUpdate($ticket, 'cancelled', null, false);

        Notification::assertSentTo($reporter, TicketActivityNotification::class);
        Notification::assertSentTo($assignee, TicketActivityNotification::class);
    }

    public function test_staff_users_are_cached_for_300_seconds()
    {
        // Mock Cache to ensure remember is invoked with 300 seconds
        Notification::fake();
        Cache::shouldReceive('remember')
            ->once()
            ->with('notifications.staff_users', 300, \Closure::class)
            ->andReturn(collect([
                User::factory()->make(['name' => 'Cached Staff'])
            ]));

        $portal = User::factory()->create(['name' => 'Portal Cache'],);
        $portal->assignRole('customer');
        $category = Category::first();
        $ticket = Ticket::create([
            'user_id' => $portal->id,
            'category_id' => $category->id,
            'title' => 'Ticket',
            'description' => 'desc',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $service = new NotificationService();
        $service->notifyTicketUpdate($ticket, 'created', null, true);
    }
}
