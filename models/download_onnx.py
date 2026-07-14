import urllib.request
import os

def download_onnx_model():
    os.makedirs('models', exist_ok=True)
    
    print("Downloading MobileNetV2 ONNX model...")
    # MobileNetV2 ONNX from official model zoo
    model_url = 'https://github.com/onnx/models/raw/main/validated/vision/classification/mobilenet/model/mobilenetv2-7.onnx'
    urllib.request.urlretrieve(model_url, 'models/mobilenetv2.onnx')
    
    print("Downloading ImageNet labels...")
    labels_url = 'https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt'
    urllib.request.urlretrieve(labels_url, 'models/imagenet_classes.txt')
    
    print("Download complete!")

if __name__ == "__main__":
    download_onnx_model()
