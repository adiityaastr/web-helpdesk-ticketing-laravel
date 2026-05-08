<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Open = 'open';
    case InProgress = 'in_progress';
    case Resolved = 'resolved';
    case Closed = 'closed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::InProgress => 'In Progress',
            self::Resolved => 'Resolved',
            self::Closed => 'Closed',
            self::Cancelled => 'Cancelled',
        };
    }

    public static function options(): array
    {
        return array_map(fn ($case) => $case->value, self::cases());
    }

    public static function adminOptions(): array
    {
        return [
            self::InProgress->value,
            self::Resolved->value,
            self::Closed->value,
            self::Cancelled->value,
        ];
    }

    public static function portalOptions(): array
    {
        return [
            self::Open->value,
            self::InProgress->value,
            self::Resolved->value,
            self::Closed->value,
            self::Cancelled->value,
        ];
    }

    public function isValidTransition(self $target): bool
    {
        return match ($this) {
            self::Open => in_array($target, [self::InProgress, self::Cancelled]),
            self::InProgress => in_array($target, [self::Resolved, self::Cancelled]),
            self::Resolved => in_array($target, [self::Closed, self::InProgress]),
            self::Closed, self::Cancelled => false,
        };
    }
}
