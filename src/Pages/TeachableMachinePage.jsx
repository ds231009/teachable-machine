import {useEffect, useRef, useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';
import Button from "../ui/button.jsx";

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
    const [changedAfterTrained, setChangedAfterTrained] = useState(true);

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
