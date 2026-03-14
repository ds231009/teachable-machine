import { useEffect, useRef, useState } from 'react';

export default function LiveClassifier({ classify, isReady, isActive, onPredict }) {
    const videoRef = useRef(null);
    const [hasError, setHasError] = useState(false);
    // NEW: State to track if the video has painted its first frame
    const [isVideoReady, setIsVideoReady] = useState(false);
    const requestRef = useRef(null);

    // 1. Setup the Camera
    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { width: 224, height: 224 } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera error:", err);
                setHasError(true);
            }
        };

        startCamera();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    // 2. The Throttled Inference Loop
    useEffect(() => {
        // NEW: We now also require isVideoReady to be true before starting!
        if (!isReady || !videoRef.current || !isActive || !isVideoReady) return;

        let isPredicting = true;

        const predictFrame = () => {
            if (!isPredicting) return;

            classify(videoRef.current, (error, results) => {
                if (error) {
                    console.error("Classification error:", error);
                    return;
                }

                onPredict(results);
                requestRef.current = setTimeout(predictFrame, 100);
            });
        };

        predictFrame();

        return () => {
            isPredicting = false;
            if (requestRef.current) clearTimeout(requestRef.current);
        };
    }, [isReady, isActive, isVideoReady, classify, onPredict]); // <-- Added isVideoReady here

    if (hasError) return <div className="text-red-500">Camera access denied.</div>;

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            // NEW: Fire this event when the browser officially has video data
            onLoadedData={() => setIsVideoReady(true)}
            className={`max-w-[128px] rounded-lg border-4 object-cover aspect-square transition-all ${
                isActive ? 'border-green-500 opacity-100' : 'border-gray-300 grayscale opacity-60'
            }`}
        />
    );
}