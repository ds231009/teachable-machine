import Button from "../ui/button.jsx";
import { Icon, PlayIcon } from "../ui/Icons.jsx";

function Train({
                   isModelLoaded,
                   trainingStatus,
                   handleTrain,
                   changedAfterTrained
               }) {

    const getButtonConfig = () => {
        // We start with our base variant that makes the button look big/primary
        let variants = ["hero"];

        // 1. Initializing State
        if (!isModelLoaded) {
            variants.push("loading");
            return { variants, text: "Initialising Model...", disabled: true, showIcon: false };
        }

        // 2. Actively Training State
        if (trainingStatus === "preparing" || trainingStatus === "training") {
            variants.push("training");
            return { variants, text: "Training model...", disabled: true, showIcon: false };
        }

        // 3. Finished Training State
        if (trainingStatus === "ready") {
            variants.push("trained");

            if (changedAfterTrained) {
                variants.push("changedAfterTrained");
                return { variants, text: "Retrain Model", disabled: false, showIcon: true };
            }
            // If the model is trained, but they added new pictures, we want them to click it again!

            // If they haven't changed anything, lock the button so they don't spam it.
            return { variants, text: "Model trained", disabled: true, showIcon: false };
        }

        // 4. Default / Idle State (Model is loaded, ready to train for the first time)
        variants.push("loaded");
        return { variants, text: "Train model", disabled: false, showIcon: true };
    };

    // CALL the function right before the return to grab our settings object!
    const btnConfig = getButtonConfig();

    return (
        <>
            <h2>Train Model</h2>
            <span>
                Once your data is collected, the engine uses a pre-trained neural network (MobileNet)
                to extract complex visual features from your images. It then trains a custom classification
                layer specifically on your dataset. This process dynamically adjusts the mathematical weights
                of the model, essentially "teaching" it how to distinguish between the unique classes you defined.
            </span>

            <Button
                ariaLabel="Train Model"
                variants={btnConfig.variants}
                onClick={handleTrain}
                disabled={btnConfig.disabled} // <-- The safety lock!
            >
                {/* Dynamically render the icon based on our config */}
                {btnConfig.showIcon && (
                    <Icon colors={["#ffffff"]}>
                        <PlayIcon />
                    </Icon>
                )}

                {/* Dynamically render the text */}
                {btnConfig.text}
            </Button>
            {btnConfig.variants}
        </>
    );
}

export default Train;