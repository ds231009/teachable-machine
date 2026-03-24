import {useState, useRef, Fragment} from "react";
import Button from "../ui/button.jsx";
import LiveClassifier from "./LiveClassifier.jsx";

import styles from "./Predection.module.css";
import {CameraIcon, CameraOffIcon, Icon, UploadIcon} from "../ui/Icons.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";

function Prediction({
        trainingStatus,
        prediction,
        heatmap,
        handleTestUpload,
        classify,
        setPrediction
    }) {
    // NEW: State to track if the webcam is actively predicting
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [imageURL, setImageURL] = useState(null);
    const [showHeatmap, setShowHeatmap] = useState(false);

    const hiddenFileInput = useRef(null);
    const handleCustomButtonClick = () => {
        hiddenFileInput.current.click();
    };

    // Intercept the upload so we can pause the camera automatically
    const onFileUpload = (e) => {
        setImageURL(URL.createObjectURL(e.target.files[0])); // Show the uploaded image
        setIsLiveActive(false); // Pause the live feed!
        handleTestUpload(e);    // Run the static prediction
    };

    const sorted = prediction
        ? [...prediction].sort((a, b) => a.classIndex - b.classIndex)
        : null;



    return (
        <>
            <h2>Classification</h2>
            {trainingStatus !== "ready"
            ?
            <>
                <span className={trainingStatus !== "ready" ?styles.waitReady : ""}>
                    With a fully trained model, you can now put it to the real-world test. By showing the model completely new, unseen images, it will calculate a real-time prediction of which class the image belongs to, complete with a confidence score.
                </span>
                <span style={{fontWeight: "bold"}}>
                    Train the model first to unlock classification!
                </span>
            </>
            :
            (
                <div className={styles.predictionCon}>
                    <div className={styles.leftColumn}>
                        <div className={styles.imageToClassify}>
                            {imageURL && !isLiveActive &&
                                <img
                                    src={imageURL}
                                    alt="Classification Input"
                                />
                            }
                            {isLiveActive && !imageURL &&
                                <LiveClassifier
                                    classify={classify}
                                    isReady={trainingStatus === "ready"}
                                    isActive={isLiveActive}
                                    onPredict={setPrediction}
                                        // We pass this back up through the prop you created in Step 2!
                                />
                            }
                            {showHeatmap && heatmap && (
                                <img
                                    src={heatmap}
                                    alt="AI Attention Heatmap"
                                />
                            )}
                            {!imageURL && !isLiveActive &&
                                <div className={styles.inplaceButtons}>
                                    <Button
                                        ariaLabel={"Upload image from device for classification"}
                                        title={"Upload image"}
                                        variants={["icon"]}
                                        onClick={() => handleCustomButtonClick()}
                                    >
                                        <Icon colors={["#ffffff"]}>
                                            <UploadIcon />
                                        </Icon>
                                    </Button>
                                    <Button
                                        ariaLabel={"Toggle camera input for classification"}
                                        title={"Open Camera"}
                                        variants={["icon"]}
                                        onClick={() => {
                                            setImageURL(null);
                                            setIsLiveActive(!isLiveActive)
                                        }}
                                    >
                                        <Icon colors={["#ffffff"]}>
                                            <CameraIcon />
                                        </Icon>
                                    </Button>
                                </div>
                            }
                        </div>
                        {!isLiveActive && !imageURL
                            ?
                            <span>
                                Upload an image or use the camera for classification.
                            </span>
                            :
                            <div className={styles.uploadButton}>
                                <div className={styles.left}>
                                    <Button
                                        ariaLabel={"Upload image from device for classification"}
                                        title={"Upload image"}
                                        variants={["icon"]}
                                        onClick={() => handleCustomButtonClick()}
                                    >
                                        <Icon colors={["#ffffff"]}><UploadIcon /></Icon>
                                    </Button>
                                    <Button
                                        ariaLabel={"Toggle camera input for classification"}
                                        title={isLiveActive ? "Close Camera" : "Open Camera"}
                                        variants={isLiveActive ? ["icon", "alarm"] : ["icon"]}
                                        onClick={() => {
                                            setImageURL(null);
                                            setIsLiveActive(!isLiveActive)
                                        }}
                                    >
                                        <Icon colors={["#ffffff"]}>
                                            {isLiveActive ? <CameraOffIcon /> : <CameraIcon />}
                                        </Icon>
                                    </Button>
                                </div>
                                <div>
                                    <Button
                                    ariaLabel={"Toggle Heatmap classification"}
                                    onClick={() => setShowHeatmap(prev => !prev)}
                                    >
                                        {!showHeatmap ? "Show Heatmap" : "Hide Heatmap"}
                                    </Button>
                                </div>
                            </div>
                        }
                    </div>
                    <div className={styles.rightColumn}>
                        <h3>Prediction Results</h3>
                        {sorted ? (
                            <div className={styles.predictionTable}>
                                {sorted.map((item, index) => (
                                    <Fragment key={index}>
                                        <span>{item.label}</span>
                                        <span>{(!isLiveActive && !imageURL ? 0 : item.confidence * 100).toFixed(1)}%</span>
                                        {/* Visual Progress Bar */}
                                        <ProgressBar color={`hsl(${!isLiveActive && !imageURL ? 0 : item.classIndex*80},70%,60%)`} variant={"fixed"} progress={!isLiveActive && !imageURL ? 0 : item.confidence} />
                                    </Fragment>
                                ))}
                            </div>
                        ) : (
                            <span>
                                Upload an image or step in front of <br /> the camera to see results.
                            </span>
                        )}
                    </div>
                </div>
            )
            }
            <input
                type="file"
                accept="image/*"
                onChange={onFileUpload}
                ref={hiddenFileInput}
                style={{ display: "none" }}
            />
        </>
    );
}

export default Prediction;