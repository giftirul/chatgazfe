const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

let conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  conversation.push({ role: 'user', text: userMessage });
  input.value = '';

  const thinkingMessage = appendMessage('model', 'Gemini is thinking...');

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'An error occurred.');
    }

    const { success, data, message } = await res.json();

    chatBox.removeChild(thinkingMessage);

    if (success) {
      appendMessage('model', data);
      conversation.push({ role: 'model', text: data });
    } else {
      appendMessage('model', `Error: ${message}`);
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    chatBox.removeChild(thinkingMessage);
    appendMessage('model', `Sorry, something went wrong: ${error.message}`);
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  // Use 'model' class for bot messages to align with backend role
  const senderClass = sender === 'bot' ? 'model' : sender;
  msg.classList.add('message', senderClass);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
