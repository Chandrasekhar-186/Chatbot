document.addEventListener('DOMContentLoaded', function() {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const hearBtn = document.getElementById('hear-btn');
    const imgBtn = document.getElementById('img-btn'); // include image button

    let lastAIMessage = '';
    let audioPlayer = null;
    let isPlaying = false;
    let recognition = null;
    let recognizing = false;

    // Append chat bubble
    function appendMessage(text, isUser) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + (isUser ? 'user-msg' : 'ai-msg');
        bubble.textContent = text;
        chatWindow.appendChild(bubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Send message to backend
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        appendMessage(message, true);
        userInput.value = '';
        hearBtn.disabled = true;

        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await res.json();
            if (data.excuse) {
                lastAIMessage = data.excuse;
                appendMessage(lastAIMessage, false);
                hearBtn.dataset.text = lastAIMessage;
                hearBtn.disabled = false;
            } else {
                appendMessage('Error: ' + (data.error || 'Unknown error.'), false);
            }
        } catch (err) {
            appendMessage('Error: Could not reach server.', false);
        }
    }

    // Play / stop TTS audio
    let utterance = null;
    let isSpeaking = false;
    
    async function playTTS() {
        if (!lastAIMessage) return;
    
        // If already speaking, stop immediately
        if (isSpeaking && utterance) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
            return;
        }
    
        utterance = new SpeechSynthesisUtterance(lastAIMessage);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;
    
        isSpeaking = true;
    
        utterance.onend = () => {
            isSpeaking = false;
        };
        utterance.onerror = () => {
            isSpeaking = false;
        };
    
        window.speechSynthesis.speak(utterance);
    }
    

    // Start speech recognition
    function startRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser.');
            return;
        }
        if (recognition && recognizing) {
            recognition.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognizing = true;
        micBtn.classList.add('active');

        recognition.onresult = e => {
            const transcript = e.results[0][0].transcript;
            userInput.value = transcript;
            recognizing = false;
            micBtn.classList.remove('active');
            sendMessage(); // auto-send
        };
        recognition.onerror = () => {
            recognizing = false;
            micBtn.classList.remove('active');
        };
        recognition.onend = () => {
            recognizing = false;
            micBtn.classList.remove('active');
        };
        recognition.start();
    }

    // Generate image from prompt
    async function generateImage() {
        const prompt = userInput.value.trim();
        if (!prompt) return;
        userInput.value = ''; // clear input
        appendMessage(prompt, true); // show as user message (optional)
        try {
            const res = await fetch('/generate_image', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            if (data.image_url) {
                const img = document.createElement('img');
                img.src = data.image_url;
                img.className = 'img-fluid my-2';
                chatWindow.appendChild(img);
                chatWindow.scrollTop = chatWindow.scrollHeight;
            } else {
                appendMessage('Image generation failed: ' + data.error, false);
            }
        } catch(e) {
            appendMessage('Image generation failed.', false);
        }
    }    

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
    hearBtn.addEventListener('click', playTTS);
    micBtn.addEventListener('click', startRecognition);
    imgBtn.addEventListener('click', generateImage);
});
