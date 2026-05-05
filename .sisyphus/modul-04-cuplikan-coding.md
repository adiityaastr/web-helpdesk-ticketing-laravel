## DAFTAR ISI

5. [BAB 5: Cuplikan Coding](#bab-5-cuplikan-coding)
   - 5.1 Service Layer — TicketService::createTicket()
   - 5.2 SAW Algorithm — calculateScores()
   - 5.3 Middleware — HandleInertiaRequests::share()
   - 5.4 Controller — Portal/TicketController
   - 5.5 React Component — Icon.tsx
   - 5.6 React Component — AppShell.tsx
   - 5.7 API Controller

---
## BAB 5: CUPLIKAN CODING

### 5.1 Service Layer — TicketService::createTicket()

**File:** `app/Services/TicketService.php:19-58`

```php
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

    $ticket->activityLogs()->create([
        'user_id' => $user->id,
        'action' => 'created',
        'description' => 'Tiket dibuat oleh pelapor.',
    ]);

    $this->notifyRelatedUsers($ticket, 'created');

    Cache::forget("portal_dashboard_stats_{$user->id}");
    Cache::forget('admin_dashboard_stats');
    Cache::forget('admin_dashboard_charts');
    (new SawService())->invalidateCache();

    return $ticket;
}
```

**Analisis Kode:**
- **Attachment Handling:** File diupload satu per satu menggunakan `store()` ke disk `public` (baris 24-26).
- **Status Default:** Tiket selalu dibuat dengan status `'open'` (baris 36).
- **Komentar Awal:** Sistem otomatis membuat komentar "Tiket berhasil dibuat." (baris 38-43).
- **Activity Log:** Setiap aksi dicatat untuk audit trail (baris 45-49).
- **Notifikasi:** Semua staff + reporter diberi notifikasi melalui `notifyRelatedUsers()` (baris 51).
- **Cache Invalidation:** 4 cache keys dihapus untuk memastikan data dashboard selalu segar (baris 53-56).

### 5.2 SAW Algorithm — calculateScores()

**File:** `app/Services/SawService.php:27-49`

```php
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
```

**Normalisasi (baris 119-138):**

```php
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
```

**Weighted Sum (baris 140-153):**

```php
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
```

**Calculasi Nilai Kriteria (baris 66-76):**

```php
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
```

### 5.3 Middleware — HandleInertiaRequests::share()

**File:** `app/Http/Middleware/HandleInertiaRequests.php:18-50`

```php
public function share(Request $request): array
{
    $user = $request->user();

    return [
        ...parent::share($request),
        'auth' => [
            'user' => $user ? Cache::remember("user_auth_{$user->id}", 3600, function () use ($user) {
                $user->loadMissing('roles');
                $roles = $user->roles->pluck('name')->values()->all();
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'department' => $user->department,
                    'roles' => $roles,
                    'is_staff' => in_array('staff', $roles),
                    'is_customer' => in_array('customer', $roles),
                ];
            }) : null,
        ],
        'notifications' => [
            'unread_count' => fn () => $user
                ? Cache::remember("user_notif_count_{$user->id}", 300, fn () => $user->unreadNotifications()->count())
                : 0,
        ],
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error' => fn () => $request->session()->get('error'),
        ],
    ];
}
```

**Analisis Kode:**
- **Auth Data Sharing:** Data user (termasuk role) di-share ke setiap halaman Inertia. Data di-cache per user selama 3600 detik (1 jam) dengan eager loading `roles` relasi.
- **Lazy Evaluation:** `unread_count` dan `flash` menggunakan closure (`fn () => ...`) sehingga hanya dievaluasi ketika benar-benar diakses di frontend, bukan pada setiap request.
- **Role Flags:** `is_staff` dan `is_customer` dihitung dari array roles untuk memudahkan conditional rendering di React components.

### 5.4 Controller — Portal/TicketController (store & comment)

**File:** `app/Http/Controllers/Portal/TicketController.php:53-58`

```php
public function store(StoreTicketRequest $request): RedirectResponse
{
    $ticket = $this->ticketService->createTicket($request, $request->user());
    $this->notificationService->notifyTicketUpdate($ticket, 'created', null, true);
    return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Tiket berhasil dibuat.');
}
```

**Analisis:**
- Controller sangat tipis (hanya 5 baris). Semua logika bisnis di-delegasikan ke `TicketService`.
- `StoreTicketRequest` menangani validasi input (authorization + validation rules).
- Notifikasi ditrigger melalui `NotificationService` dengan parameter `notifyAllStaff = true`.
- Response menggunakan Inertia redirect dengan flash message.

**File:** `app/Http/Controllers/Portal/TicketController.php:127-144`

```php
public function comment(StoreCommentRequest $request, Ticket $ticket): RedirectResponse
{
    $this->authorize('comment', $ticket);
    if ($this->commentService->isCommentLocked($ticket)) {
        return redirect()->route('portal.tickets.show', $ticket)->withErrors(['error' => 'Kolom komentar ditutup — tiket sudah selesai.']);
    }

    $comment = $this->commentService->addCommentWithAttachments(
        $ticket,
        $request->user(),
        $request->string('message')->toString(),
        false,
        $request->file('attachments', [])
    );
    $this->notificationService->notifyTicketUpdate($ticket, 'commented', $comment, false);

    return redirect()->route('portal.tickets.show', $ticket)->with('success', 'Komentar berhasil ditambahkan.');
}
```

**Analisis:**
- Policy check `$this->authorize('comment', $ticket)` memastikan user memiliki hak untuk berkomentar.
- Lock check: jika tiket berstatus `closed` atau `cancelled`, komentar ditolak.
- Attachment diupload via `CommentService`.
- Notifikasi dikirim (tanpa notifyAllStaff, hanya reporter dan assignee).

### 5.5 React Component — Icon.tsx

**File:** `resources/js/Components/Icon.tsx` (20 lines)

```tsx
type IconProps = {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
};

export default function Icon({ name, size = 20, filled = false, className }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ''}`}
      style={{
        fontSize: `${size}px`,
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
      }}
    >
      {name}
    </span>
  );
}
```

**Analisis:**
- Komponen shared yang digunakan di seluruh aplikasi untuk menampilkan Material Symbols icons.
- Mendukung properti `size` (default 20px), `filled` (untuk filled variant), dan `className` untuk styling tambahan.
- Menggunakan CSS class `material-symbols-outlined` dari Google Material Symbols.
- Font variation `'FILL' 1` digunakan untuk mengaktifkan filled style pada ikon.

### 5.6 React Component — AppShell.tsx

**File:** `resources/js/Components/AppShell.tsx:40-156` (seluruh file)

**Struktur Komponen:**

```tsx
export type NavItem = {
    href: string;
    label: string;
    icon: string;
    active: boolean;
};

