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


class WasteClassifier:
    def __init__(self):
        self.has_tf = False
        self.model = None
        self.decode_fn = None
        self.preprocess_fn = None
        try:
            import tensorflow as tf
            from tensorflow.keras.applications import MobileNetV2
            from tensorflow.keras.applications.mobilenet_v2 import (
                decode_predictions, preprocess_input
            )
            # Load MobileNetV2 with pre-trained ImageNet weights
            self.model = MobileNetV2(weights='imagenet', include_top=True)
            self.decode_fn = decode_predictions
            self.preprocess_fn = preprocess_input
            self.has_tf = True
            print("Success: MobileNetV2 loaded with ImageNet weights.")
        except ImportError:
            print("Warning: TensorFlow not found. Running in simulation mode.")

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
            
        return None  # Changed from 'Plastic' to allow fallback picking of lower-confidence valid maps

    def predict(self, preprocessed_image):
        """Predict the class of the waste."""
        if not self.has_tf or self.model is None:
            # Simulation mode fallback
            class_idx = np.random.randint(0, len(CATEGORIES))
            confidence = np.random.uniform(0.70, 0.95)
            return {
                'category': CATEGORIES[class_idx],
                'confidence': f"{confidence * 100:.2f}%",
                'instructions': INSTRUCTIONS[CATEGORIES[class_idx]],
                'demo_mode': True
            }

        # Real prediction using ImageNet
        import tensorflow as tf
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        
        # Make sure image has batch dimension
        if len(preprocessed_image.shape) == 3:
            preprocessed_image = np.expand_dims(preprocessed_image, axis=0)

        # Resize to 224x224 for MobileNetV2
        if preprocessed_image.shape[1:3] != (224, 224):
            img = tf.image.resize(preprocessed_image[0], (224, 224)).numpy()
            img = np.expand_dims(img, axis=0)
        else:
            img = preprocessed_image

        # Important: the input should be 0-255 scaled before preprocess_input
        # if it's already scaled to 0-1, it needs to be unscaled since preprocess_input expects 0-255 images
        if np.max(img) <= 1.0:
            img = img * 255.0

        img = preprocess_input(img)
        preds = self.model.predict(img, verbose=0)
        decoded = self.decode_fn(preds, top=5)[0]

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

        print(f"ImageNet prediction: {best_label} -> {best_category} (confidence: {best_confidence*100:.2f}%)")

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
