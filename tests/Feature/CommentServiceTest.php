<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;
use App\Services\CommentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommentServiceTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_add_comment_with_attachments()
    {
        Storage::fake('public');

        $user = User::create([
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'General category',
        ]);

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Test Ticket',
            'description' => 'Desc',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $service = new CommentService();
        $attachments = ['tickets/comments/file1.txt', 'tickets/comments/file2.txt'];

        $comment = $service->addComment($ticket, $user, 'Hello', false, $attachments);

        $this->assertInstanceOf(Comment::class, $comment);
        $this->assertEquals($ticket->id, $comment->ticket_id);
        $this->assertEquals($user->id, $comment->user_id);
        $this->assertEquals(false, $comment->is_internal);
        $this->assertEquals($attachments, $comment->attachments);
    }

    /** @test */
    public function test_add_internal_comment_admin()
    {
        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'General category',
        ]);

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Test Ticket',
            'description' => 'Desc',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $service = new CommentService();
        $comment = $service->addComment($ticket, $user, 'Internal note', true, []);

        $this->assertInstanceOf(Comment::class, $comment);
        $this->assertTrue($comment->is_internal);
    }

    /** @test */
    public function test_add_comment_locked_ticket()
    {
        $user = User::create([
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'General category',
        ]);

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Test Ticket',
            'description' => 'Desc',
            'priority' => 'low',
            'status' => 'closed',
        ]);

        $service = new CommentService();
        $this->expectException(\RuntimeException::class);
        $service->addComment($ticket, $user, 'Should fail', false, []);
    }

    /** @test */
    public function test_delete_comment_attachments()
    {
        Storage::fake('public');

        // Prepare a dummy file in storage
        Storage::disk('public')->put('tickets/comments/file1.txt', 'data');
        Storage::disk('public')->put('tickets/comments/file2.txt', 'data');

        $user = User::create([
            'name' => 'Writer',
            'email' => 'writer@example.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'General category',
        ]);

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Test Ticket',
            'description' => 'Desc',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => 'Test',
            'is_internal' => false,
            'attachments' => ['tickets/comments/file1.txt','tickets/comments/file2.txt'],
        ]);

        // Delete should remove attachments from storage
        $comment->delete();

        $this->assertFalse(Storage::disk('public')->exists('tickets/comments/file1.txt'));
        $this->assertFalse(Storage::disk('public')->exists('tickets/comments/file2.txt'));
    }
}
