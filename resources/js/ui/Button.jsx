import { cn } from '../lib/cn';

const variants = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    paper: 'btn-paper',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    block = false,
    iconOnly = false,
    className = '',
    children,
    ...props
}) {
    return (
        <button
            type="button"
            className={cn('btn', variants[variant], iconOnly && 'btn-icon', className)}
            data-size={size}
            data-block={block || undefined}
            {...props}
        >
            {children}
        </button>
    );
}
