<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class ForceRequestUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        URL::forceRootUrl($request->root());

        if ($request->isSecure()) {
            URL::forceScheme('https');
        }

        return $next($request);
    }
}