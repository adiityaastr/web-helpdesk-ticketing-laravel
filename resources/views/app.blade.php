<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name', 'Helpdesk Ticketing') }}</title>
        <link rel="stylesheet" href="{{ asset('fonts/material-symbols-subset.css') }}">
        <style>
            .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            #nprogress .bar { background: #0d9488 !important; height: 3px !important; }
            #nprogress .peg { box-shadow: 0 0 8px #0d9488, 0 0 4px #0d9488 !important; }
        </style>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="antialiased bg-slate-50">
        @inertia
    </body>
</html>
