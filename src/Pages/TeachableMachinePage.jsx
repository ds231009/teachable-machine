import {useEffect, useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';
import Class from "../components/Class.jsx";
import Button from "../ui/button.jsx";
import Prediction from "../components/PredictionCard.jsx";

import * as tf from '@tensorflow/tfjs';


import styles from "./TeachableMachinePage.module.css";

function TeachableMachine() {
    const { isModelLoaded, trainingStatus, currentLoss, prepareAndTrain, classify } = useFeatureExtractor();

    const [dataset, setDataset] = useState([
        {className: "Class 1", items: []},
        {className: "Class 2", items: []}
    ])

    const [prediction, setPrediction] = useState(null);
    const [heatmap, setHeatmap] = useState(null);

    useEffect(() => {
        return () => {
            console.log("Teachable Machine unmounted. ");
            tf.disposeVariables();
            tf.engine().reset();
        };
    }, []);

    const handleUpload = (event, classID) => {
        const files = Array.from(event.target.files);
        const newImageUrls = files.map(file => URL.createObjectURL(file));

        setDataset(prev =>
            prev.map((cls, i) =>
                i === classID
                    ? { ...cls, items: [...cls.items, ...newImageUrls] }
                    : cls
            )
        );
    };

    const handleDelete = (classID, itemID) => {
        setDataset(prev => (
            prev.map((cls, i) =>
                i === classID
                ?  { ...cls, items: cls.items.filter((_, index) => index !== itemID) }
                : cls
            )
        ));
        console.log(dataset)
    };

    const handleClassnameChange = (event, classID) => {
        const newName = event.target.value;

        setDataset(prev =>
            prev.map((cls, i) =>
                i === classID
                    ? { ...cls, className: newName }
                    : cls
            )
        );
    };

    const handleAddClass = () => {
        let newClass = {className: "Class " + (dataset.length + 1), items:  []};
        console.log(dataset.length);
        setDataset(prev => [...prev, newClass])
    };

    const handleTrain = () => {
        prepareAndTrain(dataset);
    };

    const handleWebcamCapture = (classIndex, imageString) => {
        setDataset(prev => prev.map((cls, i) =>
            i === classIndex ? { ...cls, items: [...cls.items, imageString] } : cls
        ));
    };

    const handleTestUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const testImageUrl = URL.createObjectURL(file);
        classify(testImageUrl, (error, data) => {
            if (error) {
                console.error(error);
                return;
            }
            // Update both states from the static image too!
            setPrediction(data.results);
            setHeatmap(data.heatmapUrl);
        });
    };

    return (
        <>
            <header>
                <div className={styles.ustpLogoCon}>
                    <img
                        src={"/ustp-logo.png"}
                        alt={"USTP logo"}
                    />
                </div>
                <div className={styles.stepsCon}>
                    <div>① Upload Images</div>
                    <div>② Train Model</div>
                    <div>③ Classify</div>
                </div>
                <div className={styles.eudresLogoCon}>
                    <img
                        src={"/eudres-logo.png"}
                        alt={"Eudres logo"}
                    />
                </div>
            </header>
            <main>

                {/*Hero section with description*/}
                <section className={styles.hero}>
                    <h1>
                        Teachable Machine with TensorFlow.js
                    </h1>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel sapien eget nunc efficitur varius. Sed at felis a enim efficitur commodo. In hac habitasse platea dictumst. Nulla facilisi. Donec ac odio a nisl convallis tincidunt. Suspendisse potenti.
                    </p>
                </section>

                {/* Class section for defining classes and uploading pictures*/}
                <section className={styles.classes}>
                    <div className={styles.classContainer}>
                        {dataset.map((classData, i) =>
                               <Class
                                    key={i}
                                    classIndex={i}
                                    classData={classData}
                                    onUpload={handleUpload}
                                    onDelete={handleDelete}
                                    onWebcamCapture={handleWebcamCapture} // <-- Add this new prop!
                                    onNameChange={handleClassnameChange}
                                    isTraining={trainingStatus}
                               />
                        )}
                        <div>

                        <Button
                                onClick={(e) => handleAddClass(e)}
                                disabled={trainingStatus !== "idle" && trainingStatus !== "ready"}
                                variant={"default"}
                            >
                                New class
                            </Button>
                        </div>
                    </div>
                </section>

                {/*Model information and start training*/}
                <section>
                    <h3>Train Model</h3>
                    {!isModelLoaded
                        ? <div>Model loading</div>
                        : null
                    }
                    <Button
                        onClick={(e) => {
                            handleTrain()
                        }}
                    >
                        Train
                    </Button>
                    <div>{trainingStatus}</div>
                </section>

                {/*Picture Classification or live classification*/}
                <Prediction
                    trainingStatus={trainingStatus}
                    prediction={prediction}
                    heatmap={heatmap}
                    handleTestUpload={handleTestUpload}
                    classify={classify}
                    setPrediction={(data) => {
                        setPrediction(data.results);
                        setHeatmap(data.heatmapUrl);
                    }}
                />

                {/*Footer for contributors and tech stack*/}
                <footer>
                    contributors...
                </footer>
            </main>
        </>
    )
}

export default TeachableMachine
