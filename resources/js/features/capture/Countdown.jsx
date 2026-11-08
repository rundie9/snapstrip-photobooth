import { useEffect, useRef, useState } from 'react';

export default function Countdown({ onDone, seconds = 3 }) {
    const [value, setValue] = useState(seconds);
    const doneRef = useRef(onDone);
    doneRef.current = onDone;

    useEffect(() => {
        if (value === 0) {
            doneRef.current();
            return;
        }

        const timer = window.setTimeout(() => setValue((current) => current - 1), 650);

        return () => window.clearTimeout(timer);
    }, [value]);

    return (
        <div className="countdown" role="status" aria-live="assertive" aria-label="Menghitung sebelum potret">
            <span className="countdown__value" key={value}>
                {value === 0 ? '' : value}
            </span>
        </div>
    );
}
