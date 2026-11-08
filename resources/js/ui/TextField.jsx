import { cn } from '../lib/cn';

/**
 * Text input with a mono label. An invalid field only turns its border red;
 * the sentence explaining why belongs in the toast.
 */
export default function TextField({
    label,
    hint,
    invalid = false,
    className = '',
    inputClassName = '',
    id,
    ...inputProps
}) {
    const hintId = hint && id ? `${id}-hint` : undefined;

    return (
        <label className={cn('field', className)} data-field={id}>
            {label ? <span className="field__label">{label}</span> : null}
            <input
                id={id}
                className={cn('field__input', inputClassName)}
                aria-invalid={invalid || undefined}
                aria-describedby={hintId}
                {...inputProps}
            />
            {hint ? (
                <span className="field__hint" id={hintId}>
                    {hint}
                </span>
            ) : null}
        </label>
    );
}
