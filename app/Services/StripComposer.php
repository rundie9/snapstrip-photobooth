<?php

namespace App\Services;

use GdImage;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Renders the printable file for one booth run with GD, using the same layout
 * geometry the browser preview uses (columns, rows, shots used).
 */
class StripComposer
{
    private const PADDING = 34;

    private const GAP = 16;

    private const FOOTER = 104;

    /**
     * @param  list<string>  $photoPaths  paths on the public disk, in capture order
     * @param  array<string, mixed>  $layout
     * @return string path on the public disk
     */
    public function compose(array $photoPaths, array $layout, string $publicId): string
    {
        $columns = max(1, (int) $layout['columns']);
        $rows = max(1, (int) $layout['rows']);
        $cellWidth = $columns === 1 ? 560 : 402;
        $cellHeight = (int) round($cellWidth * 0.75);

        $width = $columns * $cellWidth + ($columns - 1) * self::GAP + self::PADDING * 2;
        $height = $rows * $cellHeight + ($rows - 1) * self::GAP + self::PADDING * 2 + self::FOOTER;

        $canvas = imagecreatetruecolor($width, $height);

        if (! $canvas instanceof GdImage) {
            throw new RuntimeException('Kanvas cetak tidak bisa dibuat.');
        }

        $paper = $this->allocate($canvas, (string) $layout['paper']);
        $ink = $this->allocate($canvas, (string) $layout['ink']);
        $hairline = $this->allocate($canvas, '#d8d0be');

        imagefilledrectangle($canvas, 0, 0, $width, $height, $paper);

        foreach (array_values($photoPaths) as $index => $path) {
            if ($index >= $columns * $rows) {
                break;
            }

            $photo = @imagecreatefromstring((string) file_get_contents(Storage::disk('public')->path($path)));

            if (! $photo instanceof GdImage) {
                continue;
            }

            $x = self::PADDING + ($index % $columns) * ($cellWidth + self::GAP);
            $y = self::PADDING + intdiv($index, $columns) * ($cellHeight + self::GAP);

            $this->drawCover($canvas, $photo, $x, $y, $cellWidth, $cellHeight);
            imagerectangle($canvas, $x, $y, $x + $cellWidth - 1, $y + $cellHeight - 1, $hairline);
            imagedestroy($photo);
        }

        $this->drawFooter($canvas, $width, $height, $ink, $hairline, $publicId);

        $relativePath = 'photos/'.$publicId.'/strip.jpg';
        $absolutePath = Storage::disk('public')->path($relativePath);
        Storage::disk('public')->makeDirectory(dirname($relativePath));

        imagejpeg($canvas, $absolutePath, 92);
        imagedestroy($canvas);

        return $relativePath;
    }

    private function drawCover(GdImage $canvas, GdImage $photo, int $x, int $y, int $width, int $height): void
    {
        $sourceWidth = imagesx($photo);
        $sourceHeight = imagesy($photo);
        $targetRatio = $width / $height;
        $sourceRatio = $sourceWidth / $sourceHeight;

        if ($sourceRatio > $targetRatio) {
            $cropHeight = $sourceHeight;
            $cropWidth = (int) round($sourceHeight * $targetRatio);
        } else {
            $cropWidth = $sourceWidth;
            $cropHeight = (int) round($sourceWidth / $targetRatio);
        }

        $sourceX = (int) (($sourceWidth - $cropWidth) / 2);
        $sourceY = (int) (($sourceHeight - $cropHeight) / 2);

        imagecopyresampled(
            $canvas, $photo, $x, $y, $sourceX, $sourceY, $width, $height, $cropWidth, $cropHeight,
        );
    }

    private function drawFooter(GdImage $canvas, int $width, int $height, int $ink, int $hairline, string $publicId): void
    {
        $top = $height - self::FOOTER + 18;

        for ($x = self::PADDING; $x < $width - self::PADDING; $x += 12) {
            $tall = ($x - self::PADDING) % 60 === 0;
            imageline($canvas, $x, $top, $x, $top + ($tall ? 12 : 6), $hairline);
        }

        $label = strtoupper((string) config('booth.name'));
        $markTop = $top + 26;

        imagefilledrectangle($canvas, self::PADDING, $markTop, self::PADDING + 16, $markTop + 16, $ink);
        imagestring($canvas, 5, self::PADDING + 24, $markTop + 2, $label, $ink);
        imagestring($canvas, 3, $width - self::PADDING - (strlen($publicId) * 7), $markTop + 4, $publicId, $ink);
    }

    private function allocate(GdImage $canvas, string $hex): int
    {
        $hex = ltrim($hex, '#');
        $red = (int) hexdec(substr($hex, 0, 2));
        $green = (int) hexdec(substr($hex, 2, 2));
        $blue = (int) hexdec(substr($hex, 4, 2));

        return (int) imagecolorallocate($canvas, $red, $green, $blue);
    }
}
