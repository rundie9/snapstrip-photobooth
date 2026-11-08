import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from './ui/AppShell';
import { ToastProvider, useToast } from './ui/Toast';
import WelcomeScreen from './features/welcome/WelcomeScreen';
import AccessScreen from './features/access/AccessScreen';
import CaptureScreen from './features/capture/CaptureScreen';
import FramesScreen from './features/frames/FramesScreen';
import DoneScreen from './features/done/DoneScreen';
import RoleScreen from './features/staff/RoleScreen';
import LoginScreen from './features/staff/LoginScreen';
import AdminScreen from './features/staff/AdminScreen';
import OperatorScreen from './features/staff/OperatorScreen';
import { api } from './lib/api';

const STEP = { access: 1, capture: 2, frames: 3, done: 4 };
const DEFAULT_SECONDS = 6 * 60;

function Booth() {
    const { push } = useToast();
    const [screen, setScreen] = useState('welcome');
    const [session, setSession] = useState(null);
    const [shots, setShots] = useState([]);
    const [order, setOrder] = useState(null);
    const [staff, setStaff] = useState(null);
    const [intendedRole, setIntendedRole] = useState('operator');
    const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);

    const shotsRef = useRef([]);
    const deadlineRef = useRef(null);

    const updateShots = useCallback((next) => {
        shotsRef.current = next;
        setShots(next);
    }, []);

    const resetRun = useCallback(
        (nextScreen = 'welcome') => {
            shotsRef.current.forEach((shot) => shot && URL.revokeObjectURL(shot.url));
            updateShots([]);
            setSession(null);
            setOrder(null);
            setSecondsLeft(DEFAULT_SECONDS);
            deadlineRef.current = null;
            setScreen(nextScreen);
        },
        [updateShots],
    );

    // A returning staff member keeps their cookie session; the badge is enough,
    // we never bounce them out of the customer flow on load.
    useEffect(() => {
        api.currentStaff()
            .then(setStaff)
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (screen !== 'capture' && screen !== 'frames') {
            return;
        }

        const tick = () => {
            const left = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
            setSecondsLeft(left);

            if (left === 0) {
                resetRun('access');
                push('Waktu sesi habis. Minta kode baru ke operator.', 'error');
            }
        };

        tick();
        const timer = window.setInterval(tick, 1000);

        return () => window.clearInterval(timer);
    }, [screen, push, resetRun]);

    function openSession(nextSession) {
        shotsRef.current.forEach((shot) => shot && URL.revokeObjectURL(shot.url));
        setSession(nextSession);
        setSecondsLeft(nextSession.sessionSeconds);
        deadlineRef.current = Date.now() + nextSession.sessionSeconds * 1000;
        updateShots(Array.from({ length: nextSession.shotsRequired }, () => null));
        setScreen('capture');
    }

    function openStaff() {
        if (staff) {
            setScreen(staff.role === 'admin' ? 'staff-admin' : 'staff-operator');
            return;
        }

        setScreen('staff-role');
    }

    function finishLogin(nextStaff) {
        setStaff(nextStaff);
        setScreen(nextStaff.role === 'admin' ? 'staff-admin' : 'staff-operator');
    }

    function leaveStaff() {
        setStaff(null);
        setScreen('welcome');
    }

    return (
        <AppShell
            step={STEP[screen] ?? null}
            onHome={() => resetRun('welcome')}
            onStaff={openStaff}
            staff={screen.startsWith('staff-') ? staff : null}
            footerNote={screen.startsWith('staff-') ? 'Ruang staff / kode akses' : 'Enam potret, satu strip cetak.'}
        >
            {screen === 'welcome' && <WelcomeScreen onStart={() => setScreen('access')} />}

            {screen === 'access' && (
                <AccessScreen onBack={() => resetRun('welcome')} onOpened={openSession} />
            )}

            {screen === 'capture' && session && (
                <CaptureScreen
                    secondsLeft={secondsLeft}
                    shots={shots}
                    shotsRequired={session.shotsRequired}
                    onShotsChange={updateShots}
                    onDone={() => setScreen('frames')}
                />
            )}

            {screen === 'frames' && session && (
                <FramesScreen
                    session={session}
                    shots={shots}
                    shotsRequired={session.shotsRequired}
                    secondsLeft={secondsLeft}
                    onBack={() => setScreen('capture')}
                    onSubmitted={(nextOrder) => {
                        shotsRef.current.forEach((shot) => shot && URL.revokeObjectURL(shot.url));
                        updateShots([]);
                        setOrder(nextOrder);
                        setScreen('done');
                    }}
                />
            )}

            {screen === 'done' && order && <DoneScreen order={order} onRestart={() => resetRun('welcome')} />}

            {screen === 'staff-role' && (
                <RoleScreen
                    onBack={() => setScreen('welcome')}
                    onSelect={(role) => {
                        setIntendedRole(role);
                        setScreen('staff-login');
                    }}
                />
            )}

            {screen === 'staff-login' && (
                <LoginScreen
                    role={intendedRole}
                    onBack={() => setScreen('staff-role')}
                    onLoggedIn={finishLogin}
                />
            )}

            {screen === 'staff-admin' && staff && (
                <AdminScreen staff={staff} onLogout={leaveStaff} />
            )}

            {screen === 'staff-operator' && staff && (
                <OperatorScreen staff={staff} onLogout={leaveStaff} />
            )}
        </AppShell>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <Booth />
        </ToastProvider>
    );
}
