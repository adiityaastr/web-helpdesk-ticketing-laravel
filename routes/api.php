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
