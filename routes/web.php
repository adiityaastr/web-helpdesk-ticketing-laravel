<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\KnowledgeBaseController as AdminKnowledgeBaseController;
use App\Http\Controllers\Admin\TemplateController;
use App\Http\Controllers\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Portal\DashboardController as PortalDashboardController;
use App\Http\Controllers\Portal\KnowledgeBaseController as PortalKnowledgeBaseController;
use App\Http\Controllers\Portal\TicketController as PortalTicketController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect()->route('login'));

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/login', [AuthController::class, 'authenticate']);
    Route::get('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/register', [AuthController::class, 'storeRegistration']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware(['auth', 'role:customer'])->prefix('portal')->name('portal.')->group(function (): void {
    Route::get('/dashboard', [PortalDashboardController::class, 'index'])->name('dashboard');
    Route::get('/tickets', [PortalTicketController::class, 'index'])->name('tickets.index');
    Route::get('/tickets/create', [PortalTicketController::class, 'create'])->name('tickets.create');
    Route::post('/tickets', [PortalTicketController::class, 'store'])->name('tickets.store');
    Route::get('/tickets/{ticket}', [PortalTicketController::class, 'show'])->name('tickets.show');
    Route::post('/tickets/{ticket}/comments', [PortalTicketController::class, 'comment'])->name('tickets.comment');
    Route::post('/tickets/{ticket}/rate', [PortalTicketController::class, 'rate'])->name('tickets.rate');
    Route::get('/knowledge-base', [PortalKnowledgeBaseController::class, 'index'])->name('knowledge-base');
    Route::get('/knowledge-base/{knowledgeBase}', [PortalKnowledgeBaseController::class, 'show'])->name('knowledge-base.show');
});

Route::middleware(['auth', 'role:staff|admin'])->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/tickets', [AdminTicketController::class, 'index'])->name('tickets.index');
    Route::get('/tickets/{ticket}', [AdminTicketController::class, 'show'])->name('tickets.show');
    Route::put('/tickets/{ticket}', [AdminTicketController::class, 'update'])->name('tickets.update');
    Route::delete('/tickets/{ticket}', [AdminTicketController::class, 'destroy'])->name('tickets.destroy');
    Route::post('/tickets/{ticket}/comments', [AdminTicketController::class, 'comment'])->name('tickets.comment');
    Route::resource('users', UserController::class)->except(['create', 'edit', 'show']);
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    Route::resource('knowledge-base', AdminKnowledgeBaseController::class)->except(['create', 'edit', 'show']);
    Route::resource('templates', TemplateController::class)->except(['create', 'edit', 'show']);
});

Route::middleware('auth')->group(function (): void {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAsRead'])->name('notifications.read-all');
});