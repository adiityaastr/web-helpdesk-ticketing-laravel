<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Ticket extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'category_id',
        'title',
        'description',
        'priority',
        'status',
        'assigned_to',
        'sla_deadline',
        'resolved_at',
        'cancelled_at',
        'rating',
        'rating_comment',
    ];

    protected function casts(): array
    {
        return [
            'sla_deadline' => 'datetime',
            'resolved_at' => 'datetime',
            'cancelled_at' => 'datetime',
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

    public function internalComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('is_internal', true);
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

        return now()->diffInHours($this->sla_deadline, false) <= 4 && now()->diffInHours($this->sla_deadline, false) > 0;
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, ['open', 'in_progress']);
    }
}
