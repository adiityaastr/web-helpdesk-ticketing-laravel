# Cuplikan Kode - Helpdesk Ticketing System

## 🔧 Fungsi Utama

### Fungsi 1: SAW Calculation Service

**File**: `app/Services/SawService.php`

```php
<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\SawConfiguration;
use Illuminate\Support\Facades\Cache;

class SawService
{
    /**
     * Calculate SAW score for a ticket
     */
    public function calculateScore(Ticket $ticket): float
    {
        // Check cache first
        $cacheKey = "saw_score_{$ticket->id}";
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // Get SAW configurations
        $configs = SawConfiguration::orderBy('sort_order')->get();
        $weights = $configs->pluck('weight', 'code')->toArray();

        // Extract criteria values
        $c1 = $this->getCriteriaC1($ticket); // Priority
        $c2 = $this->getCriteriaC2($ticket); // SLA Urgency
        $c3 = $this->getCriteriaC3($ticket); // Wait Time
        $c4 = $this->getCriteriaC4($ticket); // Customer Activity
        $c5 = $this->getCriteriaC5($ticket); // Complexity

        // Normalize values
        $r1 = $this->normalize($c1, 4, 'benefit');
        $r2 = $this->normalize($c2, 100, 'benefit');
        $r3 = $this->normalize($c3, 1440, 'cost');
        $r4 = $this->normalize($c4, 10, 'benefit');
        $r5 = $this->normalize($c5, 5, 'benefit');

        // Calculate weighted sum
        $score = (
            ($weights['C1'] ?? 0.30) * $r1 +
            ($weights['C2'] ?? 0.25) * $r2 +
            ($weights['C3'] ?? 0.20) * $r3 +
            ($weights['C4'] ?? 0.15) * $r4 +
            ($weights['C5'] ?? 0.10) * $r5
        );

        // Cache result for 60 seconds
        Cache::put($cacheKey, $score, now()->addSeconds(60));

        return $score;
    }

    /**
     * Normalize value based on type
     */
    private function normalize($value, $max, $type): float
    {
        if ($type === 'benefit') {
            return $max > 0 ? $value / $max : 0;
        } else { // cost
            return $value > 0 ? $max / $value : 0;
        }
    }

    /**
     * C1: Priority (1-4)
     */
    private function getCriteriaC1(Ticket $ticket): int
    {
        return match($ticket->priority) {
            'low' => 1,
            'medium' => 2,
            'high' => 3,
            'critical' => 4,
            default => 2,
        };
    }

    /**
     * C2: SLA Urgency (0-100)
     */
    private function getCriteriaC2(Ticket $ticket): int
    {
        if (!$ticket->sla_deadline) {
            return 50;
        }

        $minutesLeft = $ticket->sla_deadline->diffInMinutes(now());
        $urgency = 100 - ($minutesLeft / 1440 * 100);

        return max(0, min(100, (int)$urgency));
    }

    /**
     * C3: Wait Time (minutes)
     */
    private function getCriteriaC3(Ticket $ticket): int
    {
        return $ticket->created_at->diffInMinutes(now());
    }

    /**
     * C4: Customer Activity (0-10)
     */
    private function getCriteriaC4(Ticket $ticket): int
    {
        return min(10, $ticket->comments()->count());
    }

    /**
     * C5: Complexity (1-5)
     */
    private function getCriteriaC5(Ticket $ticket): int
    {
        $complexity = 1;

        // Length of description
        if (strlen($ticket->description) > 500) {
            $complexity++;
        }

        // Keywords
        if (preg_match('/urgent|critical|asap|emergency/i', $ticket->description)) {
            $complexity++;
        }

        // Attachments
        if ($ticket->comments()->whereNotNull('attachments')->count() > 0) {
            $complexity++;
        }

        return min(5, $complexity);
    }

    /**
     * Recalculate all tickets
     */
    public function recalculateAll(): void
    {
        Ticket::where('status', '!=', 'closed')->each(function ($ticket) {
            $score = $this->calculateScore($ticket);
            $ticket->update(['saw_score' => $score]);
        });
    }
}
```

---

### Fungsi 2: Create Ticket Controller

