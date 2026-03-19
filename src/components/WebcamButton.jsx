import { useEffect, useRef, useState } from 'react';
import Button from '../ui/button.jsx';
import {CameraIcon, FocusIcon, Icon, UploadIcon} from "../ui/Icons.jsx";
import styles from "./WebcamFeed.module.css"

export default function WebcamButton({
        isTraining,
        isRecording,
        onStart,
        onStop,
    }) {

    return (
        <button
            onMouseDown={onStart}
            onMouseUp={onStop}
            onMouseLeave={onStop} // Stops if they drag the mouse off the button
            onTouchStart={onStart} // For mobile screens
            onTouchEnd={onStop}
            className={`${styles.webcamButton} ${
                    isRecording ? styles.alarm : ''
            }`}
        >
            <Icon colors={["crimson"]}>
                <FocusIcon />
            </Icon>
            {isRecording ? "Recording..." : "Hold to Record"}
        </button>
    );
}