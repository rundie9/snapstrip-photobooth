import { useState } from 'react';
import { ArrowRight, Camera, RefreshCw, VideoOff } from 'lucide-react';
import Button from '../../ui/Button';
import Container from '../../ui/Container';
import { cn } from '../../lib/cn';
import Countdown from './Countdown';
import { useCamera } from './useCamera';
import './capture.css';

function clock(seconds) {
    const safe = Math.max(0, seconds);
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function ShotTiles({ shots, armed, onArm, className = '' }) {
    return (
        <div className={cn('capture__shots', className)}>
            {shots.map((shot, index) => (
                <button
                    key={index}
                    type="button"
                    className="shot-tile"
                    data-filled={Boolean(shot)}
                    data-armed={armed === index}
                    disabled={!shot}
                    onClick={() => onArm(armed === index ? null : index)}
                    aria-label={shot ? `Ganti foto ${index + 1}` : `Foto ${index + 1} masih kosong`}
                >
                    {shot ? (
                        <img src={shot.url} alt="" />
                    ) : (
                        <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default function CaptureScreen({ secondsLeft, shots, shotsRequired, onShotsChange, onDone }) {
    const { videoRef, status, message, start, capture } = useCamera();
    const [phase, setPhase] = useState('idle');
    const [armed, setArmed] = useState(null);

    const filled = shots.filter(Boolean).length;
    const complete = filled === shotsRequired;
    const target = armed ?? shots.findIndex((shot) => !shot);

    async function shoot() {
        const shot = await capture();

        if (!shot) {
            setPhase('idle');
            return;
        }

        const next = [...shots];
        URL.revokeObjectURL(shots[target]?.url ?? '');
        next[target] = shot;
        onShotsChange(next);
        setArmed(null);
        setPhase('flash');
        window.setTimeout(() => setPhase('idle'), 260);
    }

    function begin() {
        if (status !== 'ready' || phase !== 'idle' || target === -1) {
            return;
        }

        setPhase('counting');
    }

    const hint =
        armed !== null
            ? `Potret berikutnya mengganti foto ${String(armed + 1).padStart(2, '0')}.`
            : complete
              ? 'Semua potret terisi. Ketuk foto untuk mengulang salah satunya.'
              : `Ketuk tombol potret. Terisi ${filled} dari ${shotsRequired}.`;

    const canContinue = complete && phase === 'idle';

    return (
        <Container size="wide" className="capture-wrap">
            <section className="capture">
                <aside className="capture__aside">
                    <p className="eyebrow">Langkah 02</p>
                    <h2 className="display capture__title">
                        Potret
                    </h2>
                    <p className="lede">
                        Berdiri di dalam bingkai. Hitungan tiga detik muncul setiap kali tombol
                        potret ditekan.
                    </p>
                    <dl className="capture__facts">
                        <div className="meta-row">
                            <dt>Sisa waktu</dt>
                            <dd className="mono">{clock(secondsLeft)}</dd>
                        </div>
                        <div className="meta-row">
                            <dt>Terisi</dt>
                            <dd className="mono">
                                {filled} / {shotsRequired}
                            </dd>
                        </div>
                    </dl>
                </aside>

                <div className="capture__stage">
                    <video ref={videoRef} className="capture__video" playsInline muted autoPlay />

                    <div className="capture__hud">
                        <span className="mono capture__chip">{clock(secondsLeft)}</span>
                        <span className="mono capture__chip">
                            {filled}/{shotsRequired}
                        </span>
                    </div>

                    {status === 'starting' ? <p className="capture__loading mono">membuka kamera</p> : null}

                    {status === 'error' ? (
                        <div className="capture__error">
                            <VideoOff size={22} aria-hidden="true" />
                            <p>{message}</p>
                            <Button variant="outline" size="sm" onClick={start}>
                                <RefreshCw size={14} aria-hidden="true" />
                                Coba lagi
                            </Button>
                        </div>
                    ) : null}

                    {status === 'ready' && phase === 'idle' ? <p className="capture__hint">{hint}</p> : null}

                    {phase === 'counting' ? <Countdown onDone={shoot} /> : null}
                    {phase === 'flash' ? <span className="capture__flash" aria-hidden="true" /> : null}

                    <button
                        type="button"
                        className="shutter"
                        onClick={begin}
                        disabled={status !== 'ready' || phase !== 'idle' || target === -1}
                        aria-label={armed === null ? 'Ambil potret' : `Potret ulang foto ${armed + 1}`}
                    >
                        <Camera size={22} aria-hidden="true" />
                    </button>
                </div>

                <div className="capture__rail">
                    <div className="capture__rail-head">
                        <span className="eyebrow">Kontak cetak</span>
                        <span className="mono capture__count">
                            {filled}/{shotsRequired}
                        </span>
                    </div>

                    <ShotTiles shots={shots} armed={armed} onArm={setArmed} />

                    <p className="capture__rail-hint">
                        {armed !== null
                            ? `Foto ${String(armed + 1).padStart(2, '0')} akan diganti.`
                            : 'Ketuk salah satu foto untuk potret ulang.'}
                    </p>

                    <div className="capture__rail-facts">
                        <div className="meta-row">
                            <dt>Sisa waktu</dt>
                            <dd className="mono">{clock(secondsLeft)}</dd>
                        </div>
                    </div>

                    <Button block disabled={!canContinue} onClick={() => onDone(shots)}>
                        Pilih bingkai
                        <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                </div>

                <div className="capture__dock">
                    <div className="capture__dock-head">
                        <span className="eyebrow">Kontak cetak</span>
                        <span className="mono capture__count">
                            {filled}/{shotsRequired}
                        </span>
                    </div>

                    <ShotTiles
                        shots={shots}
                        armed={armed}
                        onArm={setArmed}
                        className="capture__shots--strip"
                    />

                    <Button block disabled={!canContinue} onClick={() => onDone(shots)}>
                        Pilih bingkai
                        <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                </div>
            </section>
        </Container>
    );
}
