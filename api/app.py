from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
from dotenv import load_dotenv
from flask_mail import Mail, Message
import random
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

app = Flask(__name__)
app.config['MAIL_SERVER'] = 'smtp-relay.sendinblue.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'klka@duck.com'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
mail = Mail(app)
db = SQLAlchemy(app)
CORS(app)


# --- MODELS ---

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    without_extension_solved_questions = db.relationship('WithoutExtensionSolvedQuestion', backref='user', lazy=True)
    extension_solved_questions = db.relationship('ExtensionSolvedQuestion', backref='user', lazy=True)

class WithoutExtensionSolvedQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_title = db.Column(db.Text, nullable=False)
    solved_at = db.Column(db.DateTime, server_default=db.func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class ExtensionSolvedQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_title = db.Column(db.Text, nullable=False)
    solved_at = db.Column(db.DateTime, server_default=db.func.now())
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


# Use environment variable for API key security
GEMINI_API_KEY = os.getenv('API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)

def send_email(subject, sender, recipients, text_body, html_body):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    mail.send(msg)

@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json()
    email = data.get("email", "")

    if not email:
        return jsonify({"error": "No email provided"}), 400

    otp = random.randint(100000, 999999)
    send_email(
        subject="Your OTP Code",
        sender="klka@duck.com",
        recipients=[email],
        text_body=f"Your OTP code is {otp}",
        html_body=f"<p>Your OTP code is <strong>{otp}</strong></p>"
    )

    # print(otp)
    return jsonify({"message": "OTP sent successfully", "otp": otp}), 200

@app.route("/api/verify-user", methods=["POST"])
def verify_user():
    data = request.get_json()
    email = data.get("email", "")

    if not email:
        return jsonify({"error": "No email provided"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        db.session.add(user)
        db.session.commit()

    return jsonify({"message": "User verified and created successfully"}), 200

@app.route("/api/ask", methods=["POST"])
def ask_ai():
    data = request.get_json()
    question = data.get("question", "")
    mode = data.get("mode", "solution")  # solution, explain, hint
    email = data.get("email", "")

    if not question:
        return jsonify({"error": "No question provided"}), 400

    # Store the question to ExtensionSolvedQuestion if email is provided
    # print(email)
    if email:
        user = User.query.filter_by(email=email).first()
        if user:
            ext_q = ExtensionSolvedQuestion(question_title=question[157:], user_id=user.id)
            db.session.add(ext_q)
            db.session.commit()

    if mode == "solution":
        prompt = f"{question} ((only optimized code for leetcode problem, no explanation only code)"
    elif mode == "explain":
        prompt = f"{question} (optimized code for leetcode problem with simple, crisp explanation)"
    elif mode == "hint":
        prompt = f"{question} (generate list of only hints(points) for leetcode problem and no solution no heading in bold no markdown no pretext)"
    else:
        prompt = question

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )
        return jsonify({"result": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)