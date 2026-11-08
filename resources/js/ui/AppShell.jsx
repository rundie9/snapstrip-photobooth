import { LogIn } from 'lucide-react';
import Container from './Container';
import Steps from './Steps';

export default function AppShell({
    step = null,
    onHome,
    onStaff,
    staff = null,
    footerNote = 'Enam potret, satu strip cetak.',
    children,
}) {
    return (
        <div className="shell">
            <header className="shell__bar">
                <Container size="wide" className="shell__bar-inner">
                    <button type="button" className="wordmark" onClick={onHome}>
                        snapstrip<span>.</span>
                    </button>

                    <div className="flex items-center gap-3">
                        {step ? <Steps current={step} /> : null}

                        {staff ? (
                            <span className="badge" data-tone="ok">
                                {staff.username} / {staff.role}
                            </span>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-ghost"
                                data-size="sm"
                                onClick={onStaff}
                            >
                                <LogIn size={15} aria-hidden="true" />
                                Staff
                            </button>
                        )}
                    </div>
                </Container>
            </header>

            <main className="shell__body">{children}</main>

            <footer className="shell__foot">
                <Container
                    size="wide"
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3"
                >
                    <span>Snapstrip / photobooth</span>
                    <span>{footerNote}</span>
                </Container>
            </footer>
        </div>
    );
}
