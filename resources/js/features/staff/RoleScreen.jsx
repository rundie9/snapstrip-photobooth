import { ArrowLeft, ScanLine, ShieldCheck } from 'lucide-react';
import Button from '../../ui/Button';
import './staff.css';

const ROLES = [
    { id: 'admin', name: 'Admin', purpose: 'Admin membuat kode akses', Icon: ShieldCheck },
    { id: 'operator', name: 'Operator', purpose: 'Operator memantau kode dan sesi', Icon: ScanLine },
];

export default function RoleScreen({ onSelect, onBack }) {
    return (
        <section className="screen-role">
            <div className="staff-intro role-intro">
                <div className="staff-backrow">
                    <Button variant="ghost" iconOnly aria-label="Kembali" onClick={onBack}>
                        <ArrowLeft size={18} strokeWidth={1.6} aria-hidden="true" />
                    </Button>
                    <p className="eyebrow">Meja staf</p>
                </div>
                <h1 className="display staff-title">Pilih peran</h1>
                <p className="lede">Satu meja, dua tugas. Pilih sesuai shift kamu.</p>
            </div>

            <div className="role-cards">
                {ROLES.map(({ id, name, purpose, Icon }) => (
                    <button
                        type="button"
                        className="role-card"
                        key={id}
                        onClick={() => onSelect(id)}
                    >
                        <span className="role-card__icon">
                            <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                        </span>
                        <span className="role-card__body">
                            <span className="role-card__name display">{name}</span>
                            <span className="role-card__purpose">{purpose}</span>
                        </span>
                        <span className="role-card__go mono">Pilih</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
