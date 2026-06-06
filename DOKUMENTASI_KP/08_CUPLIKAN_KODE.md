# Cuplikan Kode - Helpdesk Ticketing System

## 🔧 Fungsi Utama

### Fungsi 1: SAW Calculation Service

**File**: `app/Services/SawService.php`

```php
<?php

namespace App\Services;

use App\Models\SawConfiguration;
use App\Models\Ticket;
use Illuminate\Support\Facades\Cache;

class SawService
{
    private array $criteria = [];
    private array $weights = [];
    private array $types = [];

    public function __construct()
    {
        $configs = SawConfiguration::query()->orderBy('sort_order')->get();

        foreach ($configs as $config) {
            $this->criteria[] = $config->code;
            $this->weights[$config->code] = (float) $config->weight;
            $this->types[$config->code] = $config->type;
        }
    }

    public function calculateScores(): array
    {
        $tickets = Ticket::query()
            ->with(['category', 'reporter'])
            ->get();

        if ($tickets->isEmpty()) {
            return [];
        }

        $userTicketCounts = Ticket::query()
            ->selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $matrix = $this->buildDecisionMatrix($tickets, $userTicketCounts);
        $normalized = $this->normalize($matrix);
        $scores = $this->weightedSum($normalized);

        arsort($scores);

        return $scores;
    }

    private function buildDecisionMatrix($tickets, $userTicketCounts): array
    {
        $matrix = [];
        foreach ($tickets as $ticket) {
            $row = [];
            foreach ($this->criteria as $code) {
                $row[$code] = $this->getCriterionValue($ticket, $code, $userTicketCounts);
            }
            $matrix[$ticket->id] = $row;
        }
        return $matrix;
    }

    private function getCriterionValue(Ticket $ticket, string $code, $userTicketCounts): float
    {
        return match ($code) {
            'C1' => $this->priorityScore($ticket->priority),
            'C2' => $this->slaUrgency($ticket),
            'C3' => $this->waitingTime($ticket),
            'C4' => $this->customerActivity($ticket, $userTicketCounts),
            'C5' => $this->complexity($ticket),
            default => 0,
        };
    }

    private function priorityScore(string $priority): float
    {
        return match ($priority) {
            'critical' => 4.0,
            'high' => 3.0,
            'medium' => 2.0,
            'low' => 1.0,
            default => 1.0,
        };
    }

    private function slaUrgency(Ticket $ticket): float
    {
        if (! $ticket->sla_deadline) {
            return 0;
        }
        $hoursRemaining = now()->diffInHours($ticket->sla_deadline, false);
        if ($hoursRemaining <= 0) {
            return 10;
        }
        return 1 / ($hoursRemaining + 1);
    }

    private function waitingTime(Ticket $ticket): float
    {
        return $ticket->created_at->diffInHours(now());
    }

    private function customerActivity(Ticket $ticket, $userTicketCounts): float
    {
        return (float) ($userTicketCounts[$ticket->user_id] ?? 0);
    }

    private function complexity(Ticket $ticket): float
    {
        return (float) mb_strlen($ticket->description ?? '');
    }

    private function normalize(array $matrix): array
    {
        $normalized = [];
        foreach ($this->criteria as $code) {
            $values = array_column($matrix, $code);
            $max = max($values) ?: 1;
            $min = min($values) ?: 0;
            foreach ($matrix as $id => $row) {
                if ($this->types[$code] === 'benefit') {
                    $normalized[$id][$code] = $max > 0 ? $row[$code] / $max : 0;
                } else {
                    $normalized[$id][$code] = $row[$code] > 0 ? $min / $row[$code] : 0;
                }
            }
        }
        return $normalized;
    }

    private function weightedSum(array $normalized): array
    {
        $scores = [];
        foreach ($normalized as $id => $row) {
            $score = 0;
            foreach ($this->criteria as $code) {
                $score += $row[$code] * $this->weights[$code];
            }
            $scores[$id] = round($score, 4);
        }
        return $scores;
    }

    public function getScores(): array
    {
        return Cache::remember(CacheManager::ADMIN_SAW_SCORES, CacheManager::TTL_SHORT, function () {
            try {
                return $this->calculateScores();
            } catch (\Exception $e) {
                AuditLogger::error('SAW calculation failed', $e, [
                    'ticket_count' => Ticket::query()->count(),
                ]);
                return [];
            }
        });
    }
}
```

---

### Fungsi 2: Ticket Service (Create & Manage)

**File**: `app/Services/TicketService.php`

