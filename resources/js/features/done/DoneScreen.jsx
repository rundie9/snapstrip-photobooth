import { Download, Printer } from 'lucide-react';
import Button from '../../ui/Button';
import Container from '../../ui/Container';
import './done.css';

export default function DoneScreen({ order, onRestart }) {
    const emailed = Boolean(order.emailSentAt);

    return (
        <Container size="wide" className="done-wrap">
            <section className="done">
                <div className="done__print">
                    {order.stripUrl ? (
                        <img
                            className="done__strip"
                            src={order.stripUrl}
                            alt={`Strip cetak sesi ${order.id}`}
                        />
                    ) : (
                        <div className="done__strip skeleton" />
                    )}

                    {order.stripUrl ? (
                        <a
                            className="btn btn-outline done__download"
                            data-size="sm"
                            href={order.stripUrl}
                            download={`snapstrip-${order.id}.jpg`}
                        >
                            <Download size={15} aria-hidden="true" />
                            Unduh strip
                        </a>
                    ) : null}
                </div>

                <article className="done__receipt">
                    <div className="done__receipt-head">
                        <span className="mono">sesi selesai</span>
                        <span className="mono">{order.id}</span>
                    </div>

                    <h2 className="display done__title">Siap dicetak</h2>

                    <p className="done__lede">
                        {emailed
                            ? `Keenam foto dan strip sudah dikirim ke ${order.email}.`
                            : `Foto tersimpan. Email ke ${order.email} masih diproses, strip bisa diunduh sekarang.`}
                    </p>

                    <dl className="done__facts">
                        <div className="meta-row">
                            <dt>Kode sesi</dt>
                            <dd className="mono">{order.id}</dd>
                        </div>
                        <div className="meta-row">
                            <dt>Potret</dt>
                            <dd className="mono">{order.shotCount}</dd>
                        </div>
                        <div className="meta-row">
                            <dt>Bingkai</dt>
                            <dd className="mono">{order.layoutId}</dd>
                        </div>
                        <div className="meta-row">
                            <dt>Total</dt>
                            <dd className="mono">Rp{Number(order.amount ?? 0).toLocaleString('id-ID')}</dd>
                        </div>
                    </dl>

                    <div className="perf" />

                    <div className="done__receipt-foot">
                        <span className="mono">terima kasih</span>
                        <Button onClick={onRestart}>Sesi baru</Button>
                    </div>
                </article>

                <aside className="done__next">
                    <p className="eyebrow">Berikutnya</p>
                    <ol>
                        {order.driveLink ? (
                            <li>
                                <Download size={16} aria-hidden="true" />
                                <span>
                                    <a href={order.driveLink} target="_blank" rel="noreferrer">
                                        Buka folder foto di Google Drive
                                    </a>
                                </span>
                            </li>
                        ) : null}
                        <li>
                            <Printer size={16} aria-hidden="true" />
                            <span>Tunjukkan kode {order.id} ke operator untuk mengambil cetakan.</span>
                        </li>
                        <li>
                            <Download size={16} aria-hidden="true" />
                            <span>Simpan strip dari email kalau ingin versi digital.</span>
                        </li>
                    </ol>
                </aside>
            </section>
        </Container>
    );
}
