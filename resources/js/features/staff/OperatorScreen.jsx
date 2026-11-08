import { useEffect, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
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

export default function OperatorScreen({ staff, onLogout }) {
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState(EMPTY_COUNTS);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

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
        <section className="screen-operator">
            <div className="staff-intro">
                <p className="eyebrow">Operator / pantau</p>
                <h1 className="display staff-title">Kode akses</h1>
                <p className="lede">Pantau kode yang aktif dan yang sudah terpakai.</p>
                <p className="mono staff-who">
                    {staff?.name} / {staff?.username}
                </p>
            </div>

            <p className="operator-summary mono">
                {counts.active} kode aktif, {counts.used} terpakai
            </p>

            <Button className="staff-action" variant="outline" block onClick={load} disabled={loading}>
                <RefreshCw
                    size={16}
                    strokeWidth={1.6}
                    aria-hidden="true"
                    className={loading ? 'spin' : undefined}
                />
                {loading ? 'Memuat...' : 'Muat ulang'}
            </Button>

            <div className="staff-content">
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
                    <p className="code-empty">Operator belum punya kode untuk ditampilkan.</p>
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
