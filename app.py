from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import base64
from PIL import Image
import numpy as np
import tensorflow as tf

app = Flask(__name__)

# Konfigürasyon
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max dosya boyutu
app.config['UPLOAD_FOLDER'] = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# Upload klasörünü oluştur
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Modeli yükle
MODEL_PATH = 'cat_dog_model.h5'
model = tf.keras.models.load_model(MODEL_PATH)

# Etiketler (modelinizin çıktısına göre)
class_names = ['Kedi', 'Köpek']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    """Görüntüyü modele uygun hale getir."""
    img = Image.open(image_path).convert('RGB')
    img = img.resize((150, 150))  # Modelinizin input boyutuna göre ayarlayın
    img_array = np.array(img) / 255.0  # Normalizasyon
    img_array = np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)
    return img_array

def predict_image(image_path):
    """Görüntüyü modelle tahmin et."""
    img_tensor = preprocess_image(image_path)
    prediction = model.predict(img_tensor)[0]

    # Tek sınıflı çıktıysa (örneğin sigmoid: [0.92])
    if len(prediction) == 1:
        class_index = int(prediction[0] > 0.5)
        confidence = float(prediction[0]) if class_index == 1 else 1 - float(prediction[0])
    else:
        class_index = np.argmax(prediction)
        confidence = prediction[class_index]

    return {
        'prediction': class_names[class_index],
        'confidence': round(confidence * 100, 2)
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Dosya seçilmedi'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Dosya seçilmedi'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            result = predict_image(file_path)

            with open(file_path, 'rb') as img_file:
                img_data = base64.b64encode(img_file.read()).decode('utf-8')

            return jsonify({
                'success': True,
                'prediction': result['prediction'],
                'confidence': result['confidence'],
                'image_data': f"data:image/jpeg;base64,{img_data}"
            })
        
        return jsonify({'error': 'Geçersiz dosya formatı'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Bir hata oluştu: {str(e)}'}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'OK', 'message': 'Uygulama çalışıyor'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
