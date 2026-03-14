import {useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';
import ClassCard from "../components/ClassCard.jsx";
import Button from "../ui/button.jsx";
import Prediction from "../components/PredictionCard.jsx";

import styles from "./TeachableMachinePage.module.css";

function TeachableMachine() {
    const { isModelLoaded, trainingStatus, currentLoss, prepareAndTrain, classify } = useFeatureExtractor();

    const [dataset, setDataset] = useState([
        {className: "Class 1", items: []},
        {className: "Class 2", items: []}
    ])
    const [changingClassname, setChangingClassname] = useState(null)
    const [prediction, setPrediction] = useState(null);

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
        classify(testImageUrl, (error, results) => {
            if (error) {
                console.error(error);
                return;
            }
            // 'results' is already the exact array you asked for!
            setPrediction(results);
        });
    };

    return (
        <>
            <header className={styles.header}>
                <div>USTP</div>
                <div>SAINT</div>
            </header>
            <main>
                <section className={styles.hero}>
                    <h1>
                        Teachable Machine with TensorFlow.js
                    </h1>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel sapien eget nunc efficitur varius. Sed at felis a enim efficitur commodo. In hac habitasse platea dictumst. Nulla facilisi. Donec ac odio a nisl convallis tincidunt. Suspendisse potenti.
                    </p>
                </section>
                <section className={styles.classes}>
                    <h3>Classes {changingClassname}</h3>
                    <div className={styles.classContainer}>
                        {dataset.map((classData, i) =>
                               <ClassCard
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
                        <Button
                            onClick={(e) => handleAddClass(e)}
                            disabled={trainingStatus !== "idle" && trainingStatus !== "ready"}
                            variant={"default"}
                        >
                            New class
                        </Button>
                    </div>
                </section>
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
                    <Prediction
                        trainingStatus={trainingStatus}
                        prediction={prediction}
                        handleTestUpload={handleTestUpload}
                        classify={classify}
                        setPrediction={setPrediction}
                    />
                <footer className={"w-max px-4 py-2 flex justify-start"}>
                    contributors...
                </footer>
            </main>
        </>
    )
}

export default TeachableMachine
