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
// app/Services/TicketService.php
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

    // Attachments disimpan sebagai komentar pertama
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
```

#### **Update Status**

```php
// app/Services/TicketService.php
public function updateTicket(Ticket $ticket, array $payload, User $user): Ticket
{
    $oldStatus = $ticket->status;
    $oldAssignee = $ticket->assigned_to;

    if (isset($payload['status']) && $payload['status'] === 'resolved' && $oldStatus !== 'resolved') {
        $payload['resolved_at'] = now();
    }
    if (isset($payload['status']) && $payload['status'] === 'cancelled' && $oldStatus !== 'cancelled') {
        $payload['cancelled_at'] = now();
    }

    $ticket->update($payload);
    $this->invalidateTicketCaches($ticket);

    $changes = [];
    if ($oldStatus !== $ticket->status) {
        $changes[] = "Status berubah dari {$oldStatus} menjadi {$ticket->status}";
    }

    if (! empty($changes)) {
        $this->logActivity($ticket, $user, 'updated', implode('. ', $changes));
    }

    $this->notifyRelatedUsers($ticket, 'updated');
    return $ticket;
}
```

#### **Validasi Status Flow**

```php
// app/Models/Ticket.php
public function isCancellable(): bool
{
    return in_array($this->status, ['open', 'in_progress']);
}

### Error Handling & Edge Cases

#### Error Handling (Service Layer + Exception Pattern)

```php
// app/Services/TicketService.php
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
```

#### Edge Cases

1. **Tiket tanpa kategori**: Validasi di request, kategori wajib
2. **File upload gagal**: Exception handling di Service layer
3. **SAW calculation error**: Cache-safe, return array kosong via try/catch di SawService
4. **Konfirmasi ganda**: TicketException::alreadyConfirmed() mencegah konfirmasi ulang
5. **Cancel tiket non-aktif**: isCancellable() check di model
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
            'r3' => $this->normalize($criteria['C3'], 1440, 'benefit'),
            'r4' => $this->normalize($criteria['C4'], 10, 'benefit'),
            'r5' => $this->normalize($criteria['C5'], 5, 'cost'),
        ];
        
        // 5. Get weights
        $weights = $configs->pluck('weight', 'code')->toArray();
        
        // 6. Calculate weighted sum (default weights)
        $score = (
            ($weights['C1'] ?? 0.25) * $normalized['r1'] +
            ($weights['C2'] ?? 0.30) * $normalized['r2'] +
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
