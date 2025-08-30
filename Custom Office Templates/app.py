import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import uuid
import base64
import io
from PIL import Image

try:
    import whisper
except ImportError:
    whisper = None

app = Flask(__name__)

# Load environment variables
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Hugging Face DeepSeek endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


# Generate excuse using Hugging Face DeepSeek
def generate_excuse(user_message):
    prompt = f"Give a believable and creative excuse for: {user_message}"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",  # Must match your site
        "X-Title": "Excuse Generator"
    }

    payload = {
        "model": "mistralai/mistral-7b-instruct",  # You can also try: "meta-llama/llama-3-8b-instruct"
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }

    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30)
        print("Raw response:", response.text)  # Debug

        response.raise_for_status()
        result = response.json()

        return result["choices"][0]["message"]["content"].strip(), None

    except requests.exceptions.HTTPError as e:
        return None, f"HTTP {e.response.status_code}: {e.response.text}"
    except Exception as e:
        return None, f"Request failed: {e}"


# Chat endpoint for AJAX
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    if not user_message:
        return jsonify({'error': 'No message provided.'}), 400
    excuse, error = generate_excuse(user_message)
    if error:
        return jsonify({'error': error}), 500
    return jsonify({'excuse': excuse})

# Homepage: renders chat UI
@app.route('/')
def index():
    return render_template('index.html')


from huggingface_hub import InferenceClient
client = InferenceClient(token=os.getenv("HF_TOKEN"))

@app.route('/generate_image', methods=['POST'])
def generate_image():
    data = request.get_json()
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided.'}), 400
    try:
        image = client.text_to_image(
            prompt=prompt,
            model="black-forest-labs/FLUX.1-schnell",
            negative_prompt="ugly, blurry, deformed",
            height=512, width=512,
            num_inference_steps=16,
            guidance_scale=7.5
        )
        filename = f"img_{uuid.uuid4().hex}.png"
        filepath = os.path.join('static', filename)
        image.save(filepath)   # ✅ PIL.Image save directly
        return jsonify({"image_url": f"/static/{filename}"})
    except Exception as e:
        return jsonify({'error': f"Image generation failed: {e}"}), 500


@app.route('/speech_to_text', methods=['POST'])
def speech_to_text():
    if whisper is None:
        return jsonify({'error': 'Whisper not available.'}), 500
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded.'}), 400
    audio_file = request.files['audio']
    try:
        # Save to a temporary file
        temp_filename = f"temp_{uuid.uuid4().hex}.wav"
        temp_path = os.path.join('static', temp_filename)
        audio_file.save(temp_path)
        model = whisper.load_model("base")
        result = model.transcribe(temp_path)
        os.remove(temp_path)
        return jsonify({'text': result.get('text', '')})
    except Exception as e:
        return jsonify({'error': f"Speech recognition failed: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True) 