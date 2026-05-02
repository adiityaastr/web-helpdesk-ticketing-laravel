<?php

namespace App\Services;

use App\Models\SawConfiguration;
use App\Models\Ticket;

class SawService
{
    private array $criteria = [];
    private array $weights = [];
    private array $types = [];

    public function __construct()
    {
        $configs = SawConfiguration::query()->orderBy('sort_order')->get();

        foreach ($configs as $config) {
            $this->criteria[] = $config->code;
            $this->weights[$config->code] = (float) $config->weight;
            $this->types[$config->code] = $config->type;
        }
    }

    public function calculateScores(): array
    {
        $tickets = Ticket::query()
            ->with(['category', 'reporter'])
            ->get();

        if ($tickets->isEmpty()) {
            return [];
        }

        $matrix = $this->buildDecisionMatrix($tickets);
        $normalized = $this->normalize($matrix);
        $scores = $this->weightedSum($normalized);

        arsort($scores);

        return $scores;
    }

    private function buildDecisionMatrix($tickets): array
    {
        $matrix = [];

        foreach ($tickets as $ticket) {
            $row = [];
            foreach ($this->criteria as $code) {
                $row[$code] = $this->getCriterionValue($ticket, $code);
            }
            $matrix[$ticket->id] = $row;
        }

        return $matrix;
    }

    private function getCriterionValue(Ticket $ticket, string $code): float
    {
        return match ($code) {
            'C1' => $this->priorityScore($ticket->priority),
            'C2' => $this->slaUrgency($ticket),
            'C3' => $this->waitingTime($ticket),
            'C4' => $this->customerActivity($ticket),
            'C5' => $this->complexity($ticket),
            default => 0,
        };
    }

    private function priorityScore(string $priority): float
    {
        return match ($priority) {
            'critical' => 4.0,
            'high' => 3.0,
            'medium' => 2.0,
            'low' => 1.0,
            default => 1.0,
        };
    }

    private function slaUrgency(Ticket $ticket): float
    {
        if (! $ticket->sla_deadline) {
            return 0;
        }

        $hoursRemaining = now()->diffInHours($ticket->sla_deadline, false);

        if ($hoursRemaining <= 0) {
            return 10;
        }

        return 1 / ($hoursRemaining + 1);
    }

    private function waitingTime(Ticket $ticket): float
    {
        return $ticket->created_at->diffInHours(now());
    }

    private function customerActivity(Ticket $ticket): float
    {
        return (float) Ticket::query()->where('user_id', $ticket->user_id)->count();
    }

    private function complexity(Ticket $ticket): float
    {
        return (float) mb_strlen($ticket->description ?? '');
    }

    private function normalize(array $matrix): array
    {
        $normalized = [];

        foreach ($this->criteria as $code) {
            $values = array_column($matrix, $code);
            $max = max($values) ?: 1;
            $min = min($values) ?: 0;

            foreach ($matrix as $id => $row) {
                if ($this->types[$code] === 'benefit') {
                    $normalized[$id][$code] = $max > 0 ? $row[$code] / $max : 0;
                } else {
                    $normalized[$id][$code] = $row[$code] > 0 ? $min / $row[$code] : 0;
                }
            }
        }

        return $normalized;
    }

    private function weightedSum(array $normalized): array
    {
        $scores = [];

        foreach ($normalized as $id => $row) {
            $score = 0;
            foreach ($this->criteria as $code) {
                $score += $row[$code] * $this->weights[$code];
            }
            $scores[$id] = round($score, 4);
        }

        return $scores;
    }

    public function seedDefaults(): void
    {
        $defaults = [
            ['code' => 'C1', 'name' => 'Tingkat Prioritas', 'type' => 'benefit', 'weight' => 0.25, 'sort_order' => 1],
            ['code' => 'C2', 'name' => 'Urgensi SLA', 'type' => 'benefit', 'weight' => 0.30, 'sort_order' => 2],
            ['code' => 'C3', 'name' => 'Waktu Tunggu', 'type' => 'benefit', 'weight' => 0.20, 'sort_order' => 3],
            ['code' => 'C4', 'name' => 'Aktivitas Pelanggan', 'type' => 'benefit', 'weight' => 0.15, 'sort_order' => 4],
            ['code' => 'C5', 'name' => 'Kompleksitas', 'type' => 'cost', 'weight' => 0.10, 'sort_order' => 5],
        ];

        foreach ($defaults as $default) {
            SawConfiguration::query()->firstOrCreate(
                ['code' => $default['code']],
                $default
            );
        }
    }
}
