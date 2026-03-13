import {useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';

function TeachableMachine() {
    const { isModelLoaded, trainingStatus, currentLoss, prepareAndTrain, classify } = useFeatureExtractor();

    const [dataset, setDataset] = useState([
        {className: "Class 1", items: ["a","b","v"]},
        {className: "Class 2", items: ["a","b","v"]}
    ])
    const [modelTrained, setModelTrained] = useState(false)
    const [changingClassname, setChangingClassname] = useState(null)

    const handleUpload = (event, classID) => {
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
        setDataset(prev => (
            prev.map((cls, i) =>
                i === classID
                ?  { ...cls, items: cls.items.filter((_, index) => index !== itemID) }
                : cls
            )
        ));
        console.log(dataset)
    };

    const handleClassnameChange = (event, classID) => {
        const newName = event.target.value;

        setDataset(prev =>
            prev.map((cls, i) =>
                i === classID
                    ? { ...cls, className: newName }
                    : cls
            )
        );
    };

    const handleAddClass = (event) => {
        let newClass = {className: "Class " + (dataset.length + 1), items:  []};
        console.log(length);
        setDataset(prev => [...prev, newClass])
    };

    const handleTrain = () => {
        prepareAndTrain(dataset);
    };

    return (
        <>
            <header> HEADER </header>
            <main>
                <div>
                    <h1>
                        Hero Section
                    </h1>
                </div>
                <section>
                    <h3>Classes {changingClassname}</h3>
                    <div>
                        {dataset.map((classDataset, i) =>
                            <div key={i}>
                                <div>
                                    {changingClassname !== i
                                        ? <div>{classDataset.className} </div>
                                        : <>
                                            <input
                                                type="text"
                                                // placeholder="Classname"
                                                value = {classDataset.className}
                                                onChange={(e) => handleClassnameChange(e,i)}
                                            />
                                            <button onClick={(e) => setChangingClassname(null)}>Save</button>
                                        </>
                                    }
                                    <button onClick={(e) => setChangingClassname(i)}>changeName</button>
                                    <button>Delete</button>
                                </div>
                                {classDataset.items.map((item, j) =>
                                    <div key={j}>
                                        <span>{item}</span>
                                        <button type="button" onClick={(e) => handleDelete(i,j)}>Delete</button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e)=> handleUpload(e,i)}
                                    disabled={modelTrained}
                                />
                            </div>
                        )}
                        <button onClick={(e) => handleAddClass(e)} >New class</button>
                    </div>
                </section>
                <section>
                    <h3>Train Model</h3>
                    <button
                        onClick={(e) => {
                            setModelTrained(true)
                            handleTrain()
                        }}
                    >
                        Train
                    </button>
                </section>
                <section>
                    <h3>Classification</h3>
                </section>
                <footer>FOOTER</footer>
            </main>
        </>
    )
}

export default TeachableMachine
