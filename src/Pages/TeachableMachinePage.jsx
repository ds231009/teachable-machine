import {useEffect, useRef, useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';
import Class from "../components/Class.jsx";
import Button from "../ui/button.jsx";
import Prediction from "../components/Prediction.jsx";

import * as tf from '@tensorflow/tfjs';


import styles from "./TeachableMachinePage.module.css";
import {AddIcon, AlertIcon, CameraOffIcon, CheckIcon, ChevronIcon, Icon, PlayIcon} from "../ui/Icons.jsx";

function TeachableMachine() {
    const { isModelLoaded, trainingStatus, currentLoss, prepareAndTrain, classify } = useFeatureExtractor();

    const [dataset, setDataset] = useState([
        {name: "Class 1", items: [], id: 0},
        {name: "Class 2", items: [], id: 1}
    ])

    const [prediction, setPrediction] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [showDescription, setShowDescription] = useState(false);
    const [activeCameraID, setActiveCameraID] = useState(null);
    const [activeSection, setActiveSection] = useState("heroSection");

    const predictionSectionRef = useRef(null);
    const trainSectionRef = useRef(null);
    const heroSectionRef = useRef(null);

    useEffect(() => {
        console.log(isModelLoaded ? "DA": "NE",trainingStatus)
    }, [isModelLoaded,trainingStatus]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.5 }); // 0.5 means 50% of the section is visible

        const sections = document.querySelectorAll("section");
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect(); // Cleanup
    }, []);
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

    useEffect(() => {
        if (trainingStatus === "ready" && predictionSectionRef.current) {
            setTimeout(() => {
                predictionSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }, [trainingStatus]); // <-- This array tells React to run this effect whenever this variable changes

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
            <nav>
                {[{text: "Upload Images", sectionId: "heroSection", sectionRef: heroSectionRef},
                    {text: "Train Model", sectionId: "trainSection", sectionRef: trainSectionRef},
                    {text: "Classify", sectionId: "predictionSection", sectionRef: predictionSectionRef}]
                    .map((section, id) =>
                    <Button
                        key={id}
                        variants={["transparent"]}
                        onClick={() => section.sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    >
                        <span className={activeSection === section.sectionId ? styles.activeNav : styles.passiveNav}>
                            <b>{id}</b>{section.text}
                        </span>
                    </Button>
                )}
            </nav>
            <main>
                <header>
                    <div className={styles.ustpLogoCon}>
                        <img
                            src={"/ustp-logo.png"}
                            alt={"USTP logo"}
                        />
                    </div>
                    <div className={styles.eudresLogoCon}>
                        <img
                            src={"/eudres-logo.png"}
                            alt={"Eudres logo"}
                        />
                    </div>
                </header>

                {/*Hero section with description*/}
                <section id="heroSection" className={`${styles.hero} ${showDescription ? styles.active : ""}`}>
                    <h1>
                        Teachable Machine with TensorFlow.js
                    </h1>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel sapien eget nunc efficitur varius. Sed at felis a enim efficitur commodo. In hac habitasse platea dictumst. Nulla facilisi. Donec ac odio a nisl convallis tincidunt. Suspendisse potenti.
                    </p>
                    <div className={`${styles.description} ${showDescription ? styles.active : ""}`}>
                        <span style={{minHeight: 0}}>Extra blabla</span>
                    </div>
                    <Button
                        ariaLabel={"Expand project description"}
                        variants={["transparent"]}
                        onClick={() => setShowDescription(showDescription => !showDescription)}
                    >
                        <Icon>
                            <ChevronIcon />
                        </Icon>
                        {!showDescription ? "Learn more" : ""}
                    </Button>
                </section>

                {/* Class section for defining classes and uploading pictures*/}
                <section ref={heroSectionRef} className={styles.classes}>
                    <h2>Classes</h2>
                    <div className={styles.classContainer}>
                        <div style={{width: "32px"}}></div>
                        {dataset.map((classData, i) =>
                               <Class
                                    key={i}
                                    classIndex={i}
                                    classData={classData}
                                    activeCameraID={activeCameraID}
                                    onUseCamera={setActiveCameraID}
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
                                ariaLabel={"Add Class"}
                                variants={["icon"]}
                                onClick={(e) => handleAddClass(e)}
                                disabled={trainingStatus !== "idle" && trainingStatus !== "ready"}
                            >
                                <Icon colors={["#ffffff"]}>
                                    <AddIcon />
                                </Icon>
                            </Button>
                        </div>
                    </div>
                    <div className={styles.alerts}>

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
                                <Icon colors={["#15c764"]}>
                                    <CheckIcon />
                                </Icon>
                                <span>You have more than <b>2 classes</b></span>
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
                    <Button
                        variants={["transparent"]}
                        onClick={() => trainSectionRef.current ? trainSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }) : null}
                    >
                        Continue
                    </Button>
                </section>

                {/*Model information and start training*/}
                <section ref={trainSectionRef} id="trainSection" className={styles.trainModelCon}>
                    <h2>Train Model</h2>
                    <span>Now that we defined our classes we can train the model on our images.</span>
                    <Button
                        ariaLabel={"Train Model"}
                        variants={
                            !isModelLoaded ? ["hero", "loading"]
                            : trainingStatus === "ready" ? ["hero", "trained"]
                            : trainingStatus === "preparing" ? ["hero", "training"]
                            : ["hero", "loaded"]
                        }
                        onClick={() => {handleTrain()}}
                    >
                        {isModelLoaded && trainingStatus === "idle" ? <Icon colors={["#ffffff"]}><PlayIcon /></Icon> : null}
                        {!isModelLoaded ? "Initialising model..."
                            : trainingStatus === "ready" ? "Model trained"
                                : trainingStatus === "preparing" || trainingStatus === "training" ? "Training model"
                                    : "Train model"}
                    </Button>
                </section>

                {/*Picture Classification or live classification*/}
                <section id="predictionSection" ref={predictionSectionRef}>
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
                </section>

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
