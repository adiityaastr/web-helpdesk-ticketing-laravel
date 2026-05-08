<?php

namespace App\Constants;

class FileConstants
{
    public const MAX_FILE_SIZE_KB = 2048;
    public const MAX_FILE_SIZE_BYTES = self::MAX_FILE_SIZE_KB * 1024;
    public const MAX_FILES_PER_UPLOAD = 5;

    public const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];
    public const ALLOWED_MIME_EXTENSION = 'jpg,jpeg,png,pdf';
}
