<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\TestCase;

class NotificationControllerTest extends TestCase
{
    /** @test */
    public function test_mark_all_as_read_uses_bulk_update(): void
    {
        $user = User::factory()->create();

        // Create some unread notifications
        DB::table('notifications')->insert([
            [
                'id' => Str::uuid(),
                'type' => 'App\Notifications\TicketActivityNotification',
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode(['ticket_id' => 1, 'action' => 'created', 'message' => 'Test']),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => Str::uuid(),
                'type' => 'App\Notifications\TicketActivityNotification',
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode(['ticket_id' => 2, 'action' => 'updated', 'message' => 'Test 2']),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->actingAs($user)
            ->post(route('notifications.read-all'))
            ->assertRedirect()
            ->assertSessionHas('success');

        // Verify all notifications are now read
        $this->assertEquals(0, DB::table('notifications')
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->count());
    }

    /** @test */
    public function test_mark_as_read_invalidates_notification_count_cache(): void
    {
        $user = User::factory()->create();

        // Pre-populate cache
        Cache::put("user_notif_count_{$user->id}", 5, 300);

        // Create some unread notifications
        DB::table('notifications')->insert([
            [
                'id' => Str::uuid(),
                'type' => 'App\Notifications\TicketActivityNotification',
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode(['ticket_id' => 1, 'action' => 'created', 'message' => 'Test']),
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->actingAs($user)
            ->post(route('notifications.read-all'))
            ->assertRedirect();

        // Cache should be cleared after marking as read
        $this->assertNull(Cache::get("user_notif_count_{$user->id}"));
    }

    /** @test */
    public function test_unauthenticated_user_cannot_mark_as_read(): void
    {
        $this->post(route('notifications.read-all'))
            ->assertRedirect('/login');
    }

    /** @test */
    public function test_notifications_index_requires_auth(): void
    {
        $this->get(route('notifications.index'))
            ->assertRedirect('/login');
    }
}
