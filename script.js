const API_KEY = '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';

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const toggleMode = document.getElementById('toggle-mode');
const micBtn = document.getElementById('mic-btn');
const downloadBtn = document.getElementById('download-chat');

let history = JSON.parse(localStorage.getItem('utpol-history')) || [];

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMessage(sender, text, avatar) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  msg.innerHTML = `
    <img src="${avatar}" class="avatar" />
    <div class="text">
      ${marked.parse(text)}
      <span class="timestamp">${formatTime()}</span>
      <span class="copy-btn" onclick="navigator.clipboard.writeText(\`${text.replace(/`/g, '\\`')}\`)">📋</span>
    </div>
  `;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function saveHistory(role, content) {
  history.push({ role, content });
  if (history.length > 10) history = history.slice(-10);
  localStorage.setItem('utpol-history', JSON.stringify(history));
}

function showHistory() {
  history.forEach(({ role, content }) => {
    const avatar = role === 'user' ? 'assets/user.png' : 'assets/utpol.png';
    addMessage(role, content, avatar);
  });
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  addMessage('user', message, 'assets/user.png');
  saveHistory('user', message);
  userInput.value = '';

  const typing = document.createElement('div');
  typing.className = 'message bot';
  typing.innerHTML = `<img src="assets/utpol.png" class="avatar" /><div class="text">Typing<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div>`;
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Utpol AI'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: [
          { role: 'system', content: 'You are Utpol. You are a maths genious. A free fire Max update informer . A very good teacher".' },
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || 'Utpol is silent.';

    chatBox.removeChild(typing);
    addMessage('bot', botReply, 'assets/utpol.png');
    saveHistory('bot', botReply);
  } catch (err) {
    chatBox.removeChild(typing);
    addMessage('bot', '⚠️ Connection failed.', 'assets/utpol.png');
    console.error(err);
  }
});

// 🌙 Toggle Light/Dark Mode
toggleMode.addEventListener('click', () => {
  document.body.classList.toggle('light');
});

// 🎤 Voice Input
const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (recognition) {
  const mic = new recognition();
  mic.lang = 'en-US';
  mic.interimResults = false;

  micBtn.onclick = () => mic.start();
  mic.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    userInput.value = transcript;
  };
}

// 📥 Download Chat
downloadBtn.addEventListener('click', () => {
  const text = history.map(m => `[${m.role}] ${m.content}`).join('\n\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'utpol-chat.txt';
  a.click();
});

// 🔁 Load History
showHistory();
