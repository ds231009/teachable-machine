function ProgressBar({
    progress,
    variant="fixed", // gradient
    color = "#ff0000"
    }) {

    progress = progress > 1 ? 1 : progress

    return (
        <div style={{
            height: "6px",
            alignSelf: "center",
            width: "100%",
            borderRadius: "10px",
            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent 90%`,
        }}>
            <div style={{
                height: "100%",
                width: `${progress * 100}%`,
                transition: "width 0.15s ease-out",
                backgroundColor: color,
                borderRadius: "10px",
                opacity: variant==="fixed" ? 1 : progress
            }}>

            </div>
        </div>
    )
}

export default ProgressBar