```php
<?php

namespace App\Services;

use App\Exceptions\TicketException;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Traits\TrackTicketActivity;
use Illuminate\Http\Request;

class TicketService
{
    use TrackTicketActivity;

    public function createTicket(Request $request, User $user): Ticket
    {
        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $attachment) {
                $attachmentPaths[] = $attachment->store('tickets/attachments', 'public');
            }
        }

        $ticket = Ticket::query()->create([
            'user_id' => $user->id,
            'category_id' => $request->integer('category_id'),
            'title' => $request->string('title'),
            'description' => $request->string('description'),
            'priority' => $request->input('priority'),
            'status' => 'open',
        ]);

        $ticket->comments()->create([
            'user_id' => $user->id,
            'message' => 'Tiket berhasil dibuat.',
            'is_internal' => false,
            'attachments' => $attachmentPaths,
        ]);

        $this->logActivity($ticket, $user, 'created', 'Tiket dibuat oleh pelapor.');
        $this->notifyRelatedUsers($ticket, 'created');
        $this->invalidateTicketCaches($ticket, $user->id);

        return $ticket;
    }

    public function cancelTicket(Ticket $ticket, User $user): Ticket
    {
        $ticket->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $this->logActivity($ticket, $user, 'cancelled', 'Tiket dibatalkan oleh pelapor.');
        $this->notifyRelatedUsers($ticket, 'cancelled');
        $this->invalidateTicketCaches($ticket, $ticket->user_id);

        return $ticket;
    }

    public function confirmResolution(Ticket $ticket, User $user): Ticket
    {
        if ($ticket->user_id !== $user->id) {
            throw TicketException::unauthorized();
        }
        if ($ticket->status !== 'resolved') {
            throw TicketException::notResolved();
        }
        if ($ticket->resolved_confirmed_at) {
            throw TicketException::alreadyConfirmed();
        }

        $ticket->update([
            'resolved_confirmed_at' => now(),
            'status' => 'closed',
        ]);

        $ticket->comments()->create([
            'user_id' => $user->id,
            'message' => 'Pelapor mengonfirmasi penyelesaian. Tiket ditutup.',
            'is_internal' => false,
        ]);

        $this->logActivity($ticket, $user, 'confirmed', 'Pelapor mengonfirmasi penyelesaian tiket.');
        $this->notifyRelatedUsers($ticket, 'confirmed');
        $this->invalidateTicketCaches($ticket);

        return $ticket;
    }
}
```

---

### Fungsi 3: Portal Ticket Controller

**File**: `app/Http/Controllers/Portal/TicketController.php`

```php
<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Category;
use App\Models\Ticket;
use App\Services\CacheManager;
use App\Services\CommentService;
use App\Services\NotificationService;
use App\Services\SawService;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function __construct(
        private TicketService $ticketService,
        private CommentService $commentService,
        private NotificationService $notificationService
    ) {}

    public function index(Request $request): Response
    {
        $tickets = $this->ticketService->getUserTickets(
            $request->user(),
            $request->only(['status', 'priority', 'search']),
            10
        );

        TicketResource::setSharedScores(app(SawService::class)->getScores());

        return Inertia::render('Portal/Tickets/Index', [
            'tickets' => TicketResource::collection($tickets),
            'filters' => $request->only(['status', 'priority', 'search']),
        ]);
    }

    public function store(StoreTicketRequest $request): RedirectResponse
    {
        $ticket = $this->ticketService->createTicket($request, $request->user());
        $this->notificationService->notifyTicketUpdate($ticket, 'created', null, true);
        return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Tiket berhasil dibuat.');
    }

    public function show(Ticket $ticket): Response
    {
        $this->authorize('view', $ticket);
        $detail = $this->ticketService->getTicketWithDetails($ticket, false);

        return Inertia::render('Portal/Tickets/Show', [
            'ticket' => new TicketResource($detail['ticket']),
            'comments' => $detail['comments'],
        ]);
    }
}
```

---

## 🔐 Logika Penting

### Logika 1: Ticket Model (SLA & Status)

**File**: `app/Models/Ticket.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid', 'user_id', 'category_id', 'title', 'description',
        'priority', 'status', 'assigned_to', 'sla_deadline',
        'resolved_at', 'resolved_confirmed_at', 'cancelled_at',
        'rating', 'rating_comment',
    ];

    protected function casts(): array
    {
        return [
            'sla_deadline' => 'datetime',
            'resolved_at' => 'datetime',
            'resolved_confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'rating' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Ticket $ticket): void {
            if (blank($ticket->uuid)) {
                $ticket->uuid = (string) Str::uuid();
            }
        });
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function publicComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('is_internal', false);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function isOverdue(): bool
    {
        return $this->sla_deadline !== null
            && ! in_array($this->status, ['resolved', 'closed', 'cancelled'])
            && now()->isAfter($this->sla_deadline);
    }

    public function isSlaWarning(): bool
    {
        if (! $this->sla_deadline || in_array($this->status, ['resolved', 'closed', 'cancelled'])) {
            return false;
        }
        return now()->diffInHours($this->sla_deadline, false) <= 4
            && now()->diffInHours($this->sla_deadline, false) > 0;
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, ['open', 'in_progress']);
    }
}
```