**File**: `app/Http/Controllers/TicketController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Http\Requests\StoreTicketRequest;
use App\Services\SawService;
use App\Events\TicketCreated;
use App\Models\ActivityLog;
use Illuminate\Support\Str;

class TicketController extends Controller
{
    public function __construct(private SawService $sawService) {}

    /**
     * Store a newly created ticket
     */
    public function store(StoreTicketRequest $request)
    {
        // Create ticket
        $ticket = Ticket::create([
            'uuid' => Str::uuid(),
            'user_id' => auth()->id(),
            'category_id' => $request->category_id,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'status' => 'open',
        ]);

        // Handle attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('tickets/' . $ticket->id, 'public');
                $ticket->attachments()->create(['path' => $path]);
            }
        }

        // Calculate SAW score
        $sawScore = $this->sawService->calculateScore($ticket);
        $ticket->update(['saw_score' => $sawScore]);

        // Dispatch event
        event(new TicketCreated($ticket));

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'ticket_id' => $ticket->id,
            'action' => 'create',
            'description' => 'Created ticket: ' . $ticket->title,
        ]);

        return redirect()->route('tickets.show', $ticket)
            ->with('success', 'Ticket created successfully');
    }

    /**
     * Update ticket status
     */
    public function updateStatus(Ticket $ticket, Request $request)
    {
        $this->authorize('update', $ticket);

        // Validate transition
        if (!$ticket->canTransitionTo($request->status)) {
            return back()->with('error', 'Invalid status transition');
        }

        $oldStatus = $ticket->status;

        // Update status
        $ticket->update(['status' => $request->status]);

        // Handle status-specific logic
        if ($request->status === 'resolved') {
            $ticket->update(['resolved_at' => now()]);
        } elseif ($request->status === 'closed') {
            $ticket->update(['resolved_confirmed_at' => now()]);
        } elseif ($request->status === 'cancelled') {
            $ticket->update(['cancelled_at' => now()]);
        }

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'ticket_id' => $ticket->id,
            'action' => 'update_status',
            'description' => "Changed status from {$oldStatus} to {$request->status}",
        ]);

        return back()->with('success', 'Status updated');
    }
}
```

---

### Fungsi 3: Send Notification Job

**File**: `app/Jobs/SendNotificationJob.php`

```php
<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public array $data
    ) {
        $this->onQueue('notifications');
    }

    /**
     * Execute the job
     */
    public function handle(): void
    {
        // Create notification record
        $notification = $this->user->notifications()->create([
            'type' => $this->data['type'],
            'data' => $this->data,
        ]);

        // Broadcast notification (optional)
        // broadcast(new NotificationBroadcast($this->user, $notification));

        // Send email (optional)
        // Mail::to($this->user)->queue(new NotificationMail($notification));
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        \Log::error('SendNotificationJob failed', [
            'user_id' => $this->user->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
```

---

## 🔐 Logika Penting

### Logika 1: Status Flow Validation

**File**: `app/Models/Ticket.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    /**
     * Valid status transitions
     */
    private static array $validTransitions = [
        'open' => ['in_progress', 'cancelled'],
        'in_progress' => ['resolved', 'cancelled'],
        'resolved' => ['closed', 'in_progress'],
        'closed' => [],
        'cancelled' => [],
    ];

    /**
     * Check if status transition is valid
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $validTransitions = self::$validTransitions[$this->status] ?? [];
        return in_array($newStatus, $validTransitions);
    }

    /**
     * Get available transitions
     */
    public function getAvailableTransitions(): array
    {
        return self::$validTransitions[$this->status] ?? [];
    }
}
```

---

### Logika 2: Permission Check (Policy)

**File**: `app/Policies/TicketPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Ticket;

class TicketPolicy
{
    /**
     * View ticket
     */
    public function view(User $user, Ticket $ticket): bool
    {
        // Admin & staff can view all
        if ($user->hasRole(['admin', 'staff'])) {
            return true;
        }

        // Customer can only view own tickets
        return $user->id === $ticket->user_id;
    }

    /**
     * Create ticket
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['customer', 'staff', 'admin']);
    }

    /**
     * Update ticket
     */
    public function update(User $user, Ticket $ticket): bool
    {
        // Admin & staff can update all
        if ($user->hasRole(['admin', 'staff'])) {
            return true;
        }

        // Customer can only update own active tickets
        return $user->id === $ticket->user_id && 
               in_array($ticket->status, ['open', 'in_progress']);
    }

    /**
     * Delete ticket
     */
    public function delete(User $user, Ticket $ticket): bool
    {
        // Admin can delete all
        if ($user->hasRole('admin')) {
            return true;
        }

        // Customer can only delete own open/cancelled tickets
        return $user->id === $ticket->user_id && 
               in_array($ticket->status, ['open', 'cancelled']);
    }

    /**
     * Add comment
     */
    public function comment(User $user, Ticket $ticket): bool
    {
        // Admin & staff can comment all
        if ($user->hasRole(['admin', 'staff'])) {
            return true;
        }

        // Customer can only comment own tickets
        return $user->id === $ticket->user_id;
    }
}
```

---

### Logika 3: Event Listener

**File**: `app/Listeners/SendTicketCreatedNotification.php`

