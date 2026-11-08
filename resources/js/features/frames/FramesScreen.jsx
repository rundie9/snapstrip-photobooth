import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Button from '../../ui/Button';
import Container from '../../ui/Container';
import { useToast } from '../../ui/Toast';
import { api, ApiError } from '../../lib/api';
import './frames.css';

function clock(seconds) {
    const safe = Math.max(0, seconds);
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function cellsOf(layout) {
    return layout.rows * layout.columns;
}

function ratioOf(layout) {
    return (layout.columns * 4) / (layout.rows * 3 + 1.6);
}

export default function FramesScreen({ session, shots, shotsRequired, secondsLeft, onBack, onSubmitted }) {
    const { push } = useToast();
    const [layouts, setLayouts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        let alive = true;

        api
            .layouts()
            .then((rows) => {
                if (!alive) {
                    return;
                }

                setLayouts(rows);
                setSelectedId((current) => current ?? rows[0]?.id ?? null);
            })
            .catch((error) => {
                if (!alive) {
                    return;
                }

                push(
                    error instanceof ApiError
                        ? error.message
                        : 'Daftar bingkai gagal dimuat. Periksa jaringan lalu muat ulang.',
                    'error',
                );
            });

        return () => {
            alive = false;
        };
    }, [push]);

    const selected = layouts.find((layout) => layout.id === selectedId) ?? null;

    async function submit() {
        if (!selected || pending) {
            return;
        }

        const form = new FormData();
        form.append('layout_id', selected.id);

        shots.slice(0, shotsRequired).forEach((shot, index) => {
            if (shot) {
                form.append('photos[]', shot.blob, `shot-${index + 1}.jpg`);
            }
        });

        setPending(true);

        try {
            const order = await api.submitCaptures(session.id, form);
            onSubmitted(order);
        } catch (error) {
            push(
                error instanceof ApiError
                    ? error.message
                    : 'Foto gagal dikirim. Periksa jaringan lalu coba lagi.',
                'error',
            );
        } finally {
            setPending(false);
        }
    }

    return (
        <Container size="wide" className="frames-wrap">
            <section className="frames">
                <aside className="frames__aside">
                    <p className="eyebrow">Langkah 03</p>
                    <h2 className="display frames__title">Bingkai</h2>
                    <p className="lede">
                        Pilih susunan cetak. Keenam potret tetap dikirim penuh ke email, bingkai
                        hanya menentukan bentuk strip yang dicetak.
                    </p>
                    <dl className="frames__facts">
                        <div className="meta-row">
                            <dt>Kode sesi</dt>
                            <dd className="mono">{session.id}</dd>
                        </div>
                        <div className="meta-row">
                            <dt>Sisa waktu</dt>
                            <dd className="mono">{clock(secondsLeft)}</dd>
                        </div>
                    </dl>
                    <button type="button" className="frames__back" onClick={onBack}>
                        <ArrowLeft size={15} aria-hidden="true" />
                        Ulangi potret
                    </button>
                </aside>

                <div className="frames__preview">
                    {selected ? (
                        <div
                            className="strip-preview"
                            style={{ '--cols': selected.columns, '--rows': selected.rows, '--ratio': ratioOf(selected) }}
                        >
                            {Array.from({ length: cellsOf(selected) }).map((_, index) => {
                                const shot = shots[index];

                                return (
                                    <div className="strip-preview__cell" data-filled={Boolean(shot)} key={index}>
                                        {shot ? (
                                            <img src={shot.url} alt="" />
                                        ) : (
                                            <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="strip-preview__foot mono">
                                <span>snapstrip</span>
                                <span>{session.id}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="strip-preview strip-preview--loading skeleton" />
                    )}

                    <p className="frames__caption mono">
                        {selected
                            ? `${selected.columns} kolom / ${selected.rows} baris / ${selected.shotsUsed} potret`
                            : 'memuat pilihan bingkai'}
                    </p>
                </div>

                <div className="frames__rail">
                    <button type="button" className="frames__back frames__back--inline" onClick={onBack}>
                        <ArrowLeft size={15} aria-hidden="true" />
                        Ulangi potret
                    </button>

                    <div className="frames__rail-head">
                        <span className="eyebrow">Susunan</span>
                        <span className="mono frames__rail-count">{layouts.length} pilihan</span>
                    </div>

                    <ul className="layout-list" role="radiogroup" aria-label="Susunan cetak">
                        {layouts.length === 0
                            ? [0, 1, 2].map((row) => (
                                  <li key={row}>
                                      <div className="layout-option layout-option--loading skeleton" />
                                  </li>
                              ))
                            : layouts.map((layout) => (
                                  <li key={layout.id}>
                                      <button
                                          type="button"
                                          className="layout-option"
                                          data-selected={layout.id === selectedId}
                                          role="radio"
                                          aria-checked={layout.id === selectedId}
                                          onClick={() => setSelectedId(layout.id)}
                                      >
                                          <span
                                              className="layout-option__grid"
                                              style={{ '--c': layout.columns, '--r': layout.rows }}
                                              aria-hidden="true"
                                          >
                                              {Array.from({ length: cellsOf(layout) }).map((_, cell) => (
                                                  <span key={cell} />
                                              ))}
                                          </span>

                                          <span className="layout-option__body">
                                              <span className="layout-option__name">{layout.name}</span>
                                              <span className="layout-option__note">{layout.note}</span>
                                              <span className="layout-option__price mono">
                                                  Rp{layout.price.toLocaleString('id-ID')}
                                              </span>
                                          </span>

                                          {layout.id === selectedId ? (
                                              <Check className="layout-option__check" size={16} aria-hidden="true" />
                                          ) : null}
                                      </button>
                                  </li>
                              ))}
                    </ul>

                    <div className="frames__submit">
                        <Button size="lg" block disabled={!selected || pending} onClick={submit}>
                            {pending ? 'Mengirim foto...' : 'Cetak dan kirim'}
                            <ArrowRight size={17} aria-hidden="true" />
                        </Button>
                        <p className="frames__submit-hint">
                            Strip dikirim ke {session.email}. Simpan halaman ini sampai proses selesai.
                        </p>
                    </div>
                </div>
            </section>
        </Container>
    );
}
