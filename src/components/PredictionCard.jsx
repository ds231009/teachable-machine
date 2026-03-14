import { useState, useRef } from "react";
import Button from "../ui/button.jsx";
import LiveClassifier from "./LiveClassifier.jsx";

function Prediction({
        trainingStatus,
        prediction,
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
        <section className="flex flex-col gap-8 my-16">
            <h3 className="p-4 text-2xl font-semibold">Classification</h3>
            {trainingStatus !== "ready"
            ?
                <div className="p-4 bg-gray-50 text-gray-500 italic">
                    <span>
                        Train the model first to unlock classification!
                    </span>
                </div>
            :
            (
                <div className="flex flex-row justify-center">
                    <div className="w-128 flex flex-col gap-6">
                        <div className="p-4 border rounded-lg shadow-sm">
                            {imageURL && !isLiveActive &&
                                <img
                                    src={imageURL}
                                    alt="Classification Input"
                                    className="w-64 h-64 rounded-lg object-contain bg-gray-200"
                                />
                            }
                            {isLiveActive & !imageURL &&
                                <LiveClassifier
                                    classify={classify}
                                    isReady={trainingStatus === "ready"}
                                    isActive={isLiveActive}
                                    onPredict={setPrediction}
                                />
                            }
                            <div className="flex justify-between w-full items-center">
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
                    <div className="w-128 p-6 rounded-lg">
                        <h4 className="font-bold text-xl mb-4">Prediction Results</h4>
                        {prediction ? (
                            <ul className="flex flex-col gap-4">
                                {prediction.map((item, index) => (
                                    <li key={index} className="flex flex-col">
                                        <div className="flex justify-between font-medium mb-1">
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
                            <p className="text-gray-500 italic">
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