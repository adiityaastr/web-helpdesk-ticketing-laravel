<?php
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);

// Bootstrap Laravel fully
$app->make(\Illuminate\Foundation\Console\Kernel::class)->bootstrap();

echo "Logging in User 2...\n";
auth()->loginUsingId(2);

echo "Dispatching GET /...\n";
$response = $kernel->handle(
    $request = Request::create('/', 'GET')
);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Redirect to: " . $response->headers->get('Location') . "\n";
