import {useEffect, useRef, useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';
import Button from "../ui/Button.jsx";

import Class from "../components/Class.jsx";
import Prediction from "../components/Prediction.jsx";
import Train from "../components/Train.jsx"

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
    const [activeSection, setActiveSection] = useState("classSection");
    const [changedAfterTrained, setChangedAfterTrained] = useState(false);

    const predictionSectionRef = useRef(null);
    const trainSectionRef = useRef(null);
    const classSectionRef = useRef(null);


    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.5 ,
            // rootMargin: "-40% 0px -40% 0px"
        }); // 0.5 means 50% of the section is visible

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
        setChangedAfterTrained(true)

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
        setChangedAfterTrained(true)

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
        setChangedAfterTrained(true)
        setDataset(prev => prev.filter((_, index) => index !== classID));
        console.log(dataset)
    };

    const handleClassnameChange = (event, classID) => {
        setChangedAfterTrained(true)
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
        setChangedAfterTrained(true)
        let newClass = {name: "Class " + (dataset.length + 1), items:  []};
        console.log(dataset.length);
        setDataset(prev => [...prev, newClass])
    };

    const handleTrain = () => {
        setChangedAfterTrained(false);
        prepareAndTrain(dataset);
    };

    useEffect(() => {
        if (trainingStatus === "ready" && predictionSectionRef.current) {
            setTimeout(() => {
                predictionSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                {[{text: "Upload Images", sectionId: "classSection", sectionRef: classSectionRef, conditionMet: dataset?.length > 0},
                    {text: "Train Model", sectionId: "trainSection", sectionRef: trainSectionRef, conditionMet: trainingStatus === "ready"},
                    {text: "Classify", sectionId: "predictionSection", sectionRef: predictionSectionRef, conditionMet: trainingStatus === "ready"}]
                    .map((section, id) =>
                    <Button
                        key={id}
                        variants={["transparent"]}
                        onClick={() => section.sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    >
                        <div
                            className={`${styles.navItem} ${section.conditionMet ? styles.conditionMet : ""} ${activeSection === section.sectionId ? styles.active : styles.passive}`}
                        >
                            <div className={styles.navNum}>
                                <b>{id}</b>
                            </div>
                            <span className={styles.navText}>
                                {section.text}
                            </span>
                        </div>
                    </Button>
                )}
            </nav>
            <main>
                <header class="navbar">
                        <a class="navbar-brand" href="/">
                            <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M75.3971 91.83C70.8497 91.4523 66.6499 90.3119 62.7375 88.3924C56.3842 85.2755 51.1013 80.2413 47.7385 74.0996L47.2084 73.1315L48.802 72.817C58.5582 70.8921 66.6241 63.6366 69.5781 54.1282C70.6148 50.7912 70.6507 50.4398 70.719 42.9403L70.781 36.1321H91.3905H112L111.935 48.1661C111.891 56.3149 111.814 60.5803 111.697 61.3777C111.067 65.6535 110.045 69.0225 108.303 72.5652C106.408 76.4185 104.413 79.161 101.283 82.2164C96.0573 87.3163 89.4955 90.5555 82.3736 91.5509C80.6859 91.7868 76.7649 91.9437 75.3971 91.83ZM39.7736 73.06C38.2153 72.8628 35.3113 72.1217 33.7792 71.5304C23.8189 67.6863 17.1541 58.8935 16.1529 48.2765C16.069 47.3859 16.0002 44.2891 16.0001 41.3947L16 36.1321H29.679H43.358L43.4202 48.4605C43.4865 61.6223 43.4837 61.5661 44.2694 65.205C44.6766 67.0905 45.5209 69.6573 46.3578 71.5538L47.0158 73.0447L46.2652 73.1349C45.1976 73.2632 40.9957 73.2147 39.7736 73.06Z" fill="#0074CC"/>
                            </svg>
                            Teachable Machine
                        </a>
                </header>

                {/*Hero section with description*/}
                <section id="heroSection" className={`${styles.hero} ${showDescription ? styles.active : ""}`}>
                    <h1>
                        Live Image Classification
                    </h1>
                    <p>
                        Ever wonder how artificial intelligence recognizes faces, reads handwriting, or drives cars?
                        It all starts with data. This tool lets you build a real, working machine learning model right in your browser.
                        You don't need to know how to code you just need your webcam and a few objects to get started.
                    </p>
                    {/* <div className={`${styles.description} ${showDescription ? styles.active : ""}`}>
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
                    </Button> */}
                </section>

                {/* Class section for defining classes and uploading pictures*/}
                <section id="classSection" ref={classSectionRef} className={styles.classes}>
                    <h2>Define Classes</h2>
                    <span>
                        The foundation of any machine learning model is its dataset. In this step, you create distinct categories (classes) and feed the system examples of each using your webcam or uploaded images. The more diverse and numerous your examples, the better the model will become at recognizing the unique visual patterns that define each class.
                    </span>
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
                        onClick={() => trainSectionRef.current ? trainSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }) : null}
                    >
                        Continue
                    </Button>
                </section>

                {/*Model information and start training*/}
                <section ref={trainSectionRef} id="trainSection" className={styles.trainModelCon}>
                    <Train
                        handleTrain={() => handleTrain()}
                        trainingStatus={trainingStatus}
                        isModelLoaded={isModelLoaded}
                        changedAfterTrained={changedAfterTrained}
                    />
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
                <footer class="footer">
                    <span>Teachable Machine © 2026 | University of Applied Sciences St. Pölten</span>
                    <div>
                        <img width="125px" src="public\ustp-logo.png" />
                        <img width="115px" src="public\eudres-logo.png" />
                    </div>
                </footer>
            </main>
        </>
    )
}

export default TeachableMachine
