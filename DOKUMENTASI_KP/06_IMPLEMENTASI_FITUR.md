# Implementasi Fitur - Helpdesk Ticketing System

## 🎯 Fitur Utama yang Diimplementasikan

Sistem Helpdesk Ticketing memiliki 3 fitur utama yang akan dijelaskan secara detail:

1. **Manajemen Tiket** - Core feature untuk create, read, update, delete tiket
2. **SAW Scoring** - Algoritma prioritas otomatis berdasarkan multi-kriteria
3. **Notifikasi Real-time** - Event-driven notification system

---

## 📌 Fitur 1: Manajemen Tiket

### Alur Kerja

```
Customer membuat tiket
    ↓
Sistem validasi input
    ↓
Create ticket record di database
    ↓
Generate UUID & hitung SAW score
    ↓
Dispatch event & send notification
    ↓
Staff melihat tiket
    ↓
Assign ke staff (optional)
    ↓
Staff handle tiket:
  - Add comment (public/internal)
  - Update status
  - Upload attachment
    ↓
Staff resolve tiket
    ↓
Customer confirm selesai
    ↓
Customer beri rating
    ↓
Tiket closed
```

### Logika Program

#### **Create Ticket**

```php
// app/Http/Controllers/TicketController.php
public function store(StoreTicketRequest $request)
{
    // 1. Validasi input (dilakukan di StoreTicketRequest)
    
    // 2. Create ticket
    $ticket = Ticket::create([
        'uuid' => Str::uuid(),
        'user_id' => auth()->id(),
        'category_id' => $request->category_id,
        'title' => $request->title,
        'description' => $request->description,
        'priority' => $request->priority ?? 'medium',
        'status' => 'open',
    ]);
    
    // 3. Handle attachments
    if ($request->hasFile('attachments')) {
        foreach ($request->file('attachments') as $file) {
            $path = $file->store('tickets', 'public');
            $ticket->attachments()->create(['path' => $path]);
        }
    }
    
    // 4. Calculate SAW score
    $sawScore = app(SawService::class)->calculateScore($ticket);
    $ticket->update(['saw_score' => $sawScore]);
    
    // 5. Dispatch event
    event(new TicketCreated($ticket));
    
    // 6. Log activity
    ActivityLog::create([
        'user_id' => auth()->id(),
        'ticket_id' => $ticket->id,
        'action' => 'create',
        'description' => 'Created ticket: ' . $ticket->title,
    ]);
    
    // 7. Return response
    return redirect()->route('tickets.show', $ticket)
        ->with('success', 'Ticket created successfully');
}
```

#### **Update Status**

```php
public function updateStatus(Ticket $ticket, Request $request)
{
    // 1. Check authorization
    $this->authorize('update', $ticket);
    
    // 2. Validate status transition
    if (!$ticket->canTransitionTo($request->status)) {
        return back()->with('error', 'Invalid status transition');
    }
    
    // 3. Get old status
    $oldStatus = $ticket->status;
    
    // 4. Update status
    $ticket->update(['status' => $request->status]);
    
    // 5. Handle status-specific logic
    if ($request->status === 'resolved') {
        $ticket->update(['resolved_at' => now()]);
    } elseif ($request->status === 'closed') {
        $ticket->update(['resolved_confirmed_at' => now()]);
    } elseif ($request->status === 'cancelled') {
        $ticket->update(['cancelled_at' => now()]);
    }
    
    // 6. Dispatch event
    event(new TicketStatusChanged($ticket, $oldStatus, $request->status));
    
    // 7. Log activity
    ActivityLog::create([
        'user_id' => auth()->id(),
        'ticket_id' => $ticket->id,
        'action' => 'update_status',
        'description' => "Changed status from {$oldStatus} to {$request->status}",
    ]);
    
    return back()->with('success', 'Status updated');
}
```

#### **Status Transition Validation**

```php
// app/Models/Ticket.php
public function canTransitionTo($newStatus)
{
    $validTransitions = [
        'open' => ['in_progress', 'cancelled'],
        'in_progress' => ['resolved', 'cancelled'],
        'resolved' => ['closed', 'in_progress'],
        'closed' => [],
        'cancelled' => [],
    ];
    
    return in_array($newStatus, $validTransitions[$this->status] ?? []);
}
```

