import styles from "./Button.module.css"
import clsx from "clsx"

function Button({
    children,
    ariaLabel,
    title,
    variants = ["default"],
    onClick,
    disabled
    }) {

    const className = clsx(
        variants.map(v => styles[v])
    )

    const finalTitle = title

    return (
        <button
            title={finalTitle}
            aria-label={ariaLabel}
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {children}
        </button>
    )
}

export default Button
