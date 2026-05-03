from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import shutil
import os


app = FastAPI()
model = YOLO('best.pt') 

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    
    # Save the uploaded image temporarily
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run YOLOv8 inference
    results = model(temp_path)
    detected_problem = "Normal"
    
    # Extract the highest confidence prediction if found
    if len(results[0].boxes) > 0:
        class_id = int(results[0].boxes[0].cls[0].item())
        detected_problem = model.names[class_id]

    # Delete temporary image
    os.remove(temp_path)

    return {"detected_problem": detected_problem}

# Run using: python -m uvicorn app:app --host 0.0.0.0 --port 8000