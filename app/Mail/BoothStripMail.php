<?php

namespace App\Mail;

use App\Models\BoothOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class BoothStripMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly BoothOrder $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Foto kamu dari '.config('booth.name').' sudah jadi',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booth-strip',
            with: [
                'order' => $this->order,
                'stripUrl' => $this->order->strip_path
                    ? Storage::disk('public')->url($this->order->strip_path)
                    : null,
                'driveLink' => $this->order->drive_link,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if (! $this->order->strip_path) {
            return [];
        }

        return [
            Attachment::fromPath(Storage::disk('public')->path($this->order->strip_path))
                ->as('snapstrip-'.$this->order->public_id.'.jpg')
                ->withMime('image/jpeg'),
        ];
    }
}
