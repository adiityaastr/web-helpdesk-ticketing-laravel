<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SawConfiguration;
use App\Services\SawService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SawController extends Controller
{
    public function index(SawService $saw): Response
    {
        $criteria = SawConfiguration::query()->orderBy('sort_order')->get();

        $ranking = [];
        try {
            $scores = $saw->calculateScores();
            $tickets = \App\Models\Ticket::query()
                ->whereIn('id', array_keys($scores))
                ->with(['category', 'reporter', 'assignee'])
                ->get()
                ->keyBy('id');

            foreach ($scores as $ticketId => $score) {
                $ticket = $tickets->get($ticketId);
                if ($ticket) {
                    $ranking[] = [
                        'id' => $ticket->id,
                        'uuid' => $ticket->uuid,
                        'title' => $ticket->title,
                        'priority' => $ticket->priority,
                        'status' => $ticket->status,
                        'category' => $ticket->category?->name,
                        'reporter' => $ticket->reporter?->name,
                        'assignee' => $ticket->assignee?->name,
                        'saw_score' => $score,
                        'sla_deadline' => $ticket->sla_deadline?->toDateTimeString(),
                        'created_at' => $ticket->created_at?->toDateTimeString(),
                    ];
                }
            }
        } catch (\Exception) {
            $ranking = [];
        }

        return Inertia::render('Admin/Saw/Index', [
            'criteria' => $criteria,
            'ranking' => $ranking,
            'totalWeight' => round($criteria->sum('weight'), 4),
        ]);
    }

    public function updateWeights(Request $request): RedirectResponse
    {
        $weights = $request->validate([
            'weights' => ['required', 'array'],
            'weights.*' => ['required', 'numeric', 'min:0', 'max:1'],
        ])['weights'];

        $total = array_sum($weights);

        if (abs($total - 1.0) > 0.0001) {
            return back()->withErrors(['error' => 'Total bobot harus sama dengan 1. Saat ini: '.round($total, 4)]);
        }

        foreach ($weights as $code => $weight) {
            SawConfiguration::query()->where('code', $code)->update(['weight' => $weight]);
        }

        return back()->with('success', 'Bobot kriteria SAW berhasil diperbarui.');
    }

    public function seed(SawService $saw): RedirectResponse
    {
        $saw->seedDefaults();

        return back()->with('success', 'Data kriteria SAW default berhasil diinisialisasi.');
    }
}
