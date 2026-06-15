<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\TestCase;

class TicketApiTest extends TestCase
{
    protected User $customer;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed default categories
        $this->seed(\Database\Seeders\CategorySeeder::class);

        // Create standard customer user
        $this->customer = User::factory()->create();
        $this->customer->syncRoles(['customer']);

        $this->category = Category::first();
    }

    /**
     * Test registration API.
     */
    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'John Doe',
            'email' => 'johndoe@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token'
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'johndoe@example.com',
        ]);
    }

    /**
     * Test login API.
     */
    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'loginuser@example.com',
            'password' => bcrypt('password123'),
        ]);
        $user->syncRoles(['customer']);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'loginuser@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token'
            ]);
    }

    /**
     * Test fetching current authenticated user profile.
     */
    public function test_authenticated_user_can_get_profile(): void
    {
        Sanctum::actingAs($this->customer, ['*']);

        $response = $this->getJson('/api/v1/user');

        $response->assertStatus(200)
            ->assertJsonPath('email', $this->customer->email);
    }

    /**
     * Test listing tickets through API.
     */
    public function test_authenticated_user_can_list_tickets(): void
    {
        Sanctum::actingAs($this->customer, ['*']);

        Ticket::create([
            'user_id' => $this->customer->id,
            'category_id' => $this->category->id,
            'title' => 'API Test Ticket',
            'description' => 'Test description',
            'priority' => 'low',
            'status' => 'open',
        ]);

        $response = $this->getJson('/api/v1/tickets');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id', 'title', 'description', 'priority', 'status', 'reporter', 'category'
                    ]
                ],
                'meta' => ['current_page', 'last_page', 'total']
            ]);
    }

    /**
     * Test creating a ticket via API.
     */
    public function test_authenticated_user_can_create_ticket(): void
    {
        Sanctum::actingAs($this->customer, ['*']);

        $response = $this->postJson('/api/v1/tickets', [
            'category_id' => $this->category->id,
            'title' => 'API Created Ticket',
            'description' => 'This is a description from API test',
            'priority' => 'high',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'title', 'description', 'priority', 'status']
            ]);

        $this->assertDatabaseHas('tickets', [
            'title' => 'API Created Ticket',
            'user_id' => $this->customer->id,
        ]);
    }
}
