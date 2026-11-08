<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Foto kamu sudah jadi</title>
</head>
<body style="margin:0;padding:32px 16px;background:#12100e;font-family:Helvetica,Arial,sans-serif;color:#f3ece0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
        <tr>
            <td style="border-bottom:1px solid #3a342c;padding-bottom:16px;">
                <span style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a227;">{{ strtoupper(config('booth.name')) }}</span>
            </td>
        </tr>
        <tr>
            <td style="padding-top:24px;">
                <h1 style="margin:0 0 12px;font-size:26px;line-height:1.15;font-weight:400;font-family:Georgia,serif;">
                    Strip kamu sudah dicetak.
                </h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#c6bcae;">
                    Sesi {{ $order->public_id }} selesai. Berkas cetak ada di lampiran email ini, dan salinannya
                    tersimpan lewat tautan di bawah.
                </p>
                @if ($stripUrl)
                    <p style="margin:0 0 24px;">
                        <a href="{{ $stripUrl }}" style="color:#c9a227;">Buka file cetak {{ $order->public_id }}</a>
                    </p>
                @endif
                @if ($driveLink)
                    <p style="margin:0 0 24px;">
                        <a href="{{ $driveLink }}" style="color:#c9a227;">Folder foto di Google Drive</a>
                    </p>
                @endif
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #3a342c;padding-top:16px;">
                    <tr>
                        <td style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8a8074;">Kode sesi</td>
                        <td align="right" style="font-size:13px;color:#f3ece0;">{{ $order->public_id }}</td>
                    </tr>
                    <tr>
                        <td style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#8a8074;padding-top:6px;">Jumlah potret</td>
                        <td align="right" style="font-size:13px;color:#f3ece0;padding-top:6px;">{{ $order->shot_count }}</td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding-top:28px;font-size:11px;color:#6e665c;">
                Email ini dikirim otomatis setelah sesi foto selesai.
            </td>
        </tr>
    </table>
</body>
</html>