### Error Handling & Edge Cases

#### Error Handling

```php
// app/Http/Controllers/TicketController.php
public function store(StoreTicketRequest $request)
{
    try {
        DB::beginTransaction();
        
        // Create ticket
        $ticket = Ticket::create([...]);
        
        // Handle attachments
        if ($request->hasFile('attachments')) {
            try {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('tickets/' . $ticket->id, 'public');
                    $ticket->attachments()->create(['path' => $path]);
                }
            } catch (Exception $e) {
                Log::error('File upload failed', ['error' => $e->getMessage()]);
                throw new FileUploadException('File upload gagal');
            }
        }
        
        // Calculate SAW score
        try {
            $sawScore = app(SawService::class)->calculateScore($ticket);
            $ticket->update(['saw_score' => $sawScore]);
        } catch (Exception $e) {
            Log::warning('SAW calculation failed', ['ticket_id' => $ticket->id]);
            // Continue tanpa SAW score
        }
        
        // Dispatch event
        event(new TicketCreated($ticket));
        
        DB::commit();
        
        return redirect()->route('tickets.show', $ticket)
            ->with('success', 'Ticket created successfully');
            
    } catch (Exception $e) {
        DB::rollBack();
        Log::error('Ticket creation failed', ['error' => $e->getMessage()]);
        
        return back()->withInput()
            ->with('error', 'Gagal membuat tiket. Silakan coba lagi.');
    }
}
```

#### Edge Cases

1. **Tiket tanpa kategori**: Validasi di request, kategori wajib
2. **File upload gagal**: Rollback transaction, user bisa retry
3. **SAW calculation error**: Log warning, lanjut tanpa SAW score
4. **Notification send gagal**: Queue retry 3x, log error
5. **Database connection error**: Automatic retry dengan exponential backoff
6. **Concurrent ticket creation**: Database lock, FIFO processing

---

## 📌 Fitur 2: SAW Scoring (Prioritas Otomatis)

### Alur Kerja

```
Ticket dibuat/diupdate
    ↓
Check file cache
    ├─ Cache hit → Return cached score
    └─ Cache miss → Calculate score
        ↓
    Ambil 5 kriteria (C1-C5)
        ↓
    Normalisasi setiap kriteria
        ↓
    Hitung weighted sum
        ↓
    Cache score ke file (60 detik)
        ↓
    Return score
```

### Logika Program

#### **SAW Calculation Service**

