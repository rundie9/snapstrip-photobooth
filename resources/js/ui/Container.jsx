import { cn } from '../lib/cn';

const widths = {
    narrow: 'max-w-[46rem]',
    default: 'max-w-[76rem]',
    wide: 'max-w-[100rem]',
    full: 'max-w-none',
};

/** The only place horizontal gutters and page width are defined. */
export default function Container({ size = 'default', className = '', children }) {
    return (
        <div className={cn('mx-auto w-full px-[var(--gutter)]', widths[size], className)}>
            {children}
        </div>
    );
}
