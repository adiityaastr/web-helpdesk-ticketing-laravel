<?php

namespace App\Policies;

use App\Models\KnowledgeBase;
use App\Models\User;

class KnowledgeBasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isStaff();
    }

    public function view(User $user, KnowledgeBase $knowledgeBase): bool
    {
        return $user->isStaff();
    }

    public function create(User $user): bool
    {
        return $user->isStaff();
    }

    public function update(User $user, KnowledgeBase $knowledgeBase): bool
    {
        return $user->isStaff() && $user->id === $knowledgeBase->author_id;
    }

    public function delete(User $user, KnowledgeBase $knowledgeBase): bool
    {
        return $user->isStaff() && $user->id === $knowledgeBase->author_id;
    }
}
