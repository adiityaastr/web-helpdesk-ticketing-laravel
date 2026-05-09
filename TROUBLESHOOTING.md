# Web Helpdesk Ticketing System - Troubleshooting & Best Practices

## 🔧 Troubleshooting & Best Practices Guide

---

## Table of Contents

1. [Common Issues & Solutions](#common-issues--solutions)
2. [Performance Optimization](#performance-optimization)
3. [Security Best Practices](#security-best-practices)
4. [Database Optimization](#database-optimization)
5. [API Best Practices](#api-best-practices)
6. [Frontend Best Practices](#frontend-best-practices)
7. [DevOps Best Practices](#devops-best-practices)
8. [Monitoring & Alerting](#monitoring--alerting)

---

## Common Issues & Solutions

### Issue 1: High Memory Usage

**Symptoms:**
- Application crashes with "Out of memory" error
- Server becomes unresponsive
- Queue worker stops processing

**Solutions:**

```bash
# 1. Check current memory usage
free -h
ps aux --sort=-%mem | head -20

# 2. Increase PHP memory limit
sudo nano /etc/php/8.3/fpm/php.ini
# Change: memory_limit = 512M (or higher)

# 3. Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Clear cache
php artisan cache:clear

# 5. Restart PHP-FPM
sudo systemctl restart php8.3-fpm

# 6. Monitor memory in real-time
watch -n 1 free -h
```

**Prevention:**
- Set appropriate memory limits in `.env`
- Use pagination for large datasets
- Implement lazy loading
- Monitor memory usage regularly

---

### Issue 2: Database Connection Timeout

**Symptoms:**
- "SQLSTATE[HY000]: General error: 2006 MySQL has gone away"
- Intermittent database errors
- Slow query execution

**Solutions:**

```bash
# 1. Check MySQL status
sudo systemctl status mysql
sudo systemctl restart mysql

# 2. Check connection pool
mysql -u helpdesk -p -h localhost -e "SHOW PROCESSLIST;"

# 3. Increase connection timeout in .env
DB_TIMEOUT=60

# 4. Check MySQL max connections
mysql -u root -p -e "SHOW VARIABLES LIKE 'max_connections';"

# 5. Increase if needed
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Add: max_connections = 1000

# 6. Restart MySQL
sudo systemctl restart mysql

# 7. Test connection
php artisan tinker
>>> DB::connection()->getPdo();
```

**Prevention:**
- Use connection pooling
- Set appropriate timeouts
- Monitor connection count
- Implement retry logic

---

### Issue 3: Queue Jobs Not Processing

**Symptoms:**
- Jobs stuck in queue
- Notifications not sent
- Background tasks not running

**Solutions:**

```bash
# 1. Check Redis connection
redis-cli ping

# 2. Check failed jobs
php artisan queue:failed

# 3. View queue status
php artisan queue:work --verbose

# 4. Retry failed jobs
php artisan queue:retry all

# 5. Check queue worker process
ps aux | grep "queue:work"

# 6. Restart queue worker
sudo systemctl restart helpdesk-queue

# 7. Check logs
tail -f storage/logs/laravel.log

# 8. Clear failed jobs
php artisan queue:flush
```

**Prevention:**
- Monitor queue regularly
- Set up alerts for failed jobs
- Use supervisor for process management
- Implement proper error handling

---

### Issue 4: Slow API Response

**Symptoms:**
- API endpoints take >1 second to respond
- High CPU usage
- Timeout errors

**Solutions:**

```bash
# 1. Enable query logging
# In .env: DB_LOG_QUERIES=true

# 2. Check slow queries
php artisan tinker
>>> DB::enableQueryLog();
>>> // Run your query
>>> dd(DB::getQueryLog());

# 3. Add database indexes
php artisan make:migration add_indexes_to_tickets_table

# 4. Optimize queries
// Bad
$tickets = Ticket::all();
foreach ($tickets as $ticket) {
    echo $ticket->user->name;
}

// Good
$tickets = Ticket::with('user')->get();
foreach ($tickets as $ticket) {
    echo $ticket->user->name;
}

# 5. Use caching
$tickets = Cache::remember('tickets', 300, function () {
    return Ticket::with('user')->get();
});

# 6. Profile application
php artisan tinker
>>> \Debugbar::enable();

# 7. Check Nginx configuration
sudo nano /etc/nginx/nginx.conf
# Increase: worker_processes auto;
# Increase: worker_connections 2048;
```

**Prevention:**
- Use eager loading (with())
- Implement caching
- Add database indexes
- Monitor query performance
- Use pagination

---

### Issue 5: File Upload Failures

**Symptoms:**
- "File upload failed" error
- Files not appearing in storage
- Permission denied errors

**Solutions:**

```bash
# 1. Check storage permissions
ls -la storage/app/public/

# 2. Fix permissions
sudo chown -R www-data:www-data storage/
sudo chmod -R 775 storage/

# 3. Check disk space
df -h

# 4. Verify storage link
php artisan storage:link

# 5. Check upload limits in php.ini
sudo nano /etc/php/8.3/fpm/php.ini
# Set: upload_max_filesize = 50M
# Set: post_max_size = 50M

# 6. Restart PHP-FPM
sudo systemctl restart php8.3-fpm

# 7. Test file upload
php artisan tinker
>>> Storage::disk('public')->put('test.txt', 'test');
>>> Storage::disk('public')->exists('test.txt');
```

**Prevention:**
- Set appropriate file size limits
- Validate file types
- Monitor disk space
- Implement cleanup jobs

---

### Issue 6: Authentication Issues

**Symptoms:**
- "Unauthenticated" errors
- Session expires unexpectedly
- Token validation fails

**Solutions:**

```bash
# 1. Check session configuration
php artisan config:show session

# 2. Clear sessions
php artisan session:table
php artisan migrate
php artisan cache:clear

# 3. Check Sanctum configuration
php artisan config:show sanctum

# 4. Verify token in database
php artisan tinker
>>> DB::table('personal_access_tokens')->get();

# 5. Regenerate tokens
>>> DB::table('personal_access_tokens')->truncate();

# 6. Check CORS configuration
php artisan config:show cors

# 7. Test authentication
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Prevention:**
- Set appropriate session lifetime
- Implement token refresh
- Monitor authentication logs
- Use HTTPS in production

---

## Performance Optimization

### 1. Database Optimization

```php
// Add indexes to frequently queried columns
Schema::table('tickets', function (Blueprint $table) {
    $table->index('status');
    $table->index('priority');
    $table->index('category_id');
    $table->index('assigned_to');
    $table->index('created_at');
});

// Use eager loading
$tickets = Ticket::with(['user', 'category', 'comments'])->get();

// Use select to limit columns
$tickets = Ticket::select('id', 'title', 'status')->get();

// Use pagination
$tickets = Ticket::paginate(15);

// Use chunking for large datasets
Ticket::chunk(100, function ($tickets) {
    foreach ($tickets as $ticket) {
        // Process ticket
    }
});
```

### 2. Caching Optimization

```php
// Cache frequently accessed data
$categories = Cache::remember('categories', 3600, function () {
    return Category::all();
});

// Cache with tags
Cache::tags(['tickets'])->put('ticket_1', $ticket, 3600);
Cache::tags(['tickets'])->flush();

// Use cache invalidation
Cache::forget('categories');

// Implement cache warming
php artisan cache:warm
```

### 3. Query Optimization

```php
// Use raw queries for complex operations
$tickets = DB::select('
    SELECT t.*, COUNT(c.id) as comment_count
    FROM tickets t
    LEFT JOIN comments c ON t.id = c.ticket_id
    GROUP BY t.id
');

// Use database views
DB::statement('CREATE VIEW ticket_stats AS ...');

// Use indexes
DB::statement('CREATE INDEX idx_status ON tickets(status)');
```

### 4. Frontend Optimization

```javascript
// Lazy load components
const TicketList = lazy(() => import('./TicketList'));

// Implement pagination
const [page, setPage] = useState(1);
const { data } = useFetch(`/api/v1/tickets?page=${page}`);

// Use memoization
const MemoizedTicket = memo(Ticket);

// Implement virtual scrolling for large lists
import { FixedSizeList } from 'react-window';
```

### 5. Asset Optimization

```bash
# Minify CSS and JavaScript
npm run build

# Compress images
npx imagemin src/images/* --out-dir=public/images

# Use CDN for static assets
# Configure in .env
CDN_URL=https://cdn.example.com

# Enable gzip compression in Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## Security Best Practices

### 1. Authentication Security

```php
// Use strong password hashing
Hash::make($password); // Uses bcrypt by default

// Implement rate limiting
Route::post('/login', 'AuthController@login')->middleware('throttle:5,1');

// Use HTTPS only
'secure' => env('APP_ENV') === 'production',

// Implement CSRF protection
@csrf

// Use secure session cookies
'secure' => true,
'http_only' => true,
'same_site' => 'strict',
```

### 2. Authorization Security

```php
// Use policies for authorization
$this->authorize('update', $ticket);

// Use middleware for role checking
Route::middleware('role:staff')->group(function () {
    // Admin routes
});

// Implement permission checking
if (auth()->user()->can('delete', $ticket)) {
    // Delete ticket
}
```

### 3. Input Validation

```php
// Validate all user input
$validated = $request->validate([
    'title' => 'required|string|max:255',
    'description' => 'required|string',
    'category_id' => 'required|exists:categories,id',
    'attachments' => 'array|max:5',
    'attachments.*' => 'file|max:2048|mimes:jpg,png,pdf',
]);

// Use custom validation rules
Validator::extend('valid_ticket_status', function ($attribute, $value) {
    return in_array($value, ['open', 'in_progress', 'resolved', 'closed']);
});
```

### 4. SQL Injection Prevention

```php
// Use parameterized queries (Eloquent)
$tickets = Ticket::where('status', $status)->get();

// Use query builder
$tickets = DB::table('tickets')
    ->where('status', '=', $status)
    ->get();

// Avoid raw queries
// Bad
DB::select("SELECT * FROM tickets WHERE status = '$status'");

// Good
DB::select('SELECT * FROM tickets WHERE status = ?', [$status]);
```

### 5. XSS Prevention

```php
// Escape output
{{ $ticket->title }}

// Use blade escaping
{!! $ticket->description !!} // Only for trusted content

// Sanitize user input
$description = Purifier::clean($request->description);
```

### 6. CSRF Protection

```php
// Include CSRF token in forms
<form method="POST" action="/tickets">
    @csrf
    <!-- form fields -->
</form>

// Include in API requests
headers: {
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
}
```

### 7. Environment Security

```env
# Never commit sensitive data
APP_KEY=base64:xxxxx
DB_PASSWORD=strong_password
REDIS_PASSWORD=redis_password

# Use .env.example for template
# Add .env to .gitignore

# Rotate secrets regularly
php artisan key:generate
```

---

## Database Optimization

### 1. Indexing Strategy

```php
// Create indexes for frequently queried columns
Schema::table('tickets', function (Blueprint $table) {
    $table->index('status');
    $table->index('priority');
    $table->index(['category_id', 'status']);
    $table->fullText('title', 'description');
});

// Check existing indexes
php artisan tinker
>>> DB::select("SHOW INDEXES FROM tickets");
```

### 2. Query Optimization

```php
// Use EXPLAIN to analyze queries
DB::enableQueryLog();
$tickets = Ticket::with('user', 'category')->get();
dd(DB::getQueryLog());

// Optimize N+1 queries
// Bad
$tickets = Ticket::all();
foreach ($tickets as $ticket) {
    echo $ticket->user->name; // N+1 query
}

// Good
$tickets = Ticket::with('user')->get();
foreach ($tickets as $ticket) {
    echo $ticket->user->name; // No additional queries
}
```

### 3. Partitioning Strategy

```php
// Partition large tables by date
ALTER TABLE tickets PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027)
);
```

### 4. Archiving Strategy

```php
// Archive old tickets
php artisan make:command ArchiveOldTickets

// In command
Ticket::where('status', 'closed')
    ->where('updated_at', '<', now()->subMonths(6))
    ->delete();
```

---

## API Best Practices

### 1. Versioning

```php
// Use API versioning
Route::prefix('api/v1')->group(function () {
    Route::apiResource('tickets', TicketController::class);
});

// Support multiple versions
Route::prefix('api/v2')->group(function () {
    Route::apiResource('tickets', TicketControllerV2::class);
});
```

### 2. Rate Limiting

```php
// Implement rate limiting
Route::middleware('throttle:60,1')->group(function () {
    Route::apiResource('tickets', TicketController::class);
});

// Custom rate limiting
Route::middleware('throttle:auth_limit')->group(function () {
    Route::post('/login', 'AuthController@login');
});
```

### 3. Pagination

```php
// Always paginate large datasets
$tickets = Ticket::paginate(15);

// Include pagination metadata
return response()->json([
    'data' => $tickets->items(),
    'meta' => [
        'current_page' => $tickets->currentPage(),
        'total' => $tickets->total(),
        'per_page' => $tickets->perPage(),
    ]
]);
```

### 4. Error Handling

```php
// Consistent error responses
try {
    $ticket = Ticket::findOrFail($id);
} catch (ModelNotFoundException $e) {
    return response()->json([
        'message' => 'Ticket not found',
        'status' => 404
    ], 404);
}

// Use exception handler
app(ExceptionHandler::class)->render($request, $exception);
```

### 5. Documentation

```php
// Use OpenAPI/Swagger
/**
 * @OA\Get(
 *     path="/api/v1/tickets",
 *     summary="List tickets",
 *     @OA\Response(response=200, description="Success")
 * )
 */
public function index()
{
    // Implementation
}
```

---

## Frontend Best Practices

### 1. Component Organization

```javascript
// Organize components by feature
src/
├── components/
│   ├── Tickets/
│   │   ├── TicketList.jsx
│   │   ├── TicketForm.jsx
│   │   └── TicketDetail.jsx
│   ├── Comments/
│   │   ├── CommentList.jsx
│   │   └── CommentForm.jsx
│   └── Common/
│       ├── Header.jsx
│       └── Footer.jsx
```

### 2. State Management

```javascript
// Use React Context for global state
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    
    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// Use hooks for local state
const [tickets, setTickets] = useState([]);
const [loading, setLoading] = useState(false);
```

### 3. Performance

```javascript
// Use React.memo for expensive components
const TicketCard = memo(({ ticket }) => {
    return <div>{ticket.title}</div>;
});

// Use useMemo for expensive calculations
const sortedTickets = useMemo(() => {
    return tickets.sort((a, b) => b.priority - a.priority);
}, [tickets]);

// Use useCallback for stable function references
const handleDelete = useCallback((id) => {
    deleteTicket(id);
}, []);
```

### 4. Error Handling

```javascript
// Implement error boundaries
class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        console.error(error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong</h1>;
        }
        return this.props.children;
    }
}

// Handle API errors
try {
    const response = await fetch('/api/v1/tickets');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
} catch (error) {
    console.error('Error:', error);
}
```

---

## DevOps Best Practices

### 1. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run tests
        run: |
          composer install
          php artisan test
      
      - name: Deploy to production
        run: |
          # Deployment commands
```

### 2. Docker Best Practices

```dockerfile
# Use specific versions
FROM php:8.3-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    mysql-client \
    redis

# Copy application
COPY . /var/www/html

# Set working directory
WORKDIR /var/www/html

# Run as non-root user
USER www-data
```

### 3. Logging

```php
// Use structured logging
Log::info('Ticket created', [
    'ticket_id' => $ticket->id,
    'user_id' => auth()->id(),
    'category' => $ticket->category_id,
]);

// Use log levels appropriately
Log::debug('Debug information');
Log::info('Informational message');
Log::warning('Warning message');
Log::error('Error message');
Log::critical('Critical error');
```

### 4. Monitoring

```bash
# Monitor application health
curl http://localhost:8000/health

# Monitor database
mysqladmin -u root -p status

# Monitor Redis
redis-cli info

# Monitor system resources
htop
```

---

## Monitoring & Alerting

### 1. Application Monitoring

```php
// Track important metrics
Event::listen(TicketCreated::class, function ($event) {
    Metrics::increment('tickets.created');
});

// Monitor API response times
middleware('log.response.time');

// Track error rates
Log::error('API Error', ['endpoint' => $request->path()]);
```

### 2. Alert Configuration

```yaml
# alerts.yml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    action: notify_team
    
  - name: DatabaseDown
    condition: db_connection_failed
    action: page_oncall
    
  - name: HighMemoryUsage
    condition: memory_usage > 80%
    action: notify_devops
```

### 3. Health Checks

```php
// Create health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'database' => DB::connection()->getPdo() ? 'ok' : 'error',
        'redis' => Redis::ping() ? 'ok' : 'error',
        'timestamp' => now(),
    ]);
});
```

---

## Checklist for Production

- [ ] Enable HTTPS/SSL
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Configure proper logging
- [ ] Set up database backups
- [ ] Configure queue worker
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Enable caching
- [ ] Optimize database indexes
- [ ] Set up CDN for static assets
- [ ] Configure email service
- [ ] Set up error tracking
- [ ] Configure log rotation
- [ ] Test disaster recovery

---

**Last Updated**: 2026-05-09
**Version**: 1.0.0
