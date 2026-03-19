import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

export const useFeatureExtractor = () => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState('idle');
    const [currentLoss, setCurrentLoss] = useState(null);

    // TF.js Model Refs
    const mobilenetRef = useRef(null);
    const customModelRef = useRef(null);
    // We need to save the class names to map the math output [0, 1] back to ["Dogs", "Cats"]
    const classLabelsRef = useRef([]);

    useEffect(() => {
        const loadModel = async () => {
            console.log("Downloading MobileNet v1...");
            // Load the raw MobileNet model directly from Google's servers
            const mobilenet = await tf.loadLayersModel(
                // 'httpsaaaaaaaaa://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json'
                'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json'
            );

            // SLICE THE MODEL: We don't want it to classify 1000 generic objects.
            // We want the raw visual features from the last mathematical layer.
            const layer = mobilenet.getLayer('conv_pw_13_relu');
            mobilenetRef.current = tf.model({ inputs: mobilenet.inputs, outputs: layer.output });

            // Warm up the GPU (prevents freezing on the first webcam frame)
            tf.tidy(() => { mobilenetRef.current.predict(tf.zeros([1, 224, 224, 3])); });

            console.log("MobileNet Feature Extractor Ready!");
            setIsModelLoaded(true);
        };

        loadModel();

        return () => {
            console.log("Component unmounting: Scrubbing GPU memory...");
            if (mobilenetRef.current) {
                mobilenetRef.current.dispose();
            }
            if (customModelRef.current) {
                customModelRef.current.dispose();
            }
            // If you want to be absolutely sure EVERYTHING is gone:
            // tf.disposeVariables();
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const mem = tf.memory();
            console.log(`GPU Tensors: ${mem.numTensors} | Memory: ${(mem.numBytes / 1024 / 1024).toFixed(2)} MB`);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Helper: Converts an HTML Image or Video element into a cropped 224x224 Tensor
    const processImageToTensor = (imgElement) => {
        return tf.tidy(() => {
            // Convert to tensor, ensure 3 color channels, resize to 224x224, and normalize between -1 and 1
            const imgTensor = tf.browser.fromPixels(imgElement);
            const resized = tf.image.resizeBilinear(imgTensor, [224, 224]);
            const normalized = resized.div(tf.scalar(127.5)).sub(tf.scalar(1.0));
            return normalized.expandDims(0); // Add batch dimension: [1, 224, 224, 3]
        });
    };

    const prepareAndTrain = useCallback(async (currentDataset) => {
        if (!mobilenetRef.current) return;
        setTrainingStatus('preparing');

        // 1. Gather all labels and initialize Tensors
        const classNames = currentDataset.map(c => c.name);
        classLabelsRef.current = classNames;
        const numClasses = classNames.length;

        const xsArray = []; // Features
        const ysArray = []; // Labels

        // 2. Loop through UI Data and extract features via WebGL
        for (let classIndex = 0; classIndex < currentDataset.length; classIndex++) {
            const classObj = currentDataset[classIndex];

            for (const imageUrl of classObj.items) {
                const img = new Image();
                img.src = imageUrl;
                await new Promise((resolve) => { img.onload = resolve; });

                // CRITICAL FIX: Return the tensors from tidy so they aren't destroyed!
                const { featureTensor, labelTensor } = tf.tidy(() => {
                    const imgTensor = processImageToTensor(img);
                    const features = mobilenetRef.current.predict(imgTensor);

                    return {
                        featureTensor: features.squeeze(),
                        labelTensor: tf.oneHot(tf.tensor1d([classIndex], 'int32'), numClasses).squeeze()
                    };
                });

                xsArray.push(featureTensor);
                ysArray.push(labelTensor);
            }
        }

        if (xsArray.length === 0) {
            alert("Please upload images before training.");
            setTrainingStatus('idle');
            return;
        }

        setTrainingStatus('training');

        // Stack our arrays into massive Data Tensors
        const xs = tf.stack(xsArray);
        const ys = tf.stack(ysArray);

        // CLEANUP FIX: Now that they are safely stacked, delete the individual tensors from memory
        tf.dispose(xsArray);
        tf.dispose(ysArray);

        // 3. Build our Custom Neural Network Head
        customModelRef.current = tf.sequential({
            layers: [
                tf.layers.flatten({ inputShape: mobilenetRef.current.outputs[0].shape.slice(1) }),
                tf.layers.dense({ units: 100, activation: 'relu' }),
                tf.layers.dense({ units: numClasses, activation: 'softmax' })
            ]
        });

        // 4. Compile the Model (Adam Optimizer)
        customModelRef.current.compile({
            optimizer: tf.train.adam(0.0001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        // 5. Train the Model!
        await customModelRef.current.fit(xs, ys, {
            epochs: 20,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    setCurrentLoss(logs.loss.toFixed(4));
                    await tf.nextFrame();
                }
            }
        });

        // Clean up our massive training tensors from GPU memory
        tf.dispose([xs, ys]);
        setTrainingStatus('ready');
    }, []);

    const classify = useCallback(async (input, callback) => {
        if (!mobilenetRef.current || !customModelRef.current) return;

        let imgElement = input;
        if (typeof input === 'string') {
            imgElement = new Image();
            imgElement.src = input;
            await new Promise((resolve) => { imgElement.onload = resolve; });
        }

        // 1. DO THE MATH: We wrap the heavy lifting in tidy to prevent memory leaks
        const { rgbaTensor, results } = tf.tidy(() => {
            const imgTensor = processImageToTensor(imgElement);

            // Forward Pass
            const features = mobilenetRef.current.predict(imgTensor);
            const predictions = customModelRef.current.predict(features);

            // Format Results
            const results = Array.from(predictions.dataSync())
                .map((prob, index) => ({
                    label: classLabelsRef.current[index],
                    confidence: prob,
                    classIndex: index
                }))
                .sort((a, b) => b.confidence - a.confidence);

            // --- THE GRAD-CAM MAGIC ---
            const topClassIndex = results[0].classIndex;

            // A function that takes feature maps and returns the score of the WINNING class
            const getScore = (featureMap) => customModelRef.current.predict(featureMap).slice([0, topClassIndex], [1, 1]).squeeze();

            // Calculate the gradients (the derivative of the score with respect to the features)
            const gradFunction = tf.grad(getScore);
            const gradients = gradFunction(features);

            // Average the gradients spatially to get the "importance weights" for each channel
            const weights = tf.mean(gradients, [1, 2]);

            // Multiply the features by their importance weights and combine them
            const weightedFeatures = features.mul(weights.reshape([1, 1, 1, -1]));
            const heatmap = tf.sum(weightedFeatures, 3);

            // Apply ReLU (only keep positive influences) and normalize between 0 and 1
            const reluHeatmap = tf.relu(heatmap);
            const max = tf.max(reluHeatmap);
            const min = tf.min(reluHeatmap);
            // We add 1e-7 to the denominator so we never accidentally divide by zero!
            const normalizedHeatmap = reluHeatmap.sub(min).div(max.sub(min).add(tf.scalar(1e-7)));

            // Resize back to 224x224
            const resizedHeatmap = tf.image.resizeBilinear(normalizedHeatmap.expandDims(-1), [224, 224]).squeeze();

            // Create a Red RGBA visual layer.
            // Red = 1.0, Green = 0.0, Blue = 0.0, Alpha = the heatmap intensity
            const zeros = tf.zerosLike(resizedHeatmap);
            const ones = tf.onesLike(resizedHeatmap);
            const rgba = tf.stack([ones, zeros, zeros, resizedHeatmap], -1);

            return { rgbaTensor: rgba, results };
        });

        // 2. DRAW THE VISUAL: Convert the raw Tensor into a base64 Image URL
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        await tf.browser.toPixels(rgbaTensor, canvas);

        // 3. CLEANUP: Manually delete the tensor now that we have drawn it
        rgbaTensor.dispose();

        // 4. Send both the predictions AND the heatmap back to the UI
        callback(null, { results, heatmapUrl: canvas.toDataURL() });
    }, []);

    return { isModelLoaded, trainingStatus, currentLoss, prepareAndTrain, classify };
};