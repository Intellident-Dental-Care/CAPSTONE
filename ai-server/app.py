from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import shutil
import os

app = FastAPI()
# Load your trained model
model = YOLO('best.pt') 

# ---------------------------------------------------------
# DESCRIPTION MAP: Translates AI classes into clinical text
# ---------------------------------------------------------
DESCRIPTION_MAP = {
    "Cavity": {
        "mild": "A small area of decay or a dark spot was detected on the enamel. Early intervention can prevent it from growing.",
        "severe": "A significant cavity or structural break was detected, suggesting advanced decay that requires immediate attention."
    },
    "Decay": {
        "mild": "Early signs of bacterial erosion were found on the tooth surface.",
        "severe": "Widespread decay was detected, indicating significant enamel and dentin loss."
    },
    "Caries": {
        "mild": "Early-stage demineralization or a small carious lesion was detected. This can often be managed with minimal intervention or fluoride.",
        "severe": "Advanced dental caries were detected, likely penetrating deep into the tooth structure and requiring immediate restoration."
    },
    "Moderate": "Moderate tooth decay was detected. A filling or restoration is highly recommended before it progresses further.",
    "Advanced": "Advanced dental decay was detected, likely requiring immediate restorative treatment or extraction.",
    "Early": "Early signs of tooth decay or demineralization were detected. Preventive care is recommended."
}

# Catch lowercase duplicates
DESCRIPTION_MAP["cavity"] = DESCRIPTION_MAP["Cavity"]
DESCRIPTION_MAP["decay"] = DESCRIPTION_MAP["Decay"]
DESCRIPTION_MAP["caries"] = DESCRIPTION_MAP["Caries"]
DESCRIPTION_MAP["advanced"] = DESCRIPTION_MAP["Advanced"]
DESCRIPTION_MAP["early"] = DESCRIPTION_MAP["Early"]
DESCRIPTION_MAP["moderate"] = DESCRIPTION_MAP["Moderate"]


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    
    # Save the uploaded image temporarily
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run YOLOv8 inference with 15% confidence threshold
    results = model(temp_path, conf=0.15)
    
    # Default fallback values
    detected_problem = "Normal"
    description = "No significant structural issues were detected."
    
    if len(results[0].boxes) > 0:
        # 1. Get the detected problem and capitalize it to match the dictionary
        class_id = int(results[0].boxes[0].cls[0].item())
        detected_problem = model.names[class_id].capitalize()

        # 2. Get normalized bounding box dimensions (percentages)
        box_data = results[0].boxes[0].xywhn[0] 
        width_pct = box_data[2].item()  
        height_pct = box_data[3].item() 
        relative_area = width_pct * height_pct
        
        # 3. SMART OVERRIDES & SEVERITY CALCULATION
        # If the AI explicitly knows it's Advanced, or it's a Cavity (a physical hole), it's ALWAYS Severe.
        if detected_problem in ["Cavity", "Advanced"]:
            severity = "severe"
        # If the AI explicitly says Early, it's ALWAYS Mild.
        elif detected_problem in ["Early"]:
            severity = "mild"
        # For generic words like "Caries" or "Decay", fallback to math.
        # Set to 0.01 (1% area) to catch severe spots even in wide-angle photos.
        else:
            severity = "severe" if relative_area > 0.01 else "mild"

        # 4. Fetch the specific clinical description
        if detected_problem in DESCRIPTION_MAP:
            if isinstance(DESCRIPTION_MAP[detected_problem], dict):
                description = DESCRIPTION_MAP[detected_problem][severity]
            else:
                description = DESCRIPTION_MAP[detected_problem]
        else:
            description = f"A {severity} instance of {detected_problem} was detected."

    # Clean up the temporary image
    os.remove(temp_path)

    return {
        "detected_problem": detected_problem,
        "description": description
    }

# Run using: python -m uvicorn app:app --host 0.0.0.0 --port 8000