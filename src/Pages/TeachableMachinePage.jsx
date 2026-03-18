import {useEffect, useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';
import Class from "../components/Class.jsx";
import Button from "../ui/button.jsx";
import Prediction from "../components/Prediction.jsx";

import * as tf from '@tensorflow/tfjs';


import styles from "./TeachableMachinePage.module.css";
import {AddIcon, AlertIcon, CameraOffIcon, CheckIcon, Icon, PlayIcon} from "../ui/Icons.jsx";

function TeachableMachine() {
    const { isModelLoaded, trainingStatus, currentLoss, prepareAndTrain, classify } = useFeatureExtractor();

    const [dataset, setDataset] = useState([
        {name: "Class 1", items: [], id: 0},
        {name: "Class 2", items: [], id: 1}
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

    const handleClassDelete = (classID) => {
        setDataset(prev => prev.filter((_, index) => index !== classID));
        console.log(dataset)
    };

    const handleClassnameChange = (event, classID) => {
        const newName = event.target.value;

        setDataset(prev =>
            prev.map((cls, i) =>
                i === classID
                    ? { ...cls, name: newName }
                    : cls
            )
        );
    };

    const handleAddClass = () => {
        let newClass = {name: "Class " + (dataset.length + 1), items:  []};
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
            console.log("Data", data)
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
                    <h2>Classes</h2>
                    <div className={styles.classContainer}>
                        {dataset.map((classData, i) =>
                               <Class
                                    key={i}
                                    classIndex={i}
                                    classData={classData}
                                    onUpload={handleUpload}
                                    onDelete={handleDelete}
                                    onClassDelete={handleClassDelete}
                                    onWebcamCapture={handleWebcamCapture} // <-- Add this new prop!
                                    onNameChange={handleClassnameChange}
                                    isTraining={trainingStatus}
                               />
                        )}
                        <div className={styles.addButton}>
                            <Button
                                onClick={(e) => handleAddClass(e)}
                                disabled={trainingStatus !== "idle" && trainingStatus !== "ready"}
                                variants={["icon"]}
                            >
                                <Icon colors={["#ffffff"]}>
                                    <AddIcon />
                                </Icon>
                            </Button>
                        </div>
                    </div>
                </section>

                {/*Model information and start training*/}
                <section className={styles.trainModelCon}>
                    <h2>Train Model</h2>
                    <Button
                        variants={["hero"]}
                        onClick={() => {
                            handleTrain()
                        }}
                    >
                        <Icon colors={["#ffffff"]}>
                            <PlayIcon />
                        </Icon>
                        Train Model
                    </Button>
                    <div className={styles.alerts}>
                        {!isModelLoaded ? <div>Model loading...</div>
                            : trainingStatus === "ready" ? <div>Model trained</div>
                                : trainingStatus === "preparing" ? <div>Training Model</div>
                                    : <div>Initialised Model</div>
                        }
                        {dataset.length < 2
                            ?
                            <div className={styles.alert}>
                                <Icon colors={["crimson"]}>
                                    <AlertIcon />
                                </Icon>
                                <span>You need at least 2 classes</span>
                            </div>
                            :
                            <div className={styles.alert}>
                                <Icon colors={["mediumseagreen"]}>
                                    <CheckIcon />
                                </Icon>
                                <span>You have more than 2 classes</span>
                            </div>
                        }
                        {dataset.map((classData, i) =>
                            classData.items.length < 15
                                ?
                                <div className={styles.alert}>
                                    <Icon colors={["crimson"]}>
                                        <AlertIcon />
                                    </Icon>
                                    <span key={i}><b>{classData.name}</b> only has {classData.items.length} item{classData.items.length === 1 ? "" : "s"}</span>
                                </div>
                                :
                                <div className={styles.alert}>
                                    <Icon colors={["mediumseagreen"]}>
                                        <CheckIcon />
                                    </Icon>
                                    <span key={i}><b>{classData.name}</b> has {classData.items.length} items</span>
                                </div>
                        )}
                    </div>
                    {trainingStatus}
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
                    <div>
                        <li>Julian Pecho</li>
                        <li>Sebastian Eresheim</li>
                        <li>Lukas Metzler</li>
                        <li>Fabian Fuchs</li>
                    </div>
                </footer>
            </main>
        </>
    )
}

export default TeachableMachine
