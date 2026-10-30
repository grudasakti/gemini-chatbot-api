const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitButton = document.getElementById('send-btn');

// Menyimpan riwayat percakapan multi-turn sesuai spesifikasi API backend
const conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Tambahkan pesan user ke chat box
  appendUserMessage(userMessage);
  input.value = '';

  // Tambahkan ke history percakapan
  conversationHistory.push({ role: 'user', text: userMessage });

  // 2. Tampilkan animasi loading bot (bouncing dots)
  const botMessageElement = createBotLoadingMessage();

  // Matikan tombol submit sementara selama request berjalan
  if (submitButton) submitButton.disabled = true;

  try {
    // 3. Kirim data percakapan ke /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: conversationHistory })
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();

    // 4. Format hasil jawaban markdown ke teks berformat (HTML)
    if (data && data.result) {
      renderBotMarkdown(botMessageElement, data.result);
      conversationHistory.push({ role: 'model', text: data.result });
    } else {
      botMessageElement.textContent = 'Sorry, no response received.';
      conversationHistory.pop();
    }
  } catch (error) {
    console.error('Chat error:', error);
    botMessageElement.textContent = 'Failed to get response from server.';
    conversationHistory.pop();
  } finally {
    if (submitButton) submitButton.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

function appendUserMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('message', 'user');
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function createBotLoadingMessage() {
  const msg = document.createElement('div');
  msg.classList.add('message', 'bot');
  // Animasi loading: 3 titik bouncing bergelombang
  msg.innerHTML = `
    <div class="typing-indicator" aria-label="Sedang mengetik...">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function renderBotMarkdown(element, rawMarkdown) {
  // Parse markdown ke format HTML menggunakan marked + DOMPurify untuk keamanan
  if (window.marked && window.DOMPurify) {
    const rawHtml = window.marked.parse(rawMarkdown, { breaks: true, gfm: true });
    element.innerHTML = window.DOMPurify.sanitize(rawHtml);
  } else if (window.marked) {
    element.innerHTML = window.marked.parse(rawMarkdown, { breaks: true, gfm: true });
  } else {
    element.textContent = rawMarkdown;
  }
}
