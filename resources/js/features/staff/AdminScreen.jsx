import { useEffect, useState } from 'react';
import { Copy, LogOut, Plus } from 'lucide-react';
import Button from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { api } from '../../lib/api';
import './staff.css';

const dateFormat = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
});

function formatDate(value) {
    return value ? dateFormat.format(new Date(value)) : '-';
}

const EMPTY_COUNTS = { total: 0, active: 0, used: 0 };

export default function AdminScreen({ staff, onLogout }) {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState(EMPTY_COUNTS);
    const [created, setCreated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const payload = await api.accessCodes();
            setRows(payload.data ?? []);
            setCounts(payload.meta?.counts ?? EMPTY_COUNTS);
            setFailed(false);
        } catch (err) {
            setFailed(true);
            toast.push(err?.message ?? 'Daftar kode gagal dimuat.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const create = async () => {
        setCreating(true);
        try {
            const code = await api.createAccessCode();
            setCreated(code);
            toast.push('Kode akses baru dibuat.');
            await load();
        } catch (err) {
            toast.push(err?.message ?? 'Kode gagal dibuat.', 'error');
        } finally {
            setCreating(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(created.code);
            toast.push('Kode disalin.');
        } catch {
            toast.push('Kode tidak bisa disalin. Salin manual.', 'error');
        }
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch {
            // The session is unusable either way.
        } finally {
            onLogout();
        }
    };

    return (
        <section className="screen-admin">
            <div className="staff-intro">
                <p className="eyebrow">Admin / akses</p>
                <h1 className="display staff-title">Kode akses</h1>
                <p className="lede">Buat kode sekali pakai untuk tiap sesi foto.</p>
                <p className="mono staff-who">
                    {staff?.name} / {staff?.username}
                </p>
            </div>

            <dl className="staff-stats">
                <div>
                    <dt>total</dt>
                    <dd>{counts.total}</dd>
                </div>
                <div>
                    <dt>aktif</dt>
                    <dd>{counts.active}</dd>
                </div>
                <div>
                    <dt>terpakai</dt>
                    <dd>{counts.used}</dd>
                </div>
            </dl>

            <Button className="staff-action" block onClick={create} disabled={creating}>
                <Plus size={16} strokeWidth={1.6} aria-hidden="true" />
                {creating ? 'Membuat...' : 'Buat kode'}
            </Button>

            <div className="staff-content">
                {created ? (
                    <div className="receipt card card--paper">
                        <div className="perf" aria-hidden="true" />
                        <div className="receipt__body">
                            <span className="receipt__label mono">kode baru</span>
                            <span className="receipt__code mono">{created.code}</span>
                            <button type="button" className="btn receipt__copy" onClick={copy}>
                                <Copy size={16} strokeWidth={1.6} aria-hidden="true" />
                                Salin
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="list-head">
                    <span className="eyebrow">Daftar kode</span>
                    <span className="mono list-head__count">{counts.total} total</span>
                </div>

                {loading ? (
                    <div className="code-skeletons" aria-hidden="true">
                        {[0, 1, 2].map((key) => (
                            <div className="code-skeleton" key={key}>
                                <span className="skeleton skeleton--code" />
                                <span className="skeleton skeleton--badge" />
                            </div>
                        ))}
                    </div>
                ) : failed ? (
                    <p className="code-empty">Daftar kode gagal dimuat. Muat ulang halaman.</p>
                ) : rows.length === 0 ? (
                    <p className="code-empty">
                        Belum ada kode. Buat kode pertama untuk membuka sesi.
                    </p>
                ) : (
                    <table className="code-table">
                        <thead>
                            <tr>
                                <th scope="col">Kode</th>
                                <th scope="col">Status</th>
                                <th scope="col">Dipakai oleh</th>
                                <th scope="col">Waktu</th>
                                <th scope="col" className="code-table__created">
                                    Dibuat
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.code}>
                                    <td className="code-table__code">{row.code}</td>
                                    <td className="code-table__status">
                                        <span
                                            className="badge"
                                            data-tone={row.status === 'active' ? 'live' : undefined}
                                        >
                                            {row.status === 'active' ? 'aktif' : 'terpakai'}
                                        </span>
                                    </td>
                                    <td className="code-table__used">
                                        {row.usedEmail || 'belum dipakai'}
                                    </td>
                                    <td className="code-table__time">{formatDate(row.usedAt)}</td>
                                    <td className="code-table__time code-table__created">
                                        {formatDate(row.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Button className="staff-logout" variant="ghost" block onClick={logout}>
                <LogOut size={16} strokeWidth={1.6} aria-hidden="true" />
                Keluar
            </Button>
        </section>
    );
}
