import {useState, useRef} from "react";
import Button from "../ui/button.jsx";
import WebcamFeed from "./WebcamFeed.jsx";

import styles from "./Class.module.css";
import {CameraIcon, CameraOffIcon, CheckIcon, Icon, PencilIcon, UploadIcon, XIcon} from "../ui/Icons.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import WebcamButton from "./WebcamButton.jsx";

function Class({
        classIndex,
        classData,
        activeCameraID,
        onUseCamera,
        onUpload,
        onDelete,
        onClassDelete,
        onWebcamCapture,
        onNameChange,
        isTraining
    }) {

    const [isEditingName, setIsEditingName] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const isCameraActive = activeCameraID === classIndex;

    const handleCapture = (imageDataUrl) => {
        onWebcamCapture(classIndex,imageDataUrl);
    };

    const hiddenFileInput = useRef(null);

    const handleCustomButtonClick = () => {
        hiddenFileInput.current.click();
    };

    return (
    <div key={classIndex} className={styles.class}>
        <div className={styles.classHeader}>
            {!isEditingName
                ?
                <div>
                    <h5>{classData.name} </h5>
                    <Button
                        ariaLabel={"Change Class name"}
                        variants={["transparent","icon"]}
                        onClick={() => setIsEditingName(true)}
                    >
                        <Icon><PencilIcon /></Icon>
                    </Button>
                </div>
                : (
                <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                        className={styles.inputClassname}
                        type="text"
                        value = {classData.name}
                        onChange={(e) => onNameChange(e,classIndex)}
                    />
                    <Button
                        ariaLabel={"Save name change"}
                        onClick={() => setIsEditingName(false)}
                    >
                        Save
                    </Button>
                </div>
                )
            }
            <div>
                <Button
                    ariaLabel={"Delete Class"}
                    variants={["transparent","icon"]}
                    onClick={() => onClassDelete(classIndex)}
                >
                    <Icon colors={["crimson"]}>
                        <XIcon />
                    </Icon>
                </Button>
            </div>
        </div>
        <div className={styles.classGallery}>
            {!isCameraActive ? classData.items.map((item, j) =>
                <div key={j} className={styles.classPicture}>
                    <img src={item} alt="" />
                    <Button
                        ariaLabel={"Delete image"}
                        variants={["transparent", "icon", "small"]}
                        onClick={() => onDelete(classIndex,j)}
                    >
                        <Icon size={10}>
                            <XIcon />
                        </Icon>
                    </Button>
                </div>
            ) : null}
        </div>
        <div className={styles.classUpload}>
            {isCameraActive
            ? <div>
                    <WebcamFeed
                        isRecording={isRecording}
                        onCapture={handleCapture}
                    />
                </div>
            : null
            }
            <div className={styles.bottomRow}>
                <div className={styles.classUploadButtons}>
                    <div className={styles.left}>
                        <Button
                            ariaLabel={"Upload image from device for training"}
                            title={"Upload image"}
                            variants={["icon"]}
                            onClick={handleCustomButtonClick}
                            disabled={isTraining !== "idle" && isTraining !== "ready"}
                        >
                            <Icon colors={["#ffffff"]}><UploadIcon /></Icon>
                        </Button>
                        <input
                            style={{display: "none"}}
                            type="file"
                            ref={hiddenFileInput}
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                                onUpload(e, classIndex);
                                e.target.value = null; // <-- Resets the input so you can upload the same file again!
                            }}
                            disabled={isTraining !== "idle" && isTraining !== "ready"}

                        />
                        <Button
                            ariaLabel={isCameraActive ? "Close Camera Input" : "Open camera input"}
                            title={isCameraActive ? "Close Camera" : "Open Camera"}
                            variants={isCameraActive ? ["icon", "alarm"] : ["icon"]}
                            onClick={() => {
                                // If it's open, send null to close it. Otherwise, send this class's ID to open it!
                                onUseCamera(isCameraActive ? null : classIndex);
                            }}
                        >
                            <Icon colors={["#FFFFFF"]}>
                                {isCameraActive ? <CameraOffIcon /> : <CameraIcon />}
                            </Icon>
                        </Button>
                        <span>{classData.items.length} image{classData.items.length === 1 ? "" : "s"}</span>
                    </div>
                    {isCameraActive &&
                        <WebcamButton
                            isTraining={isTraining}
                            isRecording={isRecording}
                            onStart={() => setIsRecording(true)}
                            onStop={() => setIsRecording(false)}
                        />
                    }
                </div>
                <ProgressBar progress={classData.items.length / 15} color={"#007400"} variant={"a"} />
            </div>
        </div>
    </div>
    )
}

export default Class
