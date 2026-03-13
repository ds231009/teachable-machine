import {useState} from "react";
import { useFeatureExtractor } from '../functions/useFeatureExtractor.js';

function TeachableMachine() {
    const { isModelLoaded, trainingStatus, currentLoss, prepareAndTrain, classify } = useFeatureExtractor();

    const [dataset, setDataset] = useState([
        {className: "Class 1", items: []},
        {className: "Class 2", items: []}
    ])
    const [changingClassname, setChangingClassname] = useState(null)
    const [prediction, setPrediction] = useState(null);

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

    const handleTestUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const testImageUrl = URL.createObjectURL(file);
        classify(testImageUrl, (error, results) => {
            if (error) {
                console.error(error);
                return;
            }
            // 'results' is already the exact array you asked for!
            setPrediction(results);
        });
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
                                        <img src={item} style={{ width: '100px' }} />
                                        <button type="button" onClick={(e) => handleDelete(i,j)}>Delete</button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e)=> handleUpload(e,i)}
                                    disabled={trainingStatus !== "idle" && trainingStatus !== "ready"}
                                />
                            </div>
                        )}
                        <button
                            onClick={(e) => handleAddClass(e)}
                            disabled={trainingStatus !== "idle" && trainingStatus !== "ready"}
                        >
                            New class
                        </button>
                    </div>
                </section>
                <section>
                    <h3>Train Model</h3>
                    {!isModelLoaded
                        ? <div>Model loading</div>
                        : null
                    }
                    <button
                        onClick={(e) => {
                            handleTrain()
                        }}
                    >
                        Train
                    </button>
                    <div>{trainingStatus}</div>
                </section>
                <section>
                    <h3>Classification</h3>

                    {/* Only show the test input if the model is fully trained */}
                    {trainingStatus === "ready" ? (
                        <div>
                            <input type="file" accept="image/*" onChange={handleTestUpload} />

                            {/* If we have a prediction array, map through it */}
                            {prediction && (
                                <div style={{ marginTop: "1rem" }}>
                                    <h4>Results:</h4>
                                    <ul>
                                        {prediction.map((item, index) => (
                                            <li key={index}>
                                                <strong>{item.label}:</strong> {(item.confidence * 100).toFixed(2)}%
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Train the model first to unlock classification!</p>
                    )}
                </section>
                <footer>FOOTER</footer>
            </main>
        </>
    )
}

export default TeachableMachine
