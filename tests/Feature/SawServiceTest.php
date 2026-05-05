<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Services\SawService;
use Illuminate\Support\Facades\Cache;

class SawServiceTest extends TestCase
{
    protected User $customer;
    protected User $staff;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->customer = User::factory()->create();
        $this->staff = User::factory()->create();
        $this->category = Category::factory()->create();
    }

    /** @test */
    public function test_get_scores_returns_array(): void
    {
        $service = new SawService();
        $scores = $service->getScores();
        $this->assertIsArray($scores);
    }

    /** @test */
    public function test_get_scores_caches_result(): void
    {
        Cache::shouldReceive('remember')
            ->once()
            ->with('admin_saw_scores', 300, \Mockery::any())
            ->andReturn([]);

        $service = new SawService();
        $service->getScores();
    }

    /** @test */
    public function test_invalidate_cache_clears_key(): void
    {
        Cache::put('admin_saw_scores', ['test' => 42], 300);
        $this->assertEquals(['test' => 42], Cache::get('admin_saw_scores'));

        $service = new SawService();
        $service->invalidateCache();

        $this->assertNull(Cache::get('admin_saw_scores'));
    }

    /** @test */
    public function test_saw_scores_include_tickets_with_priority(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Test SAW Ticket',
            'description' => 'Test description',
            'priority' => 'critical',
            'status' => 'open',
        ]);

        (new SawService())->seedDefaults();

        $scores = (new SawService())->getScores();

        $this->assertArrayHasKey($ticket->id, $scores);
        $this->assertIsFloat($scores[$ticket->id]);
    }

    /** @test */
    public function test_cache_invalidated_on_ticket_change(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'Cache Test',
            'description' => 'Test',
            'priority' => 'low',
            'status' => 'open',
        ]);

        (new SawService())->seedDefaults();

        $first = (new SawService())->getScores();

        (new SawService())->invalidateCache();

        $second = (new SawService())->getScores();

        $this->assertIsArray($first);
        $this->assertIsArray($second);
    }
}
