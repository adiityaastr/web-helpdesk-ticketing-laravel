<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SawConfiguration extends Model
{
    protected $fillable = [
        'code',
        'name',
        'type',
        'weight',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:4',
            'sort_order' => 'integer',
        ];
    }
}
