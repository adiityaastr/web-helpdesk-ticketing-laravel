<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (App\Models\User::all() as $user) {
    echo $user->id . ': ' . $user->name . ' (' . $user->email . ') - Roles: ' . implode(', ', $user->roles->pluck('name')->toArray()) . "\n";
}
