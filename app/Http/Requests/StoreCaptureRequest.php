<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCaptureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $layoutIds = array_column(config('booth.layouts'), 'id');
        $shots = (int) config('booth.shots_required');

        return [
            'layout_id' => ['required', 'string', Rule::in($layoutIds)],
            'photos' => ['required', 'array', "size:{$shots}"],
            'photos.*' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:4096'],
        ];
    }
}
