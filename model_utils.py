# Define Categories
CATEGORIES = ['Plastic', 'Paper', 'Metal', 'Organic']
import numpy as np

# Recycling Instructions
INSTRUCTIONS = {
    'Plastic': {
        'recycling_method': 'Rinse and dry. Place in the yellow bin.',
        'disposal_tip': 'Remove labels if possible. Check for local plastic type acceptance.',
        'environmental_impact': 'Reduces microplastic pollution and saves petroleum resources.'
    },
    'Paper': {
        'recycling_method': 'Keep dry. Place in the blue bin.',
        'disposal_tip': 'Remove any food remains or oily parts (these belong in Organic).',
        'environmental_impact': 'Saves trees and reduces water consumption in manufacturing.'
    },
    'Metal': {
        'recycling_method': 'Rinse thoroughly. Place in the silver/blue bin.',
        'disposal_tip': 'Crush cans to save space. Aluminum and steel are highly recyclable.',
        'environmental_impact': 'Metal recycling uses 95% less energy than primary production.'
    },
    'Organic': {
        'recycling_method': 'Compost locally or place in the green bin.',
        'disposal_tip': 'Do not include plastic-lined bags unless they are certified compostable.',
        'environmental_impact': 'Reduces methane emissions from landfills and creates natural fertilizer.'
    }
}

# ImageNet class keywords -> Waste category mapping
IMAGENET_TO_WASTE = {
    'Plastic': [
        'bottle', 'water_bottle', 'pop_bottle', 'plastic_bag', 'pill_bottle',
        'hair_spray', 'lotion', 'sunscreen', 'nipple', 'diaper', 'ballpoint',
        'pen', 'rubber_eraser', 'paintbrush', 'toothbrush', 'bucket', 'pail',
        'soap_dispenser', 'shower_curtain', 'measuring_cup', 'ladle',
        'crate', 'hamper', 'washer', 'cup', 'drinking_straw', 'remote_control',
        'mouse', 'keyboard', 'monitor', 'laptop', 'cellular_telephone', 'iPod',
        'joystick', 'cassette_player', 'CD_player', 'modem', 'loudspeaker',
        'microphone', 'screen', 'television'
    ],
    'Paper': [
        'envelope', 'packet', 'carton', 'book', 'notebook', 'comic_book',
        'newspaper', 'letter_opener', 'paper_towel', 'toilet_tissue',
        'menu', 'comic', 'magazine', 'crossword_puzzle', 'jigsaw_puzzle',
        'postcard', 'poster', 'binder', 'folder', 'cardboard', 'box',
        'paper', 'shopping_bag', 'grocery_bag', 'bag'
    ],
    'Metal': [
        'can', 'tin_can', 'beer_glass', 'pop_can', 'soda_can', 'aluminum',
        'steel', 'iron', 'nail', 'screw', 'chain', 'chain_link_fence',
        'safety_pin', 'padlock', 'key', 'combination_lock', 'hook',
        'corkscrew', 'can_opener', 'wrench', 'hammer', 'screwdriver',
        'hatchet', 'cleaver', 'knife', 'spatula', 'pan', 'wok', 'pot',
        'frying_pan', 'Dutch_oven', 'caldron', 'coffeepot', 'teapot',
        'metal', 'wire', 'barbell', 'dumbbell', 'refrigerator', 'stove'
    ],
    'Organic': [
        'banana', 'apple', 'orange', 'lemon', 'strawberry', 'pineapple',
        'fig', 'pomegranate', 'mushroom', 'broccoli', 'cauliflower',
        'cucumber', 'bell_pepper', 'artichoke', 'cardoon', 'head_cabbage',
        'zucchini', 'acorn_squash', 'butternut_squash', 'spaghetti_squash',
        'corn', 'ear', 'mashed_potato', 'French_loaf', 'bagel', 'pretzel',
        'pizza', 'cheeseburger', 'hotdog', 'meat_loaf', 'burrito', 'taco',
        'potpie', 'consomme', 'trifle', 'ice_cream', 'ice_lolly',
        'chocolate_sauce', 'dough', 'hay', 'straw', 'leaf', 'flower',
        'daisy', 'rose', 'sunflower', 'food', 'fruit', 'vegetable',
        'Granny_Smith', 'custard_apple', 'jackfruit'
    ]
}


import os

import os

