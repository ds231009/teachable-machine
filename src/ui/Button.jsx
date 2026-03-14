function Button({
    children,
    variant = "default",
    onClick,
    disabled
    }) {

    const baseStyles = "px-4 py-2 whitespace-nowrap rounded-xxl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        icon: "",
        default: "bg-blue-600 text-white hover:bg-blue-700",
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        danger: "bg-red-500 text-white hover:bg-red-600",
        outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]}`}
        >
            {children}
        </button>
    )
}

export default Button
