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
            // 1. Load MobileNet
            featureExtractorRef.current = window.ml5.featureExtractor('MobileNet', () => {
                console.log('MobileNet features loaded!');
                // 2. Initialize classifier without a default video element
                classifierRef.current = featureExtractorRef.current.classification(() => {
                    console.log('Classifier initialized!');
                    setIsModelLoaded(true);
                });
            });
        };

        if (window.ml5) initML5();
    }, []);

    // Takes the React dataset, loads images into memory, feeds ml5, and trains
    const prepareAndTrain = useCallback(async (dataset) => {
        if (!classifierRef.current) return;

        setTrainingStatus('preparing');

        // Iterate through the dataset object: { 'Class 1': [url1, url2], 'Class 2': [url3] }
        for (const label of Object.keys(dataset)) {
            for (const imageUrl of dataset[label]) {
                // Create an HTML Image Element in memory
                const img = new Image();
                img.src = imageUrl;

                // Wait for the image to fully load before passing to ml5
                await new Promise((resolve) => {
                    img.onload = resolve;
                });

                classifierRef.current.addImage(img, label);
            }
        }

        setTrainingStatus('training');

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
        await new Promise((resolve) => { img.onload = resolve; });

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