class WasteClassifier:
    def __init__(self):
        self.session = None
        self.input_name = None
        self.labels = []
        
        try:
            import onnxruntime as ort
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'mobilenetv2.onnx')
            label_path = os.path.join(os.path.dirname(__file__), 'models', 'imagenet_classes.txt')
            
            if os.path.exists(model_path) and os.path.exists(label_path):
                self.session = ort.InferenceSession(model_path)
                self.input_name = self.session.get_inputs()[0].name
                
                with open(label_path, 'r') as f:
                    self.labels = [line.strip() for line in f.readlines()]
                print("Success: ONNX model and labels loaded.")
            else:
                print("Warning: ONNX model files not found. Run download_onnx.py. Running in simulation mode.")
        except ImportError:
            print("Warning: onnxruntime not found. Running in simulation mode.")

    def _map_imagenet_to_waste(self, class_name):
        """Map an ImageNet class name to one of our 4 waste categories."""
        class_lower = class_name.lower()
        # Split into individual words to prevent substring mapping ('straw' in 'drinking_straw')
        words = class_lower.replace('_', ' ').split()
        
        # Check exact word matches against our predefined keywords
        for category, keywords in IMAGENET_TO_WASTE.items():
            for kw in keywords:
                kw_lower = kw.lower()
                if kw_lower in words or class_lower == kw_lower:
                    return category
                    
        # Default: check broader hints using substring matching in the full class name
        if any(w in class_lower for w in ['plastic', 'bottle', 'container', 'jug', 'cup', 'poly', 'bag', 'vial', 'flask']):
            return 'Plastic'
        if any(w in class_lower for w in ['paper', 'book', 'card', 'envelope', 'box', 'carton', 'cardboard', 'leaflet', 'newspaper', 'label']):
            return 'Paper'
        if any(w in class_lower for w in ['metal', 'steel', 'iron', 'tin', 'aluminum', 'pipe', 'tube', 'tubing', 'conduit', 'wire', 'hardware', 'pole', 'bar', 'rod', 'shaft', 'cylinder', 'barrel', 'coil', 'spring', 'chain', 'fence', 'mesh', 'grating', 'nail', 'screw', 'projectile', 'missile', 'cannon', 'organ', 'flute', 'tripod', 'stretcher', 'crutch', 'spindle', 'brass', 'copper', 'alloy', 'foil']):
            return 'Metal'
        if any(w in class_lower for w in ['food', 'fruit', 'vegetable', 'plant', 'flower', 'organic', 'leaf', 'wood', 'timber', 'straw', 'peel', 'seed', 'bread', 'meat', 'compost']):
            return 'Organic'
            
        return None  # Allow fallback picking of lower-confidence valid maps

    def predict(self, preprocessed_image):
        """Predict the class of the waste."""
        if self.session is None:
            # Simulation mode fallback
            class_idx = np.random.randint(0, len(CATEGORIES))
            confidence = np.random.uniform(0.70, 0.95)
            return {
                'category': CATEGORIES[class_idx],
                'confidence': f"{confidence * 100:.2f}%",
                'instructions': INSTRUCTIONS[CATEGORIES[class_idx]],
                'demo_mode': True
            }

        # Real prediction using ONNX
        import cv2
        
        # Make sure image has batch dimension
        if len(preprocessed_image.shape) == 3:
            preprocessed_image = np.expand_dims(preprocessed_image, axis=0)

        # Resize to 224x224 for MobileNet
        if preprocessed_image.shape[1:3] != (224, 224):
            img = cv2.resize(preprocessed_image[0], (224, 224))
            img = np.expand_dims(img, axis=0)
        else:
            img = preprocessed_image

        # Preprocess based on standard ImageNet normalization
        # onnx expects inputs NCHW instead of NHWC
        # and standard normalization mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
        if np.max(img) > 1.0:
            img = img.astype(np.float32) / 255.0
        else:
            img = img.astype(np.float32)
            
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        
        img = (img - mean) / std
        
        # Convert to NCHW
        img = np.transpose(img, (0, 3, 1, 2))

        # Run inference
        outputs = self.session.run(None, {self.input_name: img})
        preds = outputs[0][0] # shape (1000,)
        
        # Softmax to get probabilities
        exp_preds = np.exp(preds - np.max(preds))
        probs = exp_preds / np.sum(exp_preds)

        # Get top 5
        top_k = 5
        top_indices = np.argsort(probs)[-top_k:][::-1]
        
        decoded = []
        for i in top_indices:
            decoded.append(('', self.labels[i], probs[i]))

        # Accumulate scores for each waste category across the top-5 ImageNet predictions
        category_scores = {'Plastic': 0.0, 'Paper': 0.0, 'Metal': 0.0, 'Organic': 0.0}
        total_mapped_score = 0.0
        best_label = decoded[0][1] # Fallback label

        for (_, class_name, score) in decoded:
            category = self._map_imagenet_to_waste(class_name)
            if category:
                category_scores[category] += float(score)
                total_mapped_score += float(score)

        if total_mapped_score > 0.0:
            # Category with highest summed score in top-5
            best_category = max(category_scores, key=category_scores.get)
            
            # Ratio of the winning category's score to all mapped scores in top-5
            ratio = category_scores[best_category] / total_mapped_score
            
            # Map to user-friendly confidence range (68% to 98%)
            best_confidence = 0.68 + 0.30 * ratio
            
            # Find the best specific class label matching this winning category for logging
            for (_, class_name, score) in decoded:
                if self._map_imagenet_to_waste(class_name) == best_category:
                    best_label = class_name
                    break
        else:
            # Fallback to the top-1 ImageNet prediction if no category matched
            first_class = decoded[0][1]
            first_score = float(decoded[0][2])
            best_category = self._map_imagenet_to_waste(first_class) or 'Plastic'
            best_confidence = 0.50 + 0.45 * first_score
            best_label = first_class

        print(f"ONNX prediction: {best_label} -> {best_category} (confidence: {best_confidence*100:.2f}%)")

        return {
            'category': best_category,
            'confidence': f"{best_confidence * 100:.2f}%",
            'instructions': INSTRUCTIONS[best_category],
            'demo_mode': False
        }



# Global instance for use in Flask app
_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = WasteClassifier()
    return _classifier
