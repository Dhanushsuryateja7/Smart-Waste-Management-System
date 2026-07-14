import urllib.request
import zipfile
import os

def download_files():
    os.makedirs('models', exist_ok=True)
    
    print("Downloading MobileNet TFLite model zip...")
    url = 'https://storage.googleapis.com/download.tensorflow.org/models/tflite/mobilenet_v1_1.0_224_quant_and_labels.zip'
    zip_path = 'models/mobilenet.zip'
    urllib.request.urlretrieve(url, zip_path)
    
    print("Extracting files...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall('models')
    
    os.remove(zip_path)
    # The zip contains mobilenet_v1_1.0_224_quant.tflite and labels_mobilenet_quant_v1_224.txt
    print("Download complete!")

if __name__ == "__main__":
    download_files()
