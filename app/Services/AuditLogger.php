<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuditLogger
{
    public static function ticket(string $action, string $ticketId, ?User $user = null, ?array $context = []): void
    {
        Log::channel('audit')->info($action, array_merge([
            'ticket_id' => $ticketId,
            'user_id' => $user?->id,
            'user_name' => $user?->name,
        ], $context));
    }

    public static function auth(string $action, ?User $user = null): void
    {
        Log::channel('audit')->info($action, [
            'user_id' => $user?->id,
            'user_name' => $user?->name,
        ]);
    }

    public static function admin(string $action, string $resource, ?User $user = null): void
    {
        Log::channel('audit')->info($action, [
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'resource' => $resource,
        ]);
    }

    public static function error(string $message, ?\Throwable $exception = null, ?array $context = []): void
    {
        Log::channel('audit')->error($message, array_merge([
            'exception' => $exception?->getMessage(),
            'file' => $exception?->getFile(),
            'line' => $exception?->getLine(),
        ], $context));
    }
}
