import styles from "./Button.module.css"
import clsx from "clsx"

function Button({
    children,
    ariaLabel,
    variants = ["default"],
    onClick,
    disabled
    }) {

    const className = clsx(
        variants.map(v => styles[v])
    )

    return (
        <button
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
