(function () {
  'use strict';

  // ── i18n ──────────────────────────────────────────────────────────────────
  const LOCALES = {
    de: {
      title: 'WePublish Support',
      placeholder: 'WePublish-Frage stellen…',
      send: 'Senden',
      welcome:
        'Hallo! Ich bin dein WePublish CMS-Assistent. Stell mir gerne Fragen zu WePublish.',
      error: 'Verbindungsfehler. Bitte nochmal versuchen.',
      serverError: 'Etwas ist schiefgelaufen.',
      rateLimit:
        'Du hast zu viele Anfragen gestellt. Bitte warte einen Moment und versuche es erneut.',
    },
    en: {
      title: 'WePublish Support',
      placeholder: 'Ask about WePublish…',
      send: 'Send',
      welcome:
        "Hi! I'm your WePublish CMS assistant. Ask me anything about WePublish.",
      error: 'Connection error. Please try again.',
      serverError: 'Something went wrong.',
      rateLimit: 'Too many requests. Please wait a moment and try again.',
    },
    fr: {
      title: 'Support WePublish',
      placeholder: 'Posez une question sur WePublish…',
      send: 'Envoyer',
      welcome:
        'Bonjour ! Je suis votre assistant WePublish CMS. Posez-moi vos questions.',
      error: 'Erreur de connexion. Veuillez réessayer.',
      serverError: 'Une erreur est survenue.',
      rateLimit:
        'Trop de requêtes. Veuillez patienter un moment avant de réessayer.',
    },
    it: {
      title: 'Supporto WePublish',
      placeholder: 'Fai una domanda su WePublish…',
      send: 'Invia',
      welcome:
        'Ciao! Sono il tuo assistente WePublish CMS. Chiedimi pure qualsiasi cosa.',
      error: 'Errore di connessione. Riprova.',
      serverError: 'Qualcosa è andato storto.',
      rateLimit: 'Troppe richieste. Attendi un momento e riprova.',
    },
  };

  // ── Config ────────────────────────────────────────────────────────────────
  const cfg = Object.assign(
    {
      botUrl: 'https://support-agent-api.wepublish.cloud/api/chat',
      lang: 'de',
      primaryColor: '#ea726e',
      position: 'right',
    },
    window.WpSupportConfig || {}
  );

  const t = LOCALES[cfg.lang] || LOCALES.de;
  const title = cfg.title || t.title;
  const placeholder = cfg.placeholder || t.placeholder;

  // ── Styles ────────────────────────────────────────────────────────────────
  const CSS = `
    #wp-support-btn {
      position: fixed; bottom: 24px; ${cfg.position}: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${cfg.primaryColor}; color: #fff;
      border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.25);
      font-size: 26px; display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    #wp-support-btn:hover { transform: scale(1.08); }
    #wp-support-panel {
      position: fixed; bottom: 92px; ${cfg.position}: 24px; z-index: 9999;
      width: 380px; max-width: calc(100vw - 48px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      display: none; flex-direction: column; overflow: hidden;
      font-family: system-ui, sans-serif; font-size: 14px;
      transition: all .3s ease;
    }
    #wp-support-panel.open { display: flex; }
    #wp-support-panel.fullscreen {
      bottom: 0 !important; ${cfg.position}: 0 !important;
      width: 100vw !important; max-width: 100vw !important;
      height: 100dvh !important; border-radius: 0 !important;
    }
    #wp-support-panel.fullscreen .wps-messages { max-height: none !important; flex: 1; }
    .wps-header {
      background: ${cfg.primaryColor}; color: #fff;
      padding: 14px 16px; font-weight: 600; font-size: 15px;
      display: flex; align-items: center; gap: 8px;
    }
    .wps-header span { flex: 1; }
    .wps-header button {
      background: none; border: none; color: #fff; cursor: pointer;
      font-size: 16px; padding: 0 4px; opacity: .9; transition: opacity .15s, transform .2s;
    }
    .wps-header button:hover { opacity: 1; }
    .wps-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex;
      flex-direction: column; gap: 10px; max-height: 420px; min-height: 180px;
    }
    .wps-msg { max-width: 88%; padding: 9px 13px; border-radius: 12px; line-height: 1.5; }
    .wps-msg.bot  { background: #f1f5f9; align-self: flex-start; border-bottom-left-radius: 4px; }
    .wps-msg.user { background: ${cfg.primaryColor}; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    .wps-msg pre  { margin: 6px 0; font-size: 12px; overflow-x: auto; background: #e2e8f0; padding: 8px; border-radius: 6px; }
    .wps-msg code { font-family: monospace; background: #e2e8f0; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
    .wps-msg pre code { background: none; padding: 0; }
    .wps-msg h2   { font-size: 15px; font-weight: 700; margin: 8px 0 4px; }
    .wps-msg h3   { font-size: 14px; font-weight: 700; margin: 6px 0 3px; }
    .wps-msg h4   { font-size: 13px; font-weight: 600; margin: 4px 0 2px; }
    .wps-msg ul, .wps-msg ol { margin: 4px 0 4px 16px; padding: 0; }
    .wps-msg li   { margin: 2px 0; }
    .wps-msg strong { font-weight: 700; }
    .wps-msg em     { font-style: italic; }
    .wps-msg del    { text-decoration: line-through; opacity: .7; }
    .wps-msg p    { margin: 4px 0; }
    .wps-typing   { opacity: .55; font-style: italic; }
    .wps-footer   { border-top: 1px solid #e5e7eb; padding: 10px 12px; display: flex; gap: 8px; }
    .wps-footer textarea {
      flex: 1; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 8px 10px; font-size: 14px; resize: none;
      font-family: inherit; outline: none; max-height: 80px;
    }
    .wps-footer textarea:focus { border-color: ${cfg.primaryColor}; }
    .wps-footer button {
      background: ${cfg.primaryColor}; color: #fff; border: none;
      border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 13px; font-weight: 600;
    }
    .wps-footer button:disabled { opacity: .5; cursor: default; }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────────────
  const btn = document.createElement('button');
  btn.id = 'wp-support-btn';
  btn.title = title;
  btn.innerHTML = '💬';

  const panel = document.createElement('div');
  panel.id = 'wp-support-panel';
  panel.innerHTML = `
    <div class="wps-header">
      <span>🗞️ ${title}</span>
      <button id="wps-fullscreen" title="Vollbild">⛶</button>
      <button id="wps-clear" title="Chat leeren">🗑</button>
      <button id="wps-close">✕</button>
    </div>
    <div class="wps-messages" id="wps-msgs">
      <div class="wps-msg bot">${t.welcome}</div>
    </div>
    <div class="wps-footer">
      <textarea id="wps-input" rows="1" placeholder="${placeholder}"></textarea>
      <button id="wps-send">${t.send}</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  // ── Persistent history ────────────────────────────────────────────────────
  const STORAGE_KEY = 'wps_history_v1';
  const MAX_STORED = 40;

  const msgs = document.getElementById('wps-msgs');
  const input = document.getElementById('wps-input');
  const sendBtn = document.getElementById('wps-send');
  const fsBtn = document.getElementById('wps-fullscreen');

  let history = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) history = JSON.parse(raw);
  } catch {
    history = [];
  }

  function saveHistory() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history.slice(-MAX_STORED))
      );
    } catch {}
  }

  if (history.length > 0) {
    msgs.innerHTML = '';
    history.forEach(m => addMsg(m.role === 'user' ? 'user' : 'bot', m.content));
  }

  // ── Markdown renderer ─────────────────────────────────────────────────────
  function renderMarkdown(text) {
    let s = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced code blocks
    s = s.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

    const lines = s.split('\n');
    const out = [];
    let inUl = false,
      inOl = false;

    for (const line of lines) {
      // Skip lines already inside pre blocks
      if (line.includes('<pre>') || line.includes('</pre>')) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        out.push(line);
        continue;
      }

      if (/^### (.+)/.test(line)) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        out.push(`<h4>${line.replace(/^### /, '')}</h4>`);
        continue;
      }
      if (/^## (.+)/.test(line)) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        out.push(`<h3>${line.replace(/^## /, '')}</h3>`);
        continue;
      }
      if (/^# (.+)/.test(line)) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        out.push(`<h2>${line.replace(/^# /, '')}</h2>`);
        continue;
      }

      if (/^[-*] (.+)/.test(line)) {
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          out.push('<ul>');
          inUl = true;
        }
        out.push(`<li>${line.replace(/^[-*] /, '')}</li>`);
        continue;
      }
      if (/^\d+\. (.+)/.test(line)) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          out.push('<ol>');
          inOl = true;
        }
        out.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
        continue;
      }

      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }

      if (line.trim() === '') {
        out.push('<br>');
        continue;
      }
      out.push(line + '<br>');
    }

    if (inUl) out.push('</ul>');
    if (inOl) out.push('</ol>');

    return out
      .join('\n')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>');
  }

  // ── Message helpers ───────────────────────────────────────────────────────
  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = `wps-msg ${role}`;
    el.innerHTML =
      role === 'bot' ?
        renderMarkdown(text)
      : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function send() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    sendBtn.disabled = true;
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    saveHistory();

    const typing = addMsg('bot', '…');
    typing.classList.add('wps-typing');

    try {
      const res = await fetch(cfg.botUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, lang: cfg.lang || 'de' }),
      });
      if (res.status === 429) {
        typing.textContent = t.rateLimit;
        typing.classList.remove('wps-typing');
        // Remove the user message we just added — it was never processed
        history.pop();
        saveHistory();
        sendBtn.disabled = false;
        input.focus();
        return;
      }
      const data = await res.json();
      const reply = data.reply || data.error || t.serverError;
      typing.remove();
      addMsg('bot', reply);
      history.push({ role: 'assistant', content: reply });
      saveHistory();
    } catch {
      typing.textContent = t.error;
      typing.classList.remove('wps-typing');
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // ── Events ────────────────────────────────────────────────────────────────
  btn.addEventListener('click', () => panel.classList.toggle('open'));

  fsBtn.addEventListener('click', () => {
    const isFs = panel.classList.toggle('fullscreen');
    fsBtn.style.transform = isFs ? 'rotate(45deg)' : '';
    fsBtn.title = isFs ? 'Verkleinern' : 'Vollbild';
  });

  document.getElementById('wps-close').addEventListener('click', () => {
    panel.classList.remove('open', 'fullscreen');
    fsBtn.style.transform = '';
  });

  document.getElementById('wps-clear').addEventListener('click', () => {
    history = [];
    saveHistory();
    msgs.innerHTML = `<div class="wps-msg bot">${t.welcome}</div>`;
  });

  sendBtn.addEventListener('click', send);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });
})();
