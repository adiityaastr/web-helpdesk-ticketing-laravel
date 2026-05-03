<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Department extends Model
{
    protected $fillable = ['name', 'slug'];

    protected static function booted(): void
    {
        static::creating(function (Department $department) {
            $department->slug = Str::slug($department->name);
        });

        static::updating(function (Department $department) {
            $department->slug = Str::slug($department->name);
        });
    }
}
