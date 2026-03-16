import {useState, useRef, Fragment} from "react";
import Button from "../ui/button.jsx";
import LiveClassifier from "./LiveClassifier.jsx";

import styles from "./Predection.module.css";
import {CameraIcon, Icon, UploadIcon} from "../ui/Icons.jsx";

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


    return (
        <section>
            <h2>Classification</h2>
            {trainingStatus !== "ready"
            ?
            <span>
                Train the model first to unlock classification!
            </span>
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
                            {isLiveActive & !imageURL &&
                                <LiveClassifier
                                    classify={classify}
                                    isReady={trainingStatus === "ready"}
                                    isActive={isLiveActive}
                                    onPredict={setPrediction}
                                        // We pass this back up through the prop you created in Step 2!
                                />
                            }
                            {/*{heatmap && isLiveActive && (*/}
                                <img
                                    src={heatmap}
                                    alt="AI Attention Heatmap"
                                />
                            {/*)}*/}
                        </div>
                        <div className={styles.uploadButton}>
                            <Button
                                ariaLabel={"Upload image from device for classification"}
                                onClick={() => handleCustomButtonClick()}
                            >
                                <Icon colors={["#ffffff"]}>
                                    <UploadIcon />
                                </Icon>
                                <span>Upload Image</span>
                            </Button>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onFileUpload}
                                ref={hiddenFileInput}
                                style={{ display: "none" }}
                            />
                            <Button
                                ariaLabel={"Toggle camera input for classification"}
                                variant={isLiveActive ? "danger" : "primary"}
                                onClick={() => {
                                    setImageURL(null);
                                    setIsLiveActive(!isLiveActive)
                                }}
                            >
                                <Icon colors={["#ffffff"]}>
                                    <CameraIcon />
                                </Icon>
                                {isLiveActive ? "Close Camera" : "Open Camera"}
                            </Button>
                        </div>
                    </div>
                    <div className={styles.rightColumn}>
                        <h3>Prediction Results</h3>
                        {prediction ? (
                            <div className={styles.predictionTable}>
                                {prediction.map((item, index) => (
                                    <Fragment key={index}>
                                        <span>{item.label}</span>
                                        <span>{(item.confidence * 100).toFixed(1)}%</span>
                                        {/* Visual Progress Bar */}
                                        <div className={styles.progressBar}>
                                            <div
                                                style={{
                                                    width: `${item.confidence * 100}%`,
                                                    transition: "width 0.15s ease-out"
                                                }}
                                            />
                                        </div>
                                    </Fragment>
                                ))}
                            </div>
                        ) : (
                            <p>
                                Upload an image or step in front of the camera to see results.
                            </p>
                        )}
                    </div>
                </div>
            )
            }
        </section>
    );
}

export default Prediction;