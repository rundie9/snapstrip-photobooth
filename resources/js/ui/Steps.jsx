import { cn } from '../lib/cn';

const LABELS = ['Kode', 'Potret', 'Cetak', 'Selesai'];

export default function Steps({ current }) {
    return (
        <div
            className="steps"
            role="img"
            aria-label={`Langkah ${current} dari ${LABELS.length}: ${LABELS[current - 1]}`}
        >
            <span className="steps__label hidden sm:inline">{LABELS[current - 1]}</span>
            {LABELS.map((label, index) => {
                const step = index + 1;
                const state = step < current ? 'done' : step === current ? 'current' : 'todo';

                return <span className="steps__dash" data-state={state} key={label} />;
            })}
        </div>
    );
}
