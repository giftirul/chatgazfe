const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box'); // Pastikan ID ini benar
const clearChatBtn = document.getElementById('clear-chat-btn');
const downloadChatBtn = document.getElementById('download-chat-btn');

// Mengambil riwayat percakapan dari sessionStorage atau memulai dengan array kosong
let rawHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];

// Membersihkan riwayat dari properti yang tidak lagi digunakan (misal: imageSrc)
let conversation = rawHistory.map(msg => {
  if (msg && msg.role && typeof msg.text === 'string') {
    return { role: msg.role, text: msg.text };
  }
  return null; // Kembalikan null jika format tidak valid
}).filter(Boolean); // Hapus entri null dari array

sessionStorage.setItem('chatHistory', JSON.stringify(conversation)); // Sinkronkan kembali sessionStorage yang sudah bersih

// Fungsi untuk memuat ulang dan menampilkan riwayat percakapan ke UI
function loadConversation() {
  chatBox.innerHTML = ''; // Bersihkan chat box terlebih dahulu
  conversation.forEach(msg => {
    appendMessage(msg.role, msg.text);
  });
}

// Panggil fungsi untuk memuat riwayat saat halaman pertama kali dibuka
loadConversation();

// Event listener untuk tombol clear chat
if (clearChatBtn) {
  clearChatBtn.addEventListener('click', () => {
    // Hapus dari UI
    chatBox.innerHTML = '';
    // Hapus dari variabel dan sessionStorage
    conversation = [];
    sessionStorage.removeItem('chatHistory');
  });
}

// Event listener untuk tombol download chat
if (downloadChatBtn) {
  downloadChatBtn.addEventListener('click', () => {
    if (conversation.length === 0) {
      alert('Chat history is empty.');
      return;
    }

    let chatContent = "Chat History with G-Az\n";
    chatContent += "========================\n\n";

    conversation.forEach(msg => {
      const sender = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      chatContent += `${sender}:\n`;
      if (msg.text) {
        chatContent += `${msg.text}\n`;
      }
      chatContent += "\n";
    });

    const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  updateConversation('user', userMessage);

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
      updateConversation('model', data);
    } else {
      appendMessage('model', `Error: ${message}`);
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    chatBox.removeChild(thinkingMessage);
    appendMessage('model', `Sorry, something went wrong: ${error.message}`);
  }
});

function updateConversation(role, text) {
  // Tambahkan pesan baru ke array
  conversation.push({ role, text });
  // Simpan array yang sudah diperbarui ke sessionStorage
  sessionStorage.setItem('chatHistory', JSON.stringify(conversation));
  // Jika pesan dari model, tampilkan juga ke UI
  if (role === 'model') {
    appendMessage(role, text);
  }
}

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  // Kasus khusus untuk indikator "mengetik"
  if (sender === 'model' && text === 'Gemini is thinking...') {
    msg.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
  }

  // Jika pesan dari model, format teksnya agar lebih rapi
  if (sender === 'model') {
    // Pisahkan teks menjadi beberapa baris
    const lines = text.split('\n');
    let htmlContent = '';
    let inList = false;

    lines.forEach(line => {
      // Cek jika baris adalah item daftar (dimulai dengan * atau -)
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        if (!inList) {
          htmlContent += '<ul>';
          inList = true;
        }
        htmlContent += `<li>${line.trim().substring(2)}</li>`; // Hapus '* ' atau '- '
      } else {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        // Tambahkan sebagai paragraf jika bukan baris kosong
        if (line.trim() !== '') {
          htmlContent += `<p>${line}</p>`;
        }
      }
    });

    // Tutup tag <ul> jika daftar berada di akhir teks
    if (inList) {
      htmlContent += '</ul>';
    }

    msg.innerHTML = htmlContent;

    // Buat dan tambahkan tombol salin
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.title = 'Copy text';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';

    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Mencegah event lain terpicu
      // Gunakan .innerText untuk menyalin teks seperti yang terlihat oleh pengguna
      navigator.clipboard.writeText(msg.innerText).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; // Beri feedback "ter-copy"
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>'; // Kembalikan ikon semula
        }, 2000);
      }).catch(err => console.error('Failed to copy text: ', err));
    });

    msg.appendChild(copyBtn);
  } else {
    // Untuk pesan pengguna, tampilkan seperti biasa
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
