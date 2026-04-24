<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'status' => $this->status,
            'sla_deadline' => $this->sla_deadline?->toDateTimeString(),
            'resolved_at' => $this->resolved_at?->toDateTimeString(),
            'rating' => $this->rating,
            'rating_comment' => $this->rating_comment,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'is_overdue' => $this->isOverdue(),
            'is_sla_warning' => $this->isSlaWarning(),
            'category' => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
            ],
            'reporter' => [
                'id' => $this->reporter?->id,
                'name' => $this->reporter?->name,
                'department' => $this->reporter?->department,
            ],
            'assignee' => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null,
        ];
    }
}