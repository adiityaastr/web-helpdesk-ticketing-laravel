<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Notifications\TicketActivityNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TicketServiceTest extends TestCase
{
    use WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed categories for tests (if not already seeded)
        if (! Category::count()) {
            DB::table('categories')->truncate();
            DB::table('categories')->insert([
                ['name' => 'Hardware', 'slug' => 'hardware'],
                ['name' => 'Software', 'slug' => 'software'],
                ['name' => 'Jaringan', 'slug' => 'jaringan'],
            ]);
        }
    }

    public function test_create_ticket_with_attachments()
    {
        Notification::fake();

        $portalUser = User::factory()->create(['name' => 'Pelapor', 'email' => 'pelapor@example.com']);
        $portalUser->assignRole('customer');

        $category = Category::first();

        $request = new Request([
            'title' => 'Test tiket dengan lampiran',
            'description' => 'Deskripsi tiket',
            'category_id' => $category->id,
            'priority' => 'low',
        ]);

        // Attachments: simulate uploaded files
        $file1 = UploadedFile::fake()->create('attachment1.txt', 100);
        $request->files->set('attachments', [$file1]);

        $service = new TicketService();
        $ticket = $service->createTicket($request, $portalUser);

        $this->assertInstanceOf(Ticket::class, $ticket);
        // The initial comment should exist
        $this->assertCount(1, $ticket->comments);
        $comment = $ticket->comments()->first();
        $this->assertFalse($comment->is_internal);
        $this->assertNotEmpty($comment->attachments);

        // Create a staff user and ensure notification is sent to staff on creation
        $staff = User::factory()->create(['name' => 'Staff A', 'email' => 'staffa@example.com']);
        $staff->assignRole('staff');

        $request2 = new Request([
            'title' => 'Another tiket',
            'description' => 'Desc',
            'category_id' => $category->id,
            'priority' => 'medium',
        ]);
        $service->createTicket($request2, $portalUser);

        Notification::assertSentTo($staff, TicketActivityNotification::class);
    }

    public function test_create_ticket_notifies_staff()
    {
        Notification::fake();
        $portal = User::factory()->create(['name' => 'Portal User']);
        $portal->assignRole('customer');

        $staff1 = User::factory()->create(['name' => 'Staff 1']);
        $staff1->assignRole('staff');
        $staff2 = User::factory()->create(['name' => 'Staff 2']);
        $staff2->assignRole('staff');

        $category = Category::first();
        $req = new Request([
            'title' => 'Ticket for staff notif',
            'description' => 'Notif test',
            'category_id' => $category->id,
            'priority' => 'low',
        ]);

        $service = new TicketService();
        $service->createTicket($req, $portal);

        // Staff should receive notification
        Notification::assertSentTo($staff1, TicketActivityNotification::class);
        Notification::assertSentTo($staff2, TicketActivityNotification::class);
    }

    public function test_update_ticket_status()
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $category = Category::first();
        $request = new Request([
            'title' => 'Ticket to update',
            'description' => 'desc',
            'category_id' => $category->id,
            'priority' => 'medium',
        ]);
        $service = new TicketService();
        $ticket = $service->createTicket($request, $customer);

        $service->updateTicket($ticket, ['status' => 'in_progress'], $customer);
        $this->assertEquals('in_progress', $ticket->fresh()->status);
    }

    public function test_cancel_ticket()
    {
        $cust = User::factory()->create();
        $cust->assignRole('customer');
        $cat = Category::first();
        $rq = new Request(['title' => 'Cancel me', 'description' => 'desc', 'category_id' => $cat->id, 'priority' => 'low']);
        $srv = new TicketService();
        $t = $srv->createTicket($rq, $cust);
        $srv->cancelTicket($t, $cust);
        $this->assertEquals('cancelled', $t->fresh()->status);
        $this->assertNotNull($t->cancelled_at);
    }

    public function test_confirm_resolution()
    {
        $cust = User::factory()->create();
        $cust->assignRole('customer');
        $cat = Category::first();
        $rq = new Request(['title' => 'Confirm', 'description' => 'desc', 'category_id' => $cat->id, 'priority' => 'low']);
        $srv = new TicketService();
        $t = $srv->createTicket($rq, $cust);
        // Simulate resolved status first
        $srv->updateTicket($t, ['status' => 'resolved'], $cust);

        $srv->confirmResolution($t, $cust);
        $this->assertNotNull($t->fresh()->resolved_confirmed_at);
        $this->assertEquals('closed', $t->fresh()->status);
    }

    public function test_reject_resolution()
    {
        $cust = User::factory()->create();
        $cust->assignRole('customer');
        $cat = Category::first();
        $rq = new Request(['title' => 'Reject', 'description' => 'desc', 'category_id' => $cat->id, 'priority' => 'low']);
        $srv = new TicketService();
        $t = $srv->createTicket($rq, $cust);
        $srv->updateTicket($t, ['status' => 'resolved'], $cust);

        $srv->rejectResolution($t, 'Issue persists', $cust);
        $this->assertEquals('in_progress', $t->fresh()->status);
    }

    public function test_delete_ticket_removes_files()
    {
        $cust = User::factory()->create();
        $cust->assignRole('customer');
        $cat = Category::first();
        $rq = new Request(['title' => 'Delete', 'description' => 'desc', 'category_id' => $cat->id, 'priority' => 'low']);
        $srv = new TicketService();
        $t = $srv->createTicket($rq, $cust);
        // attach a file to initial comment
        $attachment = UploadedFile::fake()->create('delete_me.txt', 50);
        $payloadReq = new Request(['title' => $rq['title'], 'description' => $rq['description'], 'category_id' => $cat->id, 'priority' => 'low']);
        $payloadReq->files->set('attachments', [$attachment]);
        $t2 = $srv->createTicket($payloadReq, $cust);

        // Ensure file exists on disk
        $files = $t2->comments()->first()->attachments ?? [];
        foreach ($files as $path) {
            $this->assertTrue(Storage::disk('public')->exists($path));
        }

        $srv->deleteTicket($t2);
        foreach ($files as $path) {
            $this->assertFalse(Storage::disk('public')->exists($path));
        }
    }

    public function test_ticket_show_filters_internal_comments()
    {
        $user = User::factory()->create();
        $user->assignRole('customer');
        $cat = Category::first();

        $req = new Request(['title' => 'Show', 'description' => 'desc', 'category_id' => $cat->id, 'priority' => 'low']);
        $service = new TicketService();
        $t = $service->createTicket($req, $user);

        // Add an internal comment by staff
        $staff = User::factory()->create(['name' => 'Staff Internal']);
        $staff->assignRole('staff');
        $t->comments()->create(['user_id' => $staff->id, 'message' => 'Internal note', 'is_internal' => true]);

        // Non-staff user should not see internal comments
        $detail = $service->getTicketDetail($t, $user);
        $this->assertIsArray($detail);
        $this->assertCount(0, $detail['comments']);
    }
}
