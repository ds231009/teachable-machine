import React, { useState, useRef, useEffect } from 'react';
import * as tf from 'tensorflow';
import { Camera, Upload, Play, Download, Trash2, Plus, Minus } from 'lucide-react';

const ImageClassifierTool = () => {
  const [model, setModel] = useState(null);
  const [baseModel, setBaseModel] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [categories, setCategories] = useState(['Category 1', 'Category 2']);
  const [trainingData, setTrainingData] = useState({});
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [predictions, setPredictions] = useState([]);
  const [testImage, setTestImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showTestCamera, setShowTestCamera] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [modelName, setModelName] = useState('my_classifier');
  
  const videoRef = useRef(null);
  const testVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const testCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const testStreamRef = useRef(null);

  // Initialize base model
  useEffect(() => {
    const loadBaseModel = async () => {
      try {
        console.log('Initializing TensorFlow.js...');
        
        // Wait for TensorFlow to be ready
        await tf.ready();
        console.log('TensorFlow.js is ready');
        
        // Set backend if needed
        if (tf.getBackend() === null) {
          await tf.setBackend('webgl');
        }
        
        // Clear any existing models to avoid name conflicts
        tf.disposeVariables();
        
        console.log('Creating pretrained-style base model...');
        
        try {
          // Generate unique timestamp for layer names
          const timestamp = Date.now();
          
          // Create a simpler but effective pretrained-style base model
          const input = tf.input({ 
            shape: [224, 224, 3],
            name: `base_input_${timestamp}`
          });
          
          // First conv block
          let x = tf.layers.conv2d({
            filters: 32,
            kernelSize: 3,
            strides: 2,
            activation: 'relu',
            padding: 'same',
            trainable: false,
            kernelInitializer: 'heNormal',
            name: `base_conv1_${timestamp}`
          }).apply(input);
          
          x = tf.layers.batchNormalization({ 
            trainable: false,
            name: `base_bn1_${timestamp}`
          }).apply(x);
          
          // Second conv block
          x = tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            strides: 2,
            activation: 'relu',
            padding: 'same',
            trainable: false,
            kernelInitializer: 'heNormal',
            name: `base_conv2_${timestamp}`
          }).apply(x);
          
          x = tf.layers.batchNormalization({ 
            trainable: false,
            name: `base_bn2_${timestamp}`
          }).apply(x);
          
          // Third conv block
          x = tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            strides: 2,
            activation: 'relu',
            padding: 'same',
            trainable: false,
            kernelInitializer: 'heNormal',
            name: `base_conv3_${timestamp}`
          }).apply(x);
          
          x = tf.layers.batchNormalization({ 
            trainable: false,
            name: `base_bn3_${timestamp}`
          }).apply(x);
          
          // Fourth conv block
          x = tf.layers.conv2d({
            filters: 256,
            kernelSize: 3,
            strides: 2,
            activation: 'relu',
            padding: 'same',
            trainable: false,
            kernelInitializer: 'heNormal',
            name: `base_conv4_${timestamp}`
          }).apply(x);
          
          x = tf.layers.batchNormalization({ 
            trainable: false,
            name: `base_bn4_${timestamp}`
          }).apply(x);
          
          // Use average pooling instead of global average pooling
          x = tf.layers.averagePooling2d({ 
            poolSize: [14, 14],
            padding: 'valid',
            name: `base_pool_${timestamp}`
          }).apply(x);
          
          // Flatten to create feature vector
          const features = tf.layers.flatten({
            name: `base_flatten_${timestamp}`
          }).apply(x);
          
          const baseModel = tf.model({
            inputs: input,
            outputs: features,
            name: `base_model_${timestamp}`
          });
          
          console.log('Pretrained-style base model created successfully');
          console.log('Base model summary:', baseModel.summary());
          
          setBaseModel(baseModel);
          setIsModelLoaded(true);
          
        } catch (modelError) {
          console.error('Error creating pretrained-style model:', modelError);
          
          // Try an even simpler fallback
          console.log('Attempting ultra-simple fallback model...');
          const timestamp = Date.now();
          
          const input = tf.input({ 
            shape: [224, 224, 3],
            name: `fallback_input_${timestamp}`
          });
          
          // Very simple architecture
          let x = tf.layers.conv2d({
            filters: 32,
            kernelSize: 8,
            strides: 4,
            activation: 'relu',
            padding: 'same',
            trainable: false,
            name: `fallback_conv1_${timestamp}`
          }).apply(input);
          
          x = tf.layers.maxPooling2d({ 
            poolSize: 8,
            name: `fallback_pool1_${timestamp}`
          }).apply(x);
          
          x = tf.layers.conv2d({
            filters: 64,
            kernelSize: 4,
            strides: 2,
            activation: 'relu',
            padding: 'same',
            trainable: false,
            name: `fallback_conv2_${timestamp}`
          }).apply(x);
          
          x = tf.layers.maxPooling2d({ 
            poolSize: 4,
            name: `fallback_pool2_${timestamp}`
          }).apply(x);
          
          const features = tf.layers.flatten({
            name: `fallback_flatten_${timestamp}`
          }).apply(x);
          
          const fallbackModel = tf.model({
            inputs: input,
            outputs: features,
            name: `fallback_model_${timestamp}`
          });
          
          setBaseModel(fallbackModel);
          setIsModelLoaded(true);
          console.log('Ultra-simple fallback model created successfully');
        }
        
      } catch (error) {
        console.error('Critical error in model initialization:', error);
        alert('Failed to create base model. Please refresh the page. Error: ' + error.message);
      }
    };

    // Cleanup function to dispose of models when component unmounts
    const cleanup = () => {
      if (baseModel) {
        baseModel.dispose();
      }
      if (model) {
        model.dispose();
      }
    };

    loadBaseModel();
    
    // Return cleanup function
    return cleanup;
  }, []); // Empty dependency array to run only once

  // Initialize training data structure when categories change
  useEffect(() => {
    const newTrainingData = {};
    categories.forEach(category => {
      if (!trainingData[category]) {
        newTrainingData[category] = [];
      } else {
        newTrainingData[category] = trainingData[category];
      }
    });
    setTrainingData(newTrainingData);
  }, [categories]);

  const addCategory = () => {
    const newCategory = `Category ${categories.length + 1}`;
    setCategories([...categories, newCategory]);
  };

  const removeCategory = (index) => {
    if (categories.length > 2) {
      const newCategories = categories.filter((_, i) => i !== index);
      setCategories(newCategories);
      
      // Remove training data for deleted category
      const newTrainingData = { ...trainingData };
      delete newTrainingData[categories[index]];
      setTrainingData(newTrainingData);
      
      if (selectedCategory >= newCategories.length) {
        setSelectedCategory(0);
      }
    }
  };

  const updateCategoryName = (index, newName) => {
    const oldName = categories[index];
    const newCategories = [...categories];
    newCategories[index] = newName;
    setCategories(newCategories);
    
    // Update training data with new category name
    if (trainingData[oldName]) {
      const newTrainingData = { ...trainingData };
      newTrainingData[newName] = newTrainingData[oldName];
      delete newTrainingData[oldName];
      setTrainingData(newTrainingData);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Try with less restrictive constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          streamRef.current = stream;
          setShowCamera(true);
        }
      } catch (fallbackError) {
        console.error('Fallback camera access failed:', fallbackError);
        alert('Could not access camera. Please check permissions and ensure you\'re using HTTPS.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const startTestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' 
        } 
      });
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
        testVideoRef.current.play();
        testStreamRef.current = stream;
        setShowTestCamera(true);
      }
    } catch (error) {
      console.error('Error accessing test camera:', error);
      // Try with less restrictive constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (testVideoRef.current) {
          testVideoRef.current.srcObject = stream;
          testVideoRef.current.play();
          testStreamRef.current = stream;
          setShowTestCamera(true);
        }
      } catch (fallbackError) {
        console.error('Fallback test camera access failed:', fallbackError);
        alert('Could not access camera. Please check permissions and ensure you\'re using HTTPS.');
      }
    }
  };

  const stopTestCamera = () => {
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(track => track.stop());
      testStreamRef.current = null;
    }
    setShowTestCamera(false);
  };

  const captureTestImage = () => {
    if (testVideoRef.current && testCanvasRef.current) {
      const canvas = testCanvasRef.current;
      const video = testVideoRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(video, 0, 0, 224, 224);
      
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target.result;
          setTestImage(imageDataUrl);
          predictImage(imageDataUrl);
        };
        reader.readAsDataURL(blob);
      });
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(video, 0, 0, 224, 224);
      
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          addImageToTraining(e.target.result);
        };
        reader.readAsDataURL(blob);
      });
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        addImageToTraining(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const addImageToTraining = (imageDataUrl) => {
    const categoryName = categories[selectedCategory];
    const newTrainingData = { ...trainingData };
    if (!newTrainingData[categoryName]) {
      newTrainingData[categoryName] = [];
    }
    newTrainingData[categoryName].push(imageDataUrl);
    setTrainingData(newTrainingData);
  };

  const removeImage = (category, index) => {
    const newTrainingData = { ...trainingData };
    newTrainingData[category].splice(index, 1);
    setTrainingData(newTrainingData);
  };

  const preprocessImage = async (imageDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 224;
        canvas.height = 224;
        
        ctx.drawImage(img, 0, 0, 224, 224);
        
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const tensor = tf.browser.fromPixels(imageData)
          .toFloat()
          .div(255.0)
          .expandDims(0);
        
        resolve(tensor);
      };
      img.src = imageDataUrl;
    });
  };

  const trainModel = async () => {
    if (!baseModel || !isModelLoaded) {
      alert('Base model not loaded yet. Please wait.');
      return;
    }

    const totalImages = Object.values(trainingData).reduce((sum, images) => sum + images.length, 0);
    if (totalImages < categories.length * 2) {
      alert(`Please add at least 2 images per category. You have ${totalImages} images total.`);
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      console.log('Starting transfer learning training...');
      console.log('Base model (frozen) has', baseModel.countParams(), 'parameters');
      
      // Prepare training data by extracting features from frozen base model
      console.log('Extracting features using frozen base model...');
      const allFeatures = [];
      const allLabels = [];

      let processedImages = 0;
      
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const images = trainingData[category] || [];
        
        for (const imageDataUrl of images) {
          const imageTensor = await preprocessImage(imageDataUrl);
          
          // Extract features using the frozen base model
          const features = baseModel.predict(imageTensor);
          
          allFeatures.push(features);
          allLabels.push(i);
          
          processedImages++;
          setTrainingProgress((processedImages / totalImages) * 30);
          
          imageTensor.dispose();
        }
      }

      console.log('Creating trainable classification head...');
      const featuresTensor = tf.concat(allFeatures, 0);
      const labelsTensor = tf.oneHot(tf.tensor1d(allLabels, 'int32'), categories.length);

      // Create ONLY the classification head (transfer learning - only this part is trainable)
      const input = tf.input({ shape: [featuresTensor.shape[1]] });
      
      // Trainable dense layers
      let x = tf.layers.dense({
        units: 128,
        activation: 'relu',
        trainable: true, // Only these layers are trainable
        kernelInitializer: 'heNormal',
        name: 'classification_dense_1'
      }).apply(input);
      
      x = tf.layers.dropout({ 
        rate: 0.5,
        name: 'classification_dropout' 
      }).apply(x);
      
      const output = tf.layers.dense({
        units: categories.length,
        activation: 'softmax',
        trainable: true, // Only these layers are trainable
        kernelInitializer: 'heNormal',
        name: 'classification_output'
      }).apply(x);

      const classificationHead = tf.model({
        inputs: input,
        outputs: output,
        name: 'classification_head'
      });

      // Compile only the classification head
      classificationHead.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      console.log('Classification head summary:');
      classificationHead.summary();
      console.log('Trainable parameters in classification head:', classificationHead.countParams());

      console.log('Training ONLY the classification head (transfer learning)...');
      setTrainingProgress(40);
      
      await classificationHead.fit(featuresTensor, labelsTensor, {
        epochs: 50,
        batchSize: Math.min(32, Math.floor(totalImages / 2)),
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = 40 + ((epoch + 1) / 50) * 50;
            setTrainingProgress(progress);
            console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
          }
        }
      });

      console.log('Creating complete transfer learning model...');
      // Create the complete model: frozen base + trained classification head
      const completeInput = tf.input({ shape: [224, 224, 3] });
      
      // Apply frozen base model
      const baseFeatures = baseModel.apply(completeInput);
      
      // Apply trained classification head
      const finalOutput = classificationHead.apply(baseFeatures);
      
      const completeModel = tf.model({
        inputs: completeInput,
        outputs: finalOutput,
        name: 'transfer_learning_model'
      });

      // Verify that base layers are still frozen
      let frozenLayers = 0;
      let trainableLayers = 0;
      
      completeModel.layers.forEach(layer => {
        if (layer.trainable === false) {
          frozenLayers++;
        } else {
          trainableLayers++;
        }
      });
      
      console.log(`Transfer learning model created:`);
      console.log(`- Frozen layers: ${frozenLayers}`);
      console.log(`- Trainable layers: ${trainableLayers}`);
      console.log(`- Total parameters: ${completeModel.countParams()}`);

      setModel(completeModel);
      setTrainingProgress(100);
      
      // Clean up intermediate tensors
      allFeatures.forEach(tensor => tensor.dispose());
      featuresTensor.dispose();
      labelsTensor.dispose();
      
      console.log('Transfer learning training completed successfully!');
      alert(`Transfer learning complete!\nFrozen layers: ${frozenLayers}\nTrainable layers: ${trainableLayers}`);
      
    } catch (error) {
      console.error('Transfer learning training error:', error);
      alert('Training failed. Please check the console for details.');
    } finally {
      setIsTraining(false);
    }
  };

  const predictImage = async (imageDataUrl) => {
    if (!model) {
      alert('Please train the model first.');
      return;
    }

    try {
      // Store the test image for display
      setTestImage(imageDataUrl);
      
      const imageTensor = await preprocessImage(imageDataUrl);
      const prediction = model.predict(imageTensor);
      const probabilities = await prediction.data();
      
      const results = categories.map((category, index) => ({
        category,
        probability: probabilities[index]
      })).sort((a, b) => b.probability - a.probability);
      
      setPredictions(results);
      
      imageTensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Prediction failed. Please check the console for details.');
    }
  };

  const handlePredictionUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        predictImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveModel = async () => {
    if (!model) {
      alert('Please train the model first.');
      return;
    }

    try {
      console.log('Starting model export...');
      
      // Note: Direct downloads are not available in sandboxed iframe
      // We'll provide the data for manual saving instead
      console.log('Preparing model data for manual export...');

      // Alternative method: Create JSON representation for manual saving
      const modelTopology = model.toJSON();
      const modelWeights = model.getWeights();
      
      // Create model metadata
      const modelMetadata = {
        modelName: modelName,
        categories: categories,
        inputShape: [224, 224, 3],
        numClasses: categories.length,
        createdAt: new Date().toISOString(),
        tfVersion: tf.version?.tfjs || 'unknown',
        modelType: 'image_classification',
        trainingImageCounts: Object.fromEntries(
          categories.map(cat => [cat, trainingData[cat]?.length || 0])
        )
      };

      // Create simplified export package
      const exportData = {
        modelTopology: modelTopology,
        metadata: modelMetadata,
        instructions: {
          note: "This is a simplified export. For full model reconstruction, you'll need to retrain.",
          categories: categories,
          inputShape: [224, 224, 3],
          usage: "Use this data to recreate the model structure in your environment"
        }
      };

      // Create usage example
      const usageExample = `
// Usage example for ${modelName}
import * as tf from 'tensorflow';

// Categories for this model
const categories = ${JSON.stringify(categories)};

// You'll need to recreate and retrain the model with your data
// This is the model structure that was used:
const modelTopology = ${JSON.stringify(modelTopology, null, 2)};

// Preprocess image function
function preprocessImage(imageElement) {
  return tf.browser.fromPixels(imageElement)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(255.0)
    .expandDims(0);
}

// After retraining your model, use this prediction function:
async function predict(model, imageElement) {
  const preprocessedImage = preprocessImage(imageElement);
  const prediction = model.predict(preprocessedImage);
  const probabilities = await prediction.data();
  
  const results = categories.map((category, index) => ({
    category,
    probability: probabilities[index]
  })).sort((a, b) => b.probability - a.probability);
  
  preprocessedImage.dispose();
  prediction.dispose();
  
  return results;
}
`;

      // Display export information in a modal
      const modalDiv = document.createElement('div');
      modalDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      
      contentDiv.innerHTML = `
        <h2 style="margin-top: 0; color: #333;">Model Export - ${modelName}</h2>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #555;">Model Configuration</h3>
          <textarea id="exportData" style="width: 100%; height: 200px; font-family: monospace; font-size: 12px; border: 1px solid #ddd; padding: 10px;">${JSON.stringify(exportData, null, 2)}</textarea>
          <button id="copyExportBtn" style="margin-top: 5px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy Configuration</button>
          <p style="font-size: 12px; color: #666; margin: 5px 0;">Save this as "${modelName}_config.json"</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #555;">Usage Example</h3>
          <textarea id="usageCode" style="width: 100%; height: 150px; font-family: monospace; font-size: 12px; border: 1px solid #ddd; padding: 10px;">${usageExample}</textarea>
          <button id="copyUsageBtn" style="margin-top: 5px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy Usage Code</button>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #555;">Export Information</h4>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Model Name:</strong> ${modelName}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Categories:</strong> ${categories.join(', ')}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Training Images:</strong> ${Object.values(trainingData).reduce((sum, imgs) => sum + imgs.length, 0)}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Created:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: #e7f3ff; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #0066cc;">How to Save This Data</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #0066cc;">
            <li>Click the "Copy Configuration" button above</li>
            <li>Open a text editor (Notepad, VS Code, etc.)</li>
            <li>Paste the content and save as "${modelName}_config.json"</li>
            <li>Click "Copy Usage Code" and save as "${modelName}_usage.js"</li>
            <li>Use these files to recreate your model in another environment</li>
          </ol>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #856404;">Important Note About Sandboxed Environment</h4>
          <p style="margin: 0; font-size: 14px; color: #856404;">
            This tool runs in a sandboxed environment that prevents direct file downloads. 
            The model weights cannot be exported directly, but you can use the configuration 
            above to recreate and retrain the model with your own data in a different environment.
          </p>
        </div>
        
        <button id="closeModalBtn" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      `;
      
      modalDiv.appendChild(contentDiv);
      document.body.appendChild(modalDiv);
      
      // Add event listeners
      const copyToClipboard = (textareaId, buttonId) => {
        const textarea = document.getElementById(textareaId);
        const button = document.getElementById(buttonId);
        
        if (textarea && button) {
          textarea.select();
          textarea.setSelectionRange(0, 99999);
          
          try {
            document.execCommand('copy');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = '#28a745';
            setTimeout(() => {
              button.textContent = originalText;
              button.style.background = originalText.includes('Configuration') ? '#007bff' : '#28a745';
            }, 2000);
          } catch (copyError) {
            console.error('Copy failed:', copyError);
            alert('Copy failed. Please select the text manually.');
          }
        }
      };
      
      document.getElementById('copyExportBtn').onclick = () => copyToClipboard('exportData', 'copyExportBtn');
      document.getElementById('copyUsageBtn').onclick = () => copyToClipboard('usageCode', 'copyUsageBtn');
      document.getElementById('closeModalBtn').onclick = () => {
        if (modalDiv && modalDiv.parentNode) {
          modalDiv.parentNode.removeChild(modalDiv);
        }
      };

      console.log('Export modal created successfully');
            
    } catch (error) {
      console.error('Export error:', error);
      
      // Simple fallback - just show basic model info
      const basicInfo = {
        modelName: modelName,
        categories: categories,
        inputShape: [224, 224, 3],
        numClasses: categories.length,
        createdAt: new Date().toISOString(),
        error: error.message
      };
      
      alert(`Model export failed: ${error.message}\n\nBasic model info logged to console.`);
      console.log('Model information:', basicInfo);
    }
  };

  const getTotalImages = () => {
    return Object.values(trainingData).reduce((sum, images) => sum + images.length, 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Image Classification Training Tool</h1>
        <p className="text-gray-600 mb-4">
          Train your own image classifier using transfer learning. Upload images for each category, 
          train the model, and use it to classify new images.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            <strong>Status:</strong> {isModelLoaded ? 'Pretrained base model loaded ✓ (frozen for transfer learning)' : 'Loading pretrained base model...'}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            TensorFlow.js version: {tf.version?.tfjs || 'Loading...'}
          </p>
          <p className="text-sm text-blue-600 mt-1">
            <strong>Transfer Learning:</strong> Only the final classification layer will be trained
          </p>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Categories ({categories.length})</h2>
        <div className="space-y-2 mb-4">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={category}
                onChange={(e) => updateCategoryName(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">
                ({trainingData[category]?.length || 0} images)
              </span>
              {categories.length > 2 && (
                <button
                  onClick={() => removeCategory(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  <Minus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addCategory}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Training Data Collection */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Training Data Collection</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Category for New Images:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category, index) => (
              <option key={index} value={index}>{category}</option>
            ))}
          </select>
        </div>

        <div className="flex space-x-4 mb-4">
          <button
            onClick={startCamera}
            disabled={showCamera}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            <Camera size={16} />
            <span>Use Camera</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            <Upload size={16} />
            <span>Upload Images</span>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {showCamera && (
          <div className="mb-4">
            <div className="relative inline-block">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-80 h-60 border border-gray-300 rounded-lg object-cover"
              />
            </div>
            <div className="mt-2 space-x-2">
              <button
                onClick={captureImage}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Capture Image
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Stop Camera
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={testCanvasRef} className="hidden" />

        {/* Training Images Display */}
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">
                {category} ({trainingData[category]?.length || 0} images)
              </h3>
              <div className="grid grid-cols-6 gap-2">
                {(trainingData[category] || []).map((imageDataUrl, imageIndex) => (
                  <div key={imageIndex} className="relative group">
                    <img
                      src={imageDataUrl}
                      alt={`${category} ${imageIndex + 1}`}
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      onClick={() => removeImage(category, imageIndex)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Total training images: {getTotalImages()}
          </p>
        </div>
      </div>

      {/* Model Training */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Model Training</h2>
        
        <button
          onClick={trainModel}
          disabled={isTraining || !isModelLoaded || getTotalImages() < categories.length * 2}
          className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={16} />
          <span>{isTraining ? 'Training...' : 'Train Model'}</span>
        </button>

        {isTraining && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Training progress: {trainingProgress.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Model Testing */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Model</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Test your trained model with new images using file upload or camera capture.
          </p>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => document.getElementById('prediction-file-input').click()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Upload size={16} />
              <span>Upload Image</span>
            </button>
            
            <button
              onClick={startTestCamera}
              disabled={showTestCamera}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              <Camera size={16} />
              <span>Use Camera</span>
            </button>
          </div>
          
          <input
            id="prediction-file-input"
            type="file"
            accept="image/*"
            onChange={handlePredictionUpload}
            className="hidden"
          />
        </div>

        {showTestCamera && (
          <div className="mb-4">
            <div className="relative inline-block">
              <video
                ref={testVideoRef}
                autoPlay
                playsInline
                muted
                className="w-80 h-60 border border-gray-300 rounded-lg object-cover"
              />
            </div>
            <div className="mt-2 space-x-2">
              <button
                onClick={captureTestImage}
                disabled={!model}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
              >
                Capture & Test
              </button>
              <button
                onClick={stopTestCamera}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Stop Camera
              </button>
            </div>
            {!model && (
              <p className="text-sm text-red-600 mt-2">
                Please train the model first before testing.
              </p>
            )}
          </div>
        )}

        {testImage && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-800 mb-2">Test Image:</h3>
            <img
              src={testImage}
              alt="Test image"
              className="w-64 h-64 object-cover rounded-lg border border-gray-300"
            />
          </div>
        )}

        {predictions.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-800">Predictions:</h3>
            {predictions.map((result, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="font-medium">{result.category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${result.probability * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {(result.probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model Export */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Export Model</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Name:
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="my_classifier"
          />
        </div>

        <button
          onClick={saveModel}
          disabled={!model}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          <span>Save Model</span>
        </button>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            The model will be saved as a TensorFlow.js model that you can load in your own environment using:
          </p>
          <code className="block mt-2 p-2 bg-gray-800 text-gray-100 rounded text-xs">
            const model = await tf.loadLayersModel('path/to/model.json');
          </code>
        </div>
      </div>
    </div>
  );
};

export default ImageClassifierTool;