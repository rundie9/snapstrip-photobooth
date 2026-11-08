import { ArrowRight } from 'lucide-react';
import Button from '../../ui/Button';
import Container from '../../ui/Container';
import './welcome.css';

const STRIPS = [
    { id: '01', tilt: -2.4, frames: 4 },
    { id: '02', tilt: 1.6, frames: 3 },
    { id: '03', tilt: -1.2, frames: 3 },
];

export default function WelcomeScreen({ onStart }) {
    return (
        <Container size="wide" className="welcome-wrap">
            <section className="welcome">
            <div className="welcome__poster" aria-hidden="true">
                {STRIPS.map((strip, index) => (
                    <div
                        className="poster-strip"
                        data-lead={index === 0}
                        key={strip.id}
                        style={{ '--tilt': `${strip.tilt}deg` }}
                    >
                        <div className="poster-strip__head mono">
                            <span>Snapstrip</span>
                            <span>{strip.id}</span>
                        </div>
                        <div className="poster-strip__frames">
                            {Array.from({ length: strip.frames }).map((_, frame) => (
                                <span className="poster-strip__frame" key={frame} />
                            ))}
                        </div>
                        <div className="poster-strip__foot mono">
                            <span>6 potret</span>
                            <span>6 menit</span>
                        </div>
                    </div>
                ))}
                <span className="welcome__stamp mono">Studio 01 / Bandung</span>
            </div>

            <div className="welcome__intro">
                <p className="eyebrow">Photobooth digital</p>
                <h1 className="display welcome__title">
                    <span>Snap</span>
                    <span>strip</span>
                </h1>
                <p className="lede welcome__lede">
                    Enam potret dalam satu sesi. Pilih susunan cetak, lalu strip dan foto aslinya
                    dikirim ke email.
                </p>
                <div className="welcome__actions">
                    <Button size="lg" onClick={onStart}>
                        Mulai sesi
                        <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                    <p className="welcome__hint">
                        Butuh kode akses dari operator. Satu kode untuk satu sesi.
                    </p>
                </div>
            </div>

            <dl className="welcome__facts">
                <div>
                    <dt>Potret</dt>
                    <dd>6 frame</dd>
                </div>
                <div>
                    <dt>Sesi</dt>
                    <dd>6 menit</dd>
                </div>
                <div>
                    <dt>Cetak</dt>
                    <dd>Mulai Rp30.000</dd>
                </div>
            </dl>
        </section>
        </Container>
    );
}
