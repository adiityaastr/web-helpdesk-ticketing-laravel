<?php

namespace App\Exceptions;

class TicketException extends \Exception
{
    public static function notResolved(): self
    {
        return new self('Tiket harus berstatus selesai untuk melanjutkan.', 422);
    }

    public static function alreadyConfirmed(): self
    {
        return new self('Penyelesaian sudah dikonfirmasi sebelumnya.', 422);
    }

    public static function unauthorized(): self
    {
        return new self('Hanya pelapor yang dapat melakukan aksi ini.', 403);
    }

    public static function cannotRate(): self
    {
        return new self('Tiket harus berstatus selesai untuk memberi rating.', 422);
    }

    public static function alreadyRated(): self
    {
        return new self('Rating sudah diberikan sebelumnya.', 422);
    }
}
