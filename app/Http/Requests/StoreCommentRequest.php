<?php

namespace App\Http\Requests;

use App\Constants\FileConstants;
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
            'attachments' => ['nullable', 'array', 'max:' . FileConstants::MAX_FILES_PER_UPLOAD],
            'attachments.*' => ['file', 'mimes:' . FileConstants::ALLOWED_MIME_EXTENSION, 'max:' . FileConstants::MAX_FILE_SIZE_KB],
        ];
    }
}
