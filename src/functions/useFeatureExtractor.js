import { useState, useEffect, useRef, useCallback } from 'react';

export const useFeatureExtractor = () => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState('idle'); // idle, preparing, training, ready
    const [currentLoss, setCurrentLoss] = useState(null);

    const featureExtractorRef = useRef(null);
    const classifierRef = useRef(null);

    useEffect(() => {
        if (classifierRef.current) return;

        const initML5 = async () => {
            // 1. Load MobileNet (This is the heavy part that takes time)
            featureExtractorRef.current = window.ml5.featureExtractor('MobileNet', () => {
                console.log('MobileNet features loaded!');

                // 2. Initialize classifier (Synchronous in v0.12.2 when no video is passed)
                classifierRef.current = featureExtractorRef.current.classification();

                console.log('Classifier initialized!');
                // 3. Manually trigger the state update
                setIsModelLoaded(true);
            });
        };

        if (window.ml5) initML5();
    }, []);

    // Takes the React dataset, loads images into memory, feeds ml5, and trains
    // Takes your React dataset array, loads images into memory, feeds ml5, and trains
    const prepareAndTrain = useCallback(async (currentDataset) => {
        if (!classifierRef.current) return;

        setTrainingStatus('preparing');

        let totalImages = 0;

        // 1. Loop through your array of class objects natively
        for (const classObj of currentDataset) {

            // 2. Loop through the image URLs in each class
            // 1. Loop through your array of class objects natively
            for (const classObj of currentDataset) {

                // Skip empty classes so TensorFlow doesn't crash trying to classify "nothing"
                if (classObj.items.length === 0) continue;

                // 2. Loop through the image URLs in each class
                for (const imageUrl of classObj.items) {
                    totalImages++;

                    const img = new Image();
                    img.src = imageUrl;

                    // Step A: Wait for the image to physically load into browser memory
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = () => {
                            console.error("Failed to load image:", imageUrl);
                            resolve();
                        };
                    });

                    // Step B: CRITICAL FIX - Wait for ml5 to extract the features
                    await new Promise((resolve) => {
                        classifierRef.current.addImage(img, classObj.className, () => {
                            // This callback fires only when TensorFlow is done with the image
                            resolve();
                        });
                    });
                }
            }
        }

        // Safety Check: Prevent TensorFlow from crashing on empty data
        if (totalImages === 0) {
            alert("Whoops! Please upload at least one image before training.");
            setTrainingStatus('idle');
            return;
        }

        setTrainingStatus('training');

        // Start the training loop
        classifierRef.current.train((loss) => {
            if (loss !== null) {
                setCurrentLoss(loss);
            } else {
                setTrainingStatus('ready');
            }
        });
    }, []);

    const classify = useCallback(async (imageUrl, callback) => {
        if (!classifierRef.current) return;

        const img = new Image();
        img.src = imageUrl;

        // Wait for the test image to load into memory
        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => {
                console.error("Failed to load test image.");
                resolve();
            }
        });

        // Pass the HTML image element to ml5 to get the prediction
        classifierRef.current.classify(img, callback);
    }, []);


    return {
        isModelLoaded,
        trainingStatus,
        currentLoss,
        prepareAndTrain,
        classify,
    };
};