export type AppShellProps = {
    navItems: NavItem[];
    actions?: React.ReactNode;
    user: { name: string; email: string };
    unreadCount: number;
    children: React.ReactNode;
    variant: 'admin' | 'portal';
};

const variantStyles = {
    admin: {
        navActive: 'bg-teal-600 text-white',
        navInactive: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        iconActive: 'text-white',
        iconInactive: 'text-slate-400',
        avatar: 'bg-slate-200 text-slate-700',
        searchPlaceholder: 'Cari...',
    },
    portal: {
        navActive: 'border-r-4 border-teal-600 bg-teal-50 text-teal-700',
        navInactive: 'text-slate-600 hover:bg-slate-50',
        iconActive: 'text-teal-600',
        iconInactive: 'text-slate-400',
        avatar: 'bg-teal-100 text-teal-700',
        searchPlaceholder: 'Cari tiket atau solusi...',
    },
} as const;
```

**Fitur Utama AppShell:**
1. **Responsive Sidebar:** Sidebar 72 kolom (288px) yang dapat di-toggle pada layar mobile (default hidden, tombol menu untuk menampilkan, overlay backdrop untuk menutup).
2. **Two Variants:** `admin` dan `portal` dengan styling yang berbeda — admin menggunakan teal pada background, portal menggunakan teal pada border.
3. **Navigation Items:** Array `NavItem[]` dengan support active state dan ikon Material Symbols.
4. **User Section:** Menampilkan inisial user, nama, dan tombol logout.
5. **Notification Badge:** Counter notifikasi di header dengan badge merah (`bg-rose-600`).
6. **Search Bar:** Placeholder berbeda untuk admin ("Cari...") dan portal ("Cari tiket atau solusi...").
7. **Actions Slot:** Area fleksibel di sidebar untuk konten tambahan (misalnya filter atau quick action buttons).

### 5.7 API Controller — Api/TicketController

**File:** `app/Http/Controllers/Api/TicketController.php:15-40` (method `index`)

```php
public function index(Request $request): JsonResponse
{
    $user = $request->user();

    $tickets = Ticket::query()
        ->where('user_id', $user->id)
        ->with(['category', 'assignee'])
        ->when($request->string('status')->isNotEmpty(), fn ($q) => $q->where('status', $request->string('status')))
        ->when($request->string('priority')->isNotEmpty(), fn ($q) => $q->where('priority', $request->string('priority')))
        ->when($request->string('search')->isNotEmpty(), fn ($q) => $q->where(function ($q) use ($request) {
            $search = addcslashes($request->string('search')->toString(), '%_');
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }))
        ->latest()
        ->paginate(10);

    return response()->json([
        'data' => TicketResource::collection($tickets),
        'meta' => [
            'current_page' => $tickets->currentPage(),
            'last_page' => $tickets->lastPage(),
            'total' => $tickets->total(),
        ],
    ]);
}
```

**Analisis:**
- API controller menggunakan pattern yang mirip dengan web controller, tetapi mengembalikan JSON response.
- Menggunakan `TicketResource` untuk format response yang konsisten.
- Response menyertakan metadata pagination (`current_page`, `last_page`, `total`).
- Filter search menggunakan `LIKE` dengan escape karakter khusus.
- Semua endpoint API menggunakan route model binding untuk otomatis resolve model Ticket.

**Method `store` (baris 42-82):**

```php
public function store(Request $request): JsonResponse
{
    $request->validate([
        'category_id' => ['required', 'exists:categories,id'],
        'title' => ['required', 'string', 'max:255'],
        'description' => ['required', 'string'],
        'priority' => ['required', 'in:low,medium,high,critical'],
        'attachments' => ['nullable', 'array'],
        'attachments.*' => ['file', 'max:10240'],
    ]);

    // ... (upload attachments, create ticket, create auto-comment)

    return response()->json([
        'message' => 'Tiket berhasil dibuat.',
        'data' => new TicketResource($ticket),
    ], 201);
}
```

---

