import { useState, useRef } from "react";
import Button from "../ui/button.jsx";
import LiveClassifier from "./LiveClassifier.jsx";

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
            <h3>Classification</h3>
            {trainingStatus !== "ready"
            ?
                <div>
                    <span>
                        Train the model first to unlock classification!
                    </span>
                </div>
            :
            (
                <div>
                    <div>
                        <div>
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
                            {heatmap && isLiveActive && (
                                <img
                                    src={heatmap}
                                    alt="AI Attention Heatmap"
                                    className="absolute top-0 left-0 w-full h-full object-cover rounded-lg pointer-events-none mix-blend-screen opacity-80"
                                />
                            )}
                            <div>
                                <Button onClick={() => handleCustomButtonClick()}>Upload</Button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileUpload}
                                    ref={hiddenFileInput}
                                    style={{ display: "none" }}
                                />
                                <Button
                                    variant={isLiveActive ? "danger" : "primary"}
                                    onClick={() => {
                                        setImageURL(null);
                                        setIsLiveActive(!isLiveActive)
                                    }}
                                >
                                    {isLiveActive ? "Stop Camera" : "Start Camera"}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4>Prediction Results</h4>
                        {prediction ? (
                            <ul>
                                {prediction.map((item, index) => (
                                    <li key={index} className="flex flex-col">
                                        <div>
                                            <span>{item.label}</span>
                                            <span>{(item.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                        {/* Visual Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{
                                                    width: `${item.confidence * 100}%`,
                                                    transition: "width 0.15s ease-out"
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
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