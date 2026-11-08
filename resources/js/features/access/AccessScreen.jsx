import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../../ui/Button';
import Container from '../../ui/Container';
import TextField from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import { ApiError, api } from '../../lib/api';
import './access.css';

const CODE_LENGTH = 6;

export default function AccessScreen({ onBack, onOpened }) {
    const { push } = useToast();
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [issues, setIssues] = useState({});
    const [pending, setPending] = useState(false);

    const ready = code.length === CODE_LENGTH && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

    async function handleSubmit(event) {
        event.preventDefault();

        if (pending) {
            return;
        }

        setIssues({});
        setPending(true);

        try {
            const session = await api.openSession({ code, email: email.trim() });
            onOpened(session);
        } catch (error) {
            const apiError = error instanceof ApiError ? error : null;
            const nextIssues = {
                code: apiError?.fieldError('code') ?? null,
                email: apiError?.fieldError('email') ?? null,
            };

            setIssues(nextIssues);
            push(
                apiError?.message ?? 'Koneksi ke server terputus. Periksa jaringan lalu coba lagi.',
                'error',
            );

            const firstBad = nextIssues.code ? 'code' : nextIssues.email ? 'email' : null;

            if (firstBad) {
                window.setTimeout(() => {
                    document.querySelector(`[data-field="${firstBad}"] input`)?.focus();
                }, 0);
            }
        } finally {
            setPending(false);
        }
    }

    return (
        <Container size="wide" className="access-wrap">
            <section className="access">
                <aside className="access__rail">
                    <p className="eyebrow">Langkah 1 dari 4</p>
                    <h1 className="display access__title">Kode akses</h1>
                    <p className="lede">
                        Enam karakter dari operator membuka satu sesi foto. Kode langsung hangus
                        setelah dipakai.
                    </p>
                    <Button variant="ghost" size="sm" onClick={onBack} className="access__back">
                        <ArrowLeft size={15} aria-hidden="true" />
                        Kembali
                    </Button>
                </aside>

                <form className="access__form" noValidate onSubmit={handleSubmit}>
                    <div className="access__field">
                        <TextField
                            id="code"
                            className="field--code"
                            label="Kode akses"
                            inputMode="text"
                            autoComplete="one-time-code"
                            autoCapitalize="characters"
                            spellCheck={false}
                            maxLength={CODE_LENGTH}
                            placeholder="------"
                            value={code}
                            invalid={Boolean(issues.code)}
                            onChange={(event) => {
                                setIssues((current) => ({ ...current, code: null }));
                                setCode(
                                    event.target.value
                                        .replace(/[^a-zA-Z0-9]/g, '')
                                        .toUpperCase()
                                        .slice(0, CODE_LENGTH),
                                );
                            }}
                        />
                        {issues.code ? <p className="access__issue">{issues.code}</p> : null}
                    </div>

                    <div className="access__field">
                        <TextField
                            id="email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            placeholder="nama@email.com"
                            hint="Strip cetak dan keenam foto dikirim ke alamat ini."
                            value={email}
                            invalid={Boolean(issues.email)}
                            onChange={(event) => {
                                setIssues((current) => ({ ...current, email: null }));
                                setEmail(event.target.value);
                            }}
                        />
                        {issues.email ? <p className="access__issue">{issues.email}</p> : null}
                    </div>

                    <Button type="submit" size="lg" block disabled={pending || !ready}>
                        {pending ? 'Membuka sesi...' : 'Lanjut ke kamera'}
                        <ArrowRight size={17} aria-hidden="true" />
                    </Button>

                    <p className="access__foot mono">
                        Butuh kode? Minta ke operator di meja cetak.
                    </p>
                </form>

                <div className="access__ticket" aria-hidden="true">
                    <div className="ticket">
                        <div className="ticket__head">
                            <span className="mono">Tiket sesi</span>
                            <span className="mono">SNAPSTRIP</span>
                        </div>
                        <div className="ticket__slots">
                            {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                                <span
                                    className="ticket__slot mono"
                                    data-filled={Boolean(code[index])}
                                    key={index}
                                >
                                    {code[index] ?? ''}
                                </span>
                            ))}
                        </div>
                        <div className="ticket__row">
                            <span className="mono">Email</span>
                            <span className="ticket__value">{email.trim() || 'belum diisi'}</span>
                        </div>
                        <div className="perf" />
                        <div className="ticket__row">
                            <span className="mono">Durasi</span>
                            <span className="ticket__value mono">6 menit</span>
                        </div>
                    </div>
                    <p className="access__ticket-note mono">Pratinjau tiket, bukan kode aktif.</p>
                </div>
            </section>
        </Container>
    );
}
