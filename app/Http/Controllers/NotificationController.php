<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(15)
            ->through(fn ($notification) => [
                'id' => $notification->id,
                'type' => class_basename($notification->type),
                'data' => $notification->data,
                'read_at' => $notification->read_at?->toDateTimeString(),
                'created_at' => $notification->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Request $request): RedirectResponse
    {
        // Use bulk UPDATE query instead of loading all notifications into memory
        $user = $request->user();
        $user->unreadNotifications()->update(['read_at' => now()]);

        // Invalidate the notification count cache
        Cache::forget("user_notif_count_{$user->id}");

        return redirect()->back()->with('success', 'Semua notifikasi telah ditandai sebagai dibaca');
    }
}