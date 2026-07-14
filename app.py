import os
import base64
import datetime
import random
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from preprocessing import preprocess_from_buffer
from model_utils import get_classifier

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ecosort_secret_key_99'
if os.environ.get('VERCEL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/database.db'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -- Database Models --
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Scan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    material = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    location = db.Column(db.String(50), default="Main Entrance")

# Initialize database
with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='admin').first():
        hashed_pw = generate_password_hash('password', method='pbkdf2:sha256')
        admin_user = User(username='admin', password=hashed_pw)
        db.session.add(admin_user)
        db.session.commit()

        # Seed 15 realistic historical scans for the admin demo user
        categories = ['Plastic', 'Paper', 'Metal', 'Organic']
        locations = ['Smart Bin #1', 'Smart Bin #2', 'Reception', 'Cafeteria', 'Lab Entrance']
        confidences = ['84.21%', '91.03%', '78.55%', '88.67%', '95.12%', '72.44%', '83.90%', '96.30%', '79.18%']
        now = datetime.datetime.utcnow()
        for i in range(15):
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            ts = now - datetime.timedelta(days=days_ago, hours=hours_ago)
            scan = Scan(
                user_id=admin_user.id,
                material=random.choice(categories),
                confidence=random.choice(confidences),
                timestamp=ts,
                location=random.choice(locations)
            )
            db.session.add(scan)
        db.session.commit()

# Ensure upload directory exists
UPLOAD_FOLDER = '/tmp/uploads' if os.environ.get('VERCEL') else 'static/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    try:
        os.makedirs(UPLOAD_FOLDER)
    except OSError:
        pass

@app.route('/')
def home():
    return render_template('index.html', user=session.get('username'))

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if user and check_password_hash(user.password, data.get('password')):
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({"success": True, "username": user.username})
    return jsonify({"success": False, "message": "Invalid password or user"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "Username already exists."}), 409
    hashed_pw = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(username=username, password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    session['user_id'] = new_user.id
    session['username'] = new_user.username
    return jsonify({"success": True, "username": new_user.username})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

@app.route('/about')
def about():
    return render_template('about.html', user=session.get('username'))

@app.route('/contact')
def contact():
    return render_template('contact.html', user=session.get('username'))

@app.route('/classify', methods=['POST'])
def classify():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please log in first.'}), 401

    if 'image' not in request.files and 'image_data' not in request.form:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        if 'image' in request.files:
            file = request.files['image']
            image_bytes = file.read()
        elif 'image_data' in request.form:
            # Handle base64 encoded camera captures
            raw = request.form['image_data']
            # Strip the data URL prefix if present
            if ',' in raw:
                raw = raw.split(',', 1)[1]
            try:
                image_bytes = base64.b64decode(raw)
            except Exception:
                return jsonify({'error': 'Invalid base64 image data'}), 400
        else:
            return jsonify({'error': 'No image provided'}), 400

        # Preprocess
        processed_img = preprocess_from_buffer(image_bytes)
        if processed_img is None:
            return jsonify({'error': 'Image preprocessing failed'}), 500
        
        # Predict
        classifier = get_classifier()
        result = classifier.predict(processed_img)
        
        # PERSIST: Save to database
        new_scan = Scan(
            user_id=session.get('user_id'),
            material=result['category'],
            confidence=result['confidence'],
            location="Smart Bin #1"
        )
        db.session.add(new_scan)
        db.session.commit()
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history')
def get_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify([])

    # Only return real logs that were scanned previously by this user
    scans = Scan.query.filter_by(user_id=user_id).order_by(Scan.timestamp.desc()).limit(20).all()
    history = []
    for s in scans:
        history.append({
            'id': f"SCN-{s.id:04d}",
            'location': s.location,
            'material': s.material,
            'confidence': s.confidence,
            'timestamp': s.timestamp.strftime("%d %b %Y %H:%M"),
            'status': 'Processed'
        })
    return jsonify(history)

@app.route('/api/stats')
def get_stats():
    """Real-time dashboard stats from database for current user."""
    user_id = session.get('user_id')
    
    today = datetime.datetime.utcnow().date()
    # Pre-calculate trend labels for both states
    trend_labels = [(today - datetime.timedelta(days=i)).strftime('%a') for i in range(6, -1, -1)]
    categories = ['Plastic', 'Paper', 'Metal', 'Organic']

    if not user_id:
        return jsonify({
            'total_scans': 0,
            'composition': [0]*len(categories),
            'composition_labels': categories,
            'trend_labels': trend_labels,
            'trend_data': [0]*7
        })

    base_query = Scan.query.filter_by(user_id=user_id)
    total_scans = base_query.count()

    # Material breakdown for donut chart
    composition = []
    for cat in categories:
        count = base_query.filter_by(material=cat).count()
        composition.append(count)

    # Daily trend for last 7 days
    trend_data = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        count = base_query.filter(
            db.func.date(Scan.timestamp) == day
        ).count()
        trend_data.append(count)

    return jsonify({
        'total_scans': total_scans,
        'composition': composition,
        'composition_labels': categories,
        'trend_labels': trend_labels,
        'trend_data': trend_data
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
