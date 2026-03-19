import {useState, useRef} from "react";
import Button from "../ui/button.jsx";
import WebcamFeed from "./WebcamFeed.jsx";

import styles from "./Class.module.css";
import {CameraIcon, CameraOffIcon, CheckIcon, Icon, PencilIcon, UploadIcon, XIcon} from "../ui/Icons.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";

function Class({
        classIndex,
        classData,
        onUpload,
        onDelete,
        onClassDelete,
        onWebcamCapture,
        onNameChange,
        isTraining
    }) {

    const [isEditingName, setIsEditingName] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);

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
            ? <WebcamFeed
                    isTraining={isTraining !== "idle" && isTraining !== "ready"}
                    onCapture={(imageString) => onWebcamCapture(classIndex, imageString)}
                />
            : null
            }
            <div className={styles.bottomRow}>
                <div className={styles.classUploadButtons}>
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
                        onChange={(e)=> onUpload(e,classIndex)}
                        disabled={isTraining !== "idle" && isTraining !== "ready"}

                    />
                    {isCameraActive
                        ?
                        <Button
                            ariaLabel="Close Camera Input"
                            title={"Close Camera"}
                            variants={["transparent","alarm"]}
                            onClick={()=> setIsCameraActive(false)}
                        >
                            <Icon colors={["crimson"]}>
                                <CameraOffIcon />
                            </Icon>
                            Close Camera
                        </Button>
                        :
                        <Button
                            ariaLabel={"Open camera input"}
                            title={"Open Camera"}
                            variants={["transparent"]}
                            onClick={()=> setIsCameraActive(true)}
                        >
                            <Icon>
                                <CameraIcon />
                            </Icon>
                            Open Camera
                        </Button>
                    }
                </div>
                <ProgressBar progress={classData.items.length / 15} color={"#0074CC"} variant={"a"} />
            </div>
        </div>
    </div>
    )
}

export default Class
