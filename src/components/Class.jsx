import {useState, useRef} from "react";
import Button from "../ui/button.jsx";
import WebcamFeed from "./WebcamFeed.jsx";

import styles from "./Class.module.css";
import {Icon, PencilIcon, UploadIcon, XIcon} from "../ui/Icons.jsx";

function Class({
        classIndex,
        classData,
        onUpload,
        onDelete,
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
                ? <h5>{classData.className} </h5>
                : <input
                    type="text"
                    value = {classData.className}
                    onChange={(e) => onNameChange(e,classIndex)}
                />
            }
            <div>
                {!isEditingName
                    ? <Button
                        ariaLabel={"Change Class name"}
                        variants={["transparent","icon"]}
                        onClick={() => setIsEditingName(true)}
                    >
                        <Icon>
                            <PencilIcon />
                        </Icon>
                    </Button>
                    : <Button
                        ariaLabel={"Save name change"}
                        onClick={() => setIsEditingName(false)}
                    >
                        Save
                    </Button>
                }
                <Button
                    ariaLabel={"Delete Class"}
                    variants={["transparent","icon"]}>
                    <Icon>
                        <XIcon />
                    </Icon>
                </Button>
            </div>
        </div>
        <div className={styles.classGallery}>
            {classData.items.map((item, j) =>
                <div key={j} className={styles.classPicture}>
                    <img src={item} alt="" />
                    <Button
                        ariaLabel={"Delete image"}
                        variants={["transparent", "icon", "small"]}
                        onClick={() => onDelete(classIndex,j)}>
                        <Icon size={10}>
                            <XIcon />
                        </Icon>
                    </Button>
                </div>
            )}
        </div>
        <div className={styles.classUpload}>
            {isCameraActive
            ? <WebcamFeed
                    isTraining={isTraining !== "idle" && isTraining !== "ready"}
                    onCapture={(imageString) => onWebcamCapture(classIndex, imageString)}
                />
            : null
            }
            <div className={styles.classUploadButtons}>
                <Button
                    ariaLabel={"Upload image from device"}
                    onClick={handleCustomButtonClick}
                    disabled={isTraining !== "idle" && isTraining !== "ready"}
                >
                    <Icon colors={["#ffffff"]}>
                        <UploadIcon />
                    </Icon>
                    <span>Upload Image</span>
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
                    ? <Button onClick={()=> setIsCameraActive(false)}>Stop</Button>
                    : <Button onClick={()=> setIsCameraActive(true)}>Take picture</Button>
                }
            </div>
        </div>
    </div>
    )
}

export default Class
