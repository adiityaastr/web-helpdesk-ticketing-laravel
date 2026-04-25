<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'assigned_to' => $this->filled('assigned_to') && $this->input('assigned_to') !== '' ? (int) $this->input('assigned_to') : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'status' => ['required', Rule::in(['open', 'in_progress', 'resolved', 'closed', 'cancelled'])],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}