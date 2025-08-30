document.addEventListener('DOMContentLoaded', function() {
    const hearBtn = document.getElementById('hear-btn');
    const excuseText = document.getElementById('excuse-text');
    if (hearBtn && excuseText) {
        hearBtn.addEventListener('click', function() {
            const audio = document.getElementById('excuse-audio');
            if (audio) {
                audio.currentTime = 0;
                audio.play();
            } else {
                const utterance = new window.SpeechSynthesisUtterance(excuseText.textContent);
                window.speechSynthesis.speak(utterance);
            }
        });
    }
}); document.addEventListener('DOMContentLoaded', function() {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const hearBtn = document.getElementById('hear-btn');
    const imgBtn = document.getElementById('img-btn'); // your image button

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
                hearBtn.disabled = false;
            } else {
                appendMessage('Error: ' + (data.error || 'Unknown error.'), false);
            }
        } catch (err) {
            appendMessage('Error: Could not reach server.', false);
        }
    }

    // Play / stop TTS audio
    async function playTTS() {
        if (!lastAIMessage) return;

        if (audioPlayer && isPlaying) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            isPlaying = false;
            return;
        }

        hearBtn.disabled = true;
        try {
            const res = await fetch('/generate_audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: lastAIMessage })
            });
            const data = await res.json();
            if (data.audio_url) {
                audioPlayer = new Audio(data.audio_url);
                isPlaying = true;
                audioPlayer.play();
                audioPlayer.onended = () => isPlaying = false;
                audioPlayer.onerror = () => isPlaying = false;
            } else {
                // fallback: browser TTS
                const utterance = new window.SpeechSynthesisUtterance(lastAIMessage);
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            console.error('TTS failed:', err);
            // fallback: browser TTS
            const utterance = new window.SpeechSynthesisUtterance(lastAIMessage);
            window.speechSynthesis.speak(utterance);
        } finally {
            hearBtn.disabled = false;
        }
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
        const promptText = prompt("Enter image prompt:");
        if (!promptText) return;
        try {
            const res = await fetch('/generate_image', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({ prompt: promptText })
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
        } catch (e) {
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
