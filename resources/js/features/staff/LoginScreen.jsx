import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../../ui/Button';
import TextField from '../../ui/TextField';
import { useToast } from '../../ui/Toast';
import { ApiError, api } from '../../lib/api';
import './staff.css';

export default function LoginScreen({ role, onLoggedIn, onBack }) {
    const toast = useToast();
    const usernameRef = useRef(null);
    const passwordRef = useRef(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [invalid, setInvalid] = useState({});
    const [pending, setPending] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (pending) {
            return;
        }

        setPending(true);
        setInvalid({});

        try {
            const staff = await api.login({ username, password });
            onLoggedIn(staff);
        } catch (err) {
            let usernameIssue = null;
            let passwordIssue = null;

            if (err instanceof ApiError) {
                usernameIssue = err.fieldError('username');
                passwordIssue = err.fieldError('password');

                if (err.status === 422 && !usernameIssue && !passwordIssue) {
                    passwordIssue = err.message;
                }
            }

            if (usernameIssue || passwordIssue) {
                setInvalid({ username: Boolean(usernameIssue), password: Boolean(passwordIssue) });
                (usernameIssue ? usernameRef : passwordRef).current?.focus();
            }

            toast.push(
                usernameIssue || passwordIssue || err?.message || 'Tidak bisa masuk. Coba lagi.',
                'error',
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <section className="screen-login">
            <div className="staff-intro login-intro">
                <div className="staff-backrow">
                    <Button variant="ghost" iconOnly aria-label="Kembali" onClick={onBack}>
                        <ArrowLeft size={18} strokeWidth={1.6} aria-hidden="true" />
                    </Button>
                    <p className="eyebrow">Meja staf</p>
                </div>
                <h1 className="display staff-title">Masuk</h1>
                <p className="lede">Kode akses dibuat dan dipantau dari meja ini.</p>
                <p className="login-role mono">Masuk sebagai {role}</p>
            </div>

            <form className="card login-form" noValidate onSubmit={handleSubmit}>
                <TextField
                    id="staff-username"
                    label="Nama pengguna"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    invalid={Boolean(invalid.username)}
                    ref={usernameRef}
                />
                <TextField
                    id="staff-password"
                    label="Kata sandi"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    invalid={Boolean(invalid.password)}
                    ref={passwordRef}
                />
                <Button type="submit" block disabled={pending}>
                    {pending ? 'Memeriksa...' : 'Masuk'}
                </Button>
            </form>
        </section>
    );
}
