<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? Cache::remember("user_auth_{$user->id}", 300, function () use ($user) {
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
                    ? Cache::remember("user_notif_count_{$user->id}", 60, fn () => $user->unreadNotifications()->count())
                    : 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}