---

### Logika 2: Permission Check (Policy)

**File**: `app/Policies/TicketPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['customer', 'staff']);
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }
        return $ticket->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['customer', 'staff']);
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }
        return $ticket->user_id === $user->id
            && in_array($ticket->status, ['open', 'in_progress'], true);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }
        return $ticket->user_id === $user->id
            && in_array($ticket->status, ['open', 'cancelled'], true);
    }

    public function comment(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return true;
        }
        return $ticket->user_id === $user->id;
    }

    public function cancel(User $user, Ticket $ticket): bool
    {
        if ($user->isStaff()) {
            return $ticket->isCancellable();
        }
        return $ticket->user_id === $user->id && $ticket->isCancellable();
    }
}
```

---

### Logika 3: Ticket Exception Handling

**File**: `app/Exceptions/TicketException.php`

```php
<?php

namespace App\Exceptions;

use Exception;

class TicketException extends Exception
{
    public static function unauthorized(): self
    {
        return new self('Anda tidak memiliki akses untuk melakukan aksi ini.', 403);
    }

    public static function notResolved(): self
    {
        return new self('Tiket belum dalam status resolved.', 400);
    }

    public static function alreadyConfirmed(): self
    {
        return new self('Tiket sudah dikonfirmasi sebelumnya.', 400);
    }

    public static function cannotRate(): self
    {
        return new self('Hanya tiket yang sudah resolved/closed yang dapat diberi rating.', 400);
    }

    public static function alreadyRated(): self
    {
        return new self('Tiket sudah pernah diberi rating.', 400);
    }
}
```

---

## 🔌 Integrasi API (Sanctum)

**File**: `routes/api.php`

```php
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::middleware('throttle:5,1')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::middleware('throttle:60,1')->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/user', [AuthController::class, 'user']);
            Route::get('/tickets', [TicketController::class, 'index']);
            Route::post('/tickets', [TicketController::class, 'store']);
            Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
            Route::post('/tickets/{ticket}/comments', [TicketController::class, 'comment']);
        });
    });
});
```

---

## 🧪 PHPUnit Test: SAW Calculation

**File**: `tests/Feature/SawServiceTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\SawConfiguration;
use App\Models\Ticket;
use App\Models\User;
use App\Services\SawService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SawServiceTest extends TestCase
{
    use RefreshDatabase;

    private SawService $sawService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sawService = app(SawService::class);
    }

    public function test_saw_calculation_returns_scores(): void
    {
        SawConfiguration::query()->firstOrCreate(
            ['code' => 'C1'],
            ['name' => 'Priority', 'type' => 'benefit', 'weight' => 0.25, 'sort_order' => 1]
        );
        SawConfiguration::query()->firstOrCreate(
            ['code' => 'C2'],
            ['name' => 'SLA Urgency', 'type' => 'benefit', 'weight' => 0.30, 'sort_order' => 2]
        );

        $user = User::factory()->create();
        Ticket::factory()->create([
            'user_id' => $user->id,
            'priority' => 'critical',
            'status' => 'open',
        ]);
        Ticket::factory()->create([
            'user_id' => $user->id,
            'priority' => 'low',
            'status' => 'open',
        ]);

        $scores = $this->sawService->calculateScores();

        $this->assertNotEmpty($scores);
        $this->assertCount(2, $scores);
    }
}
```

---

## 📊 Kesimpulan

Cuplikan kode menunjukkan implementasi production-ready dari:

1. **SAW Service**: Algoritma multi-kriteria dengan caching terpusat
2. **Ticket Service**: Service layer pattern dengan exception handling
3. **Portal Controller**: Inertia.js response dengan shared SAW scores
4. **Ticket Model**: SLA tracking, UUID generation, cancellable checks
5. **Permission Policy**: Fine-grained authorization dengan isStaff() helper
6. **Ticket Exception**: Domain-specific exceptions untuk validasi bisnis
7. **API Integration**: Sanctum token authentication dengan rate limiting

Semua code mengikuti Laravel best practices dan Service Layer pattern.