```php
<?php

namespace App\Listeners;

use App\Events\TicketCreated;
use App\Jobs\SendNotificationJob;
use App\Models\User;

class SendTicketCreatedNotification
{
    /**
     * Handle the event
     */
    public function handle(TicketCreated $event): void
    {
        // Get all admin users
        $admins = User::role('admin')->get();

        // Send notification to each admin
        foreach ($admins as $admin) {
            SendNotificationJob::dispatch($admin, [
                'type' => 'ticket_created',
                'ticket_id' => $event->ticket->id,
                'title' => 'New Ticket Created',
                'message' => "New ticket: {$event->ticket->title}",
                'url' => route('tickets.show', $event->ticket),
            ]);
        }
    }
}
```

---

## 🔌 Integrasi API (Sanctum)

**File**: `routes/api.php`

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TicketApiController;

Route::middleware('auth:sanctum')->group(function () {
    // Get current user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Tickets API
    Route::apiResource('tickets', TicketApiController::class);

    // Ticket comments
    Route::post('tickets/{ticket}/comments', [TicketApiController::class, 'addComment']);

    // Ticket rating
    Route::post('tickets/{ticket}/rate', [TicketApiController::class, 'rate']);
});
```

**File**: `app/Http/Controllers/Api/TicketApiController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use App\Http\Resources\TicketResource;
use Illuminate\Http\Request;

class TicketApiController
{
    /**
     * Get all tickets for authenticated user
     */
    public function index(Request $request)
    {
        $tickets = Ticket::where('user_id', $request->user()->id)
            ->with('category', 'comments', 'assignedTo')
            ->paginate(15);

        return TicketResource::collection($tickets);
    }

    /**
     * Get single ticket
     */
    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        return new TicketResource($ticket->load('category', 'comments', 'assignedTo'));
    }

    /**
     * Create ticket
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
        ]);

        $ticket = Ticket::create([
            'user_id' => $request->user()->id,
            ...$validated,
        ]);

        return new TicketResource($ticket);
    }
}
```

---

## 🧪 PHPUnit Test: Status Transition Validation

**File**: `tests/Unit/TicketStatusTest.php`

```php
<?php

namespace Tests\Unit;

use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_transitions()
    {
        $ticket = Ticket::factory()->create(['status' => 'open']);
        
        $this->assertTrue($ticket->canTransitionTo('in_progress'));
        $this->assertTrue($ticket->canTransitionTo('cancelled'));
        $this->assertFalse($ticket->canTransitionTo('closed'));
        $this->assertFalse($ticket->canTransitionTo('resolved'));
    }

    public function test_invalid_transitions()
    {
        $ticket = Ticket::factory()->create(['status' => 'closed']);
        
        $this->assertFalse($ticket->canTransitionTo('open'));
        $this->assertFalse($ticket->canTransitionTo('in_progress'));
        $this->assertFalse($ticket->canTransitionTo('resolved'));
        $this->assertFalse($ticket->canTransitionTo('cancelled'));
    }

    public function test_resolved_status_transitions()
    {
        $ticket = Ticket::factory()->create(['status' => 'resolved']);
        
        $this->assertTrue($ticket->canTransitionTo('closed'));
        $this->assertTrue($ticket->canTransitionTo('in_progress'));
    }
}
```

## ⚡ Performance Optimization: Eager Loading

**File**: `app/Repositories/TicketRepository.php`

```php
<?php

namespace App\Repositories;

use App\Models\Ticket;
use Illuminate\Pagination\LengthAwarePaginator;

class TicketRepository
{
    public function getFilteredTickets(array $filters): LengthAwarePaginator
    {
        $query = Ticket::query()
            ->with(['category', 'assignedTo', 'comments' => function ($q) {
                $q->latest()->limit(3);
            }])
            ->withCount('comments');

        if (!empty($filters['status'])) {
            $query->whereIn('status', $filters['status']);
        }

        if (!empty($filters['priority'])) {
            $query->whereIn('priority', $filters['priority']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                  ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        $sortField = $filters['sort'] ?? 'created_at';
        $sortDir = $filters['dir'] ?? 'desc';

        return $query->orderBy($sortField, $sortDir)->paginate($filters['per_page'] ?? 15);
    }
}
```

---

## 📊 Kesimpulan

Cuplikan kode menunjukkan implementasi production-ready dari:

1. **SAW Service**: Algoritma multi-kriteria dengan caching
2. **Ticket Controller**: Create & update dengan event dispatching
3. **Notification Job**: Async processing via queue
4. **Status Validation**: State machine pattern
5. **Permission Policy**: Fine-grained authorization
6. **Event Listener**: Event-driven architecture
7. **API Integration**: Sanctum token authentication

Semua code mengikuti Laravel best practices dan SOLID principles.
