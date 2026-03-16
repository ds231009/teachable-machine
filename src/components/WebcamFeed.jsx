import { useEffect, useRef, useState } from 'react';
import Button from '../ui/button.jsx';
import {CameraIcon, FocusIcon, Icon, UploadIcon} from "../ui/Icons.jsx";
import styles from "../ui/Button.module.css"

export default function WebcamFeed({ onCapture, isTraining }) {
    const videoRef = useRef(null);
    const intervalRef = useRef(null); // Holds our recording loop
    const [hasError, setHasError] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 224, height: 224 }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                setHasError(true);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            // Cleanup the interval if the component unmounts while recording
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // --- The Magic Canvas Capture ---
    const captureFrame = () => {
        if (!videoRef.current) return;

        // Create an invisible canvas in memory
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');

        // Draw the current video frame onto the canvas
        ctx.drawImage(videoRef.current, 0, 0, 224, 224);

        // Convert the canvas to a base64 image string and send it to the parent
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality to save memory
        onCapture(dataUrl);
    };

    const startRecording = () => {
        if (isTraining) return;
        setIsRecording(true);
        captureFrame(); // Grab the first frame instantly
        intervalRef.current = setInterval(captureFrame, 100); // Then snap 10 frames per second
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    if (hasError) return <div className="p-4 bg-red-100 text-red-700 rounded">Camera access denied.</div>;

    return (
        <div className="flex flex-col items-center gap-2 mb-4">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`max-w-[128px] rounded-lg border-4 object-cover bg-black aspect-square transition-colors ${isRecording ? 'border-red-500' : 'border-gray-300'}`}
            />

            {/* Native button for raw event listeners to handle the hold-to-record */}
            <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording} // Stops if they drag the mouse off the button
                onTouchStart={startRecording} // For mobile screens
                onTouchEnd={stopRecording}
                disabled={isTraining}
                className={`${
                    isTraining ? styles.alarm :
                        isRecording ? styles.alarm : ''
                }`}
            >
                <Icon colors={["#ffffff"]}>
                    <FocusIcon />
                </Icon>
                {isRecording ? "Recording..." : "Hold to Record"}
            </button>
        </div>
    );
}