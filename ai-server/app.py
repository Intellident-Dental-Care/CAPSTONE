from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import shutil
import os

app = FastAPI()
# Load your trained model
model = YOLO('best.pt') 

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    
    # Save the uploaded image temporarily
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run YOLOv8 inference with 15% confidence threshold
    results = model(temp_path, conf=0.15)
    
    # Default fallback values
    detected_problem = "None"
    description = "No significant structural issues were detected."
    confidence = 0.0
    
    if len(results[0].boxes) > 0:
        # 1. Get the detected problem and capitalize it 
        class_id = int(results[0].boxes[0].cls[0].item())
        raw_class = model.names[class_id]
        
        # Capitalize first letter properly (e.g., "chipped" -> "Chipped")
        detected_problem = raw_class.capitalize()
        
        # Extract the confidence score (0.0 to 1.0)
        confidence = float(results[0].boxes[0].conf[0].item())

        # 2. Specific descriptions for the new classes
        if detected_problem == "Cavity":
            description = "A structural cavity or decay was detected on the tooth surface. Restoration is recommended to prevent further damage."
        elif detected_problem == "Plaque":
            description = "Plaque or calculus buildup was detected. A professional dental cleaning is recommended."
        elif detected_problem == "Chipped":
            description = "A chipped or fractured tooth was detected. Depending on the depth, it may require bonding or a crown."
        elif detected_problem == "Crowding":
            description = "Dental crowding or misalignment was detected. An orthodontic evaluation is recommended."
        else:
            description = f"Signs of {detected_problem} were detected in the image."

    # Clean up the temporary image
    os.remove(temp_path)

    return {
        "detected_problem": detected_problem,
        "description": description,
        "confidence": confidence
    }

# Run using: python -m uvicorn app:app --host 0.0.0.0 --port 8000