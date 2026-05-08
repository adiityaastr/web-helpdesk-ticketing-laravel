<?php

namespace App\Http\Requests;

use App\Constants\FileConstants;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'status' => ['nullable', Rule::in(['open', 'in_progress', 'resolved', 'closed'])],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'attachments' => ['nullable', 'array', 'max:' . FileConstants::MAX_FILES_PER_UPLOAD],
            'attachments.*' => ['file', 'mimes:' . FileConstants::ALLOWED_MIME_EXTENSION, 'max:' . FileConstants::MAX_FILE_SIZE_KB],
        ];
    }
}
