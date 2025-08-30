# Intelligent Excuse Generator Chatbot  

An AI-powered chatbot that generates realistic, funny, or professional excuses on demand.  
It includes text generation, voice output (TTS), proof/mock screenshots, apology letters, excuse history management, and image-based excuse generation via Hugging Face.  

---

## Features  

- Excuse generation for work, school, meetings, and personal situations  
- Voice excuses with Coqui TTS  
- Proof/mock screenshot generator  
- Excuse history and favorites  
- Apology generator  
- Image-based excuse generation with Hugging Face  

---

## Tech Stack  

- **Backend:** Flask / FastAPI  
- **AI Model (Text):** OpenRouter  
- **TTS Engine:** Coqui TTS  
- **Image Generation:** Hugging Face Diffusers / Inference API  
- **Frontend:** HTML, CSS, JavaScript  
- **Database:** SQLite / PostgreSQL  
- **Deployment:** Render / Vercel / Hugging Face Spaces  

---

## Installation  

```bash
git clone https://github.com/your-username/intelligent-excuse-generator.git
cd intelligent-excuse-generator

python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

pip install -r requirements.txt
```

Set environment variables in `.env`:  

```ini
OPENROUTER_API_KEY=your_openrouter_key
COQUI_API_KEY=your_coqui_key
HUGGINGFACE_API_KEY=your_huggingface_key
```

Run the app:  

```bash
python app.py
```

---

## Usage  

- Visit `http://localhost:5000`  
- Select excuse type (work, school, meeting, personal, etc.)  
- Generate an excuse in text, audio, or image format  
- Save generated excuses to history  

---

## Project Structure  

```
intelligent-excuse-generator
├── app.py
├── routes/
├── static/
├── templates/
├── utils/
├── requirements.txt
├── .env.example
└── README.md
```

---

## Future Enhancements   
- AI-based context-aware excuses  
- Excuse leaderboard  

---

## Contributors  

- Chandrasekhar – Project Lead  
- Open for contributions  

---


This project is licensed under the [MIT License](LICENSE).  
You are free to use, modify, and distribute this project with proper attribution.  