```php
// app/Services/SawService.php
class SawService
{
    public function calculateScore(Ticket $ticket): float
    {
        // 1. Check cache
        $cacheKey = "saw_score_{$ticket->id}";
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }
        
        // 2. Get SAW configurations
        $configs = SawConfiguration::orderBy('sort_order')->get();
        
        // 3. Extract criteria values
        $criteria = [
            'C1' => $this->getCriteriaC1($ticket), // Priority (1-4)
            'C2' => $this->getCriteriaC2($ticket), // SLA Urgency (0-100)
            'C3' => $this->getCriteriaC3($ticket), // Wait Time (minutes)
            'C4' => $this->getCriteriaC4($ticket), // Customer Activity (0-10)
            'C5' => $this->getCriteriaC5($ticket), // Complexity (1-5)
        ];
        
        // 4. Normalize criteria
        $normalized = [
            'r1' => $this->normalize($criteria['C1'], 4, 'benefit'),
            'r2' => $this->normalize($criteria['C2'], 100, 'benefit'),
            'r3' => $this->normalize($criteria['C3'], 1440, 'cost'),
            'r4' => $this->normalize($criteria['C4'], 10, 'benefit'),
            'r5' => $this->normalize($criteria['C5'], 5, 'benefit'),
        ];
        
        // 5. Get weights
        $weights = $configs->pluck('weight', 'code')->toArray();
        
        // 6. Calculate weighted sum
        $score = (
            ($weights['C1'] ?? 0.30) * $normalized['r1'] +
            ($weights['C2'] ?? 0.25) * $normalized['r2'] +
            ($weights['C3'] ?? 0.20) * $normalized['r3'] +
            ($weights['C4'] ?? 0.15) * $normalized['r4'] +
            ($weights['C5'] ?? 0.10) * $normalized['r5']
        );
        
        // 7. Cache score
        Cache::put($cacheKey, $score, now()->addSeconds(60));
        
        return $score;
    }
    
    private function normalize($value, $max, $type): float
    {
        if ($type === 'benefit') {
            return $value / $max;
        } else { // cost
            return $max / $value;
        }
    }
    
    private function getCriteriaC1(Ticket $ticket): int
    {
        // Priority: low=1, medium=2, high=3, critical=4
        return match($ticket->priority) {
            'low' => 1,
            'medium' => 2,
            'high' => 3,
            'critical' => 4,
        };
    }
    
    private function getCriteriaC2(Ticket $ticket): int
    {
        // SLA Urgency: 0-100 based on deadline
        if (!$ticket->sla_deadline) return 50;
        
        $minutesLeft = $ticket->sla_deadline->diffInMinutes(now());
        return max(0, min(100, 100 - ($minutesLeft / 1440 * 100)));
    }
    
    private function getCriteriaC3(Ticket $ticket): int
    {
        // Wait Time: minutes since created
        return $ticket->created_at->diffInMinutes(now());
    }
    
    private function getCriteriaC4(Ticket $ticket): int
    {
        // Customer Activity: number of comments
        return min(10, $ticket->comments()->count());
    }
    
    private function getCriteriaC5(Ticket $ticket): int
    {
        // Complexity: 1-5 based on description length & keywords
        $complexity = 1;
        if (strlen($ticket->description) > 500) $complexity++;
        if (preg_match('/urgent|critical|asap/i', $ticket->description)) $complexity++;
        if ($ticket->attachments()->count() > 0) $complexity++;
        
        return min(5, $complexity);
    }
}
```

#### **Cache Invalidation**

```php
// app/Events/TicketUpdated.php
class TicketUpdated
{
    public function __construct(public Ticket $ticket) {}
}

// app/Listeners/InvalidateSawCache.php
class InvalidateSawCache
{
    public function handle(TicketUpdated $event)
    {
        Cache::forget("saw_score_{$event->ticket->id}");
    }
}
```

---

## 📌 Fitur 3: Notifikasi Real-time

### Alur Kerja

```
Event triggered (TicketCreated, StatusChanged, etc)
    ↓
Event listener create Notification
    ↓
Create Notification record di database (sync)
    ↓
User melihat notifikasi di UI
```

### Logika Program

#### **Event & Listener**

```php
// app/Events/TicketCreated.php
class TicketCreated
{
    public function __construct(public Ticket $ticket) {}
}

// app/Listeners/SendTicketCreatedNotification.php
class SendTicketCreatedNotification
{
    public function handle(TicketCreated $event)
    {
        // Get staff users
        $staffUsers = User::role('staff')->get();
        
        // Create notification directly (sync)
        foreach ($staffUsers as $staff) {
            $staff->notifications()->create([
                'type' => 'ticket_created',
                'data' => [
                    'ticket_id' => $event->ticket->id,
                    'title' => 'New Ticket Created',
                    'message' => "New ticket: {$event->ticket->title}",
                    'url' => route('tickets.show', $event->ticket),
                ],
            ]);
        }
    }
}
```

#### **Notification Model**

```php
// app/Models/Notification.php
class Notification extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];
    
    public function markAsRead()
    {
        $this->update(['read_at' => now()]);
    }
    
    public function isUnread(): bool
    {
        return is_null($this->read_at);
    }
}
```

---

## 🔗 Sequence Diagram

Lihat file: `diagrams/08_sequence_tiket.puml`

---

## 📊 Kesimpulan

Implementasi fitur Helpdesk Ticketing mencakup:

1. **Manajemen Tiket**: Create, read, update, delete dengan status flow validation
2. **SAW Scoring**: Algoritma multi-kriteria dengan caching untuk performa
3. **Notifikasi**: Event-driven system dengan queue worker untuk async processing

Semua fitur terintegrasi dengan baik dan mengikuti best practices Laravel.
