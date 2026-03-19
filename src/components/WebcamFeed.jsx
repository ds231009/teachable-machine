import { useEffect, useRef, useState } from 'react';
import styles from "./WebcamFeed.module.css";

// Notice we now accept `isRecording` as a prop from the parent!
export default function WebcamFeed({ onCapture, isRecording }) {
    const videoRef = useRef(null);
    const intervalRef = useRef(null);
    const [hasError, setHasError] = useState(false);

    // 1. Setup Camera (Stays exactly the same)
    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { width: 224, height: 224 } });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Error accessing webcam:", err);
                setHasError(true);
            }
        };

        startCamera();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    // 2. The Capture Logic
    const captureFrame = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 224, 224);
        onCapture(canvas.toDataURL('image/jpeg', 0.8));
    };

    // 3. THE NEW DECLARATIVE LOOP
    // This effect runs whenever the parent changes the `isRecording` prop
    useEffect(() => {
        if (isRecording) {
            captureFrame(); // Grab the first frame instantly
            intervalRef.current = setInterval(captureFrame, 100); // Start the loop
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current); // Stop the loop
        }

        // Cleanup function in case the component unmounts mid-record
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRecording]); // Watch this prop!

    if (hasError) return <div className="p-4 bg-red-100 text-red-700 rounded">Camera access denied.</div>;

    // Return ONLY the video tag. No buttons!
    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`${styles.webcam} ${isRecording ? styles.alarm : ''}`}
        />
    );
}