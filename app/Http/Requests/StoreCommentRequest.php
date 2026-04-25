<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    /**
     * Otorisasi kebijakan tiket dilakukan di controller (parameter {ticket} sudah terikat).
     * Di sini hanya memastikan pengguna login — memeriksa route('ticket') di sini sering gagal dan memblokir semua komentar (403).
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_internal' => $this->boolean('is_internal'),
        ]);
    }

    public function rules(): array
    {
        return [
            'message' => ['required', 'string'],
            'is_internal' => ['nullable', 'boolean'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'mimes:jpg,jpeg,png,pdf', 'max:2048'],
        ];
    }
}
