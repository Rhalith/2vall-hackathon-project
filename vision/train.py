
import os
from ultralytics import YOLO
# Define paths
 # Update with the actual path where the dataset is downloaded
YOLO_YAML_PATH = "data.yaml" # Update the path if your data.yaml is different
OUTPUT_DIR = "runs"


# Create the output directory if it does not exist
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)
model = YOLO("yolo11s.pt")  # You can choose other versions like 'yolov5n.pt', 'yolov5m.pt', etc.
if __name__ == '__main__':
    # Train the model
    results = model.train(
        data=YOLO_YAML_PATH,  # Path to the dataset configuration file
        epochs=100,           # Number of training epochs
        imgsz=640,            # Image size for training
        project=OUTPUT_DIR,   # Directory to save training results
        name="collapse_detector"  # Name of the training run
    )
