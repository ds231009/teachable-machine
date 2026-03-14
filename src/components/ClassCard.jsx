import {useState, useRef} from "react";
import Button from "../ui/button.jsx";
import WebcamFeed from "./WebcamFeed.jsx";

import styles from "../Pages/TeachableMachinePage.module.css";

function ClassCard({
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
                    ? <Button onClick={() => setIsEditingName(true)}>changeName</Button>
                    : <Button onClick={() => setIsEditingName(false)}>Save</Button>
                }
                <Button>Delete</Button>
            </div>
        </div>
        <div className={styles.classGallery}>
            {classData.items.map((item, j) =>
                <div key={j} className={styles.classPicture}>
                    <img src={item}/>
                    <button type="button" onClick={() => onDelete(classIndex,j)}>x</button>
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
                    variant="default"
                    onClick={handleCustomButtonClick}
                    disabled={isTraining !== "idle" && isTraining !== "ready"}
                >
                    Upload
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

export default ClassCard
