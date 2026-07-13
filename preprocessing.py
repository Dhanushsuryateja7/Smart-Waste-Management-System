import cv2
import numpy as np

def preprocess_image(image_path, target_size=(224, 224)):
    """
    Preprocess the image for CNN model.
    """
    try:
        import cv2
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        # Convert BGR (OpenCV default) to RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize image
        img = cv2.resize(img, target_size)
        
        # Rescale pixel values (normalization)
        img = img.astype(np.float32) / 255.0
        
        # Add batch dimension
        img = np.expand_dims(img, axis=0)
        
        return img
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return None

def preprocess_from_buffer(buffer, target_size=(224, 224)):
    """
    Preprocess image from binary buffer (e.g., from Flask request).
    """
    try:
        import cv2
        nparr = np.frombuffer(buffer, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image from buffer")
            
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, target_size)
        img = img.astype(np.float32) / 255.0
        img = np.expand_dims(img, axis=0)
        
        return img
    except Exception as e:
        print(f"Error in buffer preprocessing: {e}")
        return None
