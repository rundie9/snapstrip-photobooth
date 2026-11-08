import { useCallback, useEffect, useRef, useState } from 'react';

const MESSAGES = {
    unsupported: 'Browser ini tidak mendukung akses kamera. Coba Chrome atau Edge versi terbaru.',
    denied: 'Akses kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu muat ulang.',
    missing: 'Kamera tidak ditemukan. Sambungkan kamera lalu tekan coba lagi.',
    busy: 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu tekan coba lagi.',
    failed: 'Kamera tidak bisa dibuka. Tekan coba lagi.',
};

export function useCamera() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const cancelledRef = useRef(false);
    const [status, setStatus] = useState('starting');
    const [message, setMessage] = useState(null);

    const stop = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    const start = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus('error');
            setMessage(MESSAGES.unsupported);
            return;
        }

        setStatus('starting');
        setMessage(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 800 } },
                audio: false,
            });

            if (cancelledRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }

            setStatus('ready');
        } catch (error) {
            const name = error?.name;
            setStatus('error');
            setMessage(
                name === 'NotAllowedError' || name === 'SecurityError'
                    ? MESSAGES.denied
                    : name === 'NotFoundError' || name === 'OverconstrainedError'
                      ? MESSAGES.missing
                      : name === 'NotReadableError'
                        ? MESSAGES.busy
                        : MESSAGES.failed,
            );
        }
    }, []);

    useEffect(() => {
        cancelledRef.current = false;
        start();

        return () => {
            // A pending permission prompt can resolve after unmount; mark it so
            // the late stream is stopped instead of leaving the camera light on.
            cancelledRef.current = true;
            stop();
        };
    }, [start, stop]);

    /**
     * Grabs a mirrored frame, resized to 1280px wide so six uploads stay
     * comfortably under the PHP post limit.
     */
    const capture = useCallback(async () => {
        const video = videoRef.current;

        if (!video || !video.videoWidth) {
            return null;
        }

        const scale = Math.min(1, 1280 / video.videoWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);

        const context = canvas.getContext('2d');
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));

        return blob ? { blob, url: URL.createObjectURL(blob) } : null;
    }, []);

    return { videoRef, status, message, start, stop, capture };
}
