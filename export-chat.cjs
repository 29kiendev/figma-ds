#!/usr/bin/env node
/**
 * export-chat.js — Export Claude Code conversations to Markdown + HTML
 *
 * Usage:
 *   node export-chat.js              # export all sessions
 *   node export-chat.js [session-id] # export one session
 *
 * Output:
 *   ./chat-export.md
 *   ./chat-export.html
 */

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const CHAT_DIR   = path.join(process.env.HOME, '.claude/projects/-Users-candy');
const OUT_MD     = path.join(process.cwd(), 'chat-export.md');
const OUT_HTML   = path.join(process.cwd(), 'chat-export.html');
const TARGET     = process.argv[2]; // optional session ID or 'all'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFiles() {
  const all = fs.readdirSync(CHAT_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({ name: f, full: path.join(CHAT_DIR, f), mtime: fs.statSync(path.join(CHAT_DIR, f)).mtimeMs }))
    .sort((a, b) => a.mtime - b.mtime);

  if (TARGET && TARGET !== 'all') {
    const match = all.find(f => f.name.includes(TARGET));
    return match ? [match] : [];
  }
  return all;
}

// Bỏ code block, tool refs, system tags
function cleanText(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')           // fenced code blocks
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<[a-z-]+>[\s\S]*?<\/[a-z-]+>/g, '') // any xml-style tags
    .replace(/\n{3,}/g, '\n\n')               // collapse blank lines
    .trim();
}

// Lọc user message không phải text thực
function isRealUserMsg(text) {
  if (!text || text.trim().length < 4) return false;
  const skip = [
    /^claude\s+--/,
    /<system-reminder>/,
    /<local-command-caveat>/,
    /<bash-input>/,
    /<command-name>/,
    /^\s*<\w/,
  ];
  return !skip.some(r => r.test(text));
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── Parse JSONL ──────────────────────────────────────────────────────────────

function parseFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
  const messages = [];
  let firstTs = null, lastTs = null;

  for (const line of lines) {
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }

    const ts = obj.timestamp;
    if (ts) { if (!firstTs) firstTs = ts; lastTs = ts; }

    if (obj.type === 'user') {
      const content = obj.message?.content || '';
      if (typeof content === 'string' && isRealUserMsg(content)) {
        messages.push({ role: 'user', text: content.trim(), ts });
      }
    }

    if (obj.type === 'assistant') {
      const content = obj.message?.content || [];
      if (!Array.isArray(content)) continue;
      const text = content
        .filter(c => c.type === 'text')
        .map(c => c.text || '')
        .join('\n\n');
      if (!text.trim()) continue;
      const cleaned = cleanText(text);
      if (cleaned.length > 20) {
        messages.push({ role: 'assistant', text: cleaned, ts });
      }
    }
  }

  return { messages, firstTs, lastTs };
}

// ─── Render Markdown ──────────────────────────────────────────────────────────

function renderMD(sessions) {
  const lines = ['# Conversations — figma-ds\n'];

  for (const { file, messages, firstTs } of sessions) {
    if (!messages.length) continue;
    const dateStr = firstTs ? formatDate(firstTs) : file.name;
    lines.push(`\n---\n\n## Phiên ${dateStr}\n`);

    for (const msg of messages) {
      const who = msg.role === 'user' ? '**Bạn:**' : '**Claude:**';
      lines.push(`${who}\n${msg.text}\n`);
    }
  }

  return lines.join('\n');
}

// ─── Render HTML ──────────────────────────────────────────────────────────────

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Convert basic markdown in text to HTML
function mdToHtml(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
    .replace(/^[-*] (.+)$/gm, '• $1')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function renderHTML(sessions) {
  const allMsgs = sessions.flatMap((s, si) =>
    s.messages.length
      ? [{ type: 'session', label: s.firstTs ? formatDate(s.firstTs) : `Phiên ${si+1}`, id: `s${si}` },
         ...s.messages.map((m, mi) => ({ ...m, id: `s${si}m${mi}` }))]
      : []
  );

  const navItems = sessions
    .map((s, si) => s.messages.length
      ? `<a href="#s${si}" class="nav-link">${s.firstTs ? formatDate(s.firstTs) : `Phiên ${si+1}`}</a>`
      : '')
    .filter(Boolean)
    .join('\n    ');

  const chatHtml = allMsgs.map(item => {
    if (item.type === 'session') {
      return `<div class="session-divider" id="${item.id}"><span>${esc(item.label)}</span></div>`;
    }
    const cls = item.role === 'user' ? 'msg user' : 'msg assistant';
    const who = item.role === 'user' ? 'Bạn' : 'Claude';
    const time = item.ts ? `<span class="ts">${formatDate(item.ts)}</span>` : '';
    return `<div class="${cls}">
      <div class="msg-header"><span class="who">${who}</span>${time}</div>
      <div class="msg-body"><p>${mdToHtml(item.text)}</p></div>
    </div>`;
  }).join('\n');

  const totalMsgs = sessions.reduce((n, s) => n + s.messages.length, 0);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chat Export — figma-ds</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --blue: #3b82f6; --blue-l: #eff6ff; --blue-d: #1d4ed8;
    --teal: #0d9488; --teal-l: #f0fdfa;
    --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb;
    --gray-400: #9ca3af; --gray-600: #4b5563; --gray-700: #374151; --gray-900: #111827;
  }
  html { scroll-behavior: smooth; }
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: var(--gray-700); background: var(--gray-50); display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; background: #fff; border-right: 1px solid var(--gray-200); padding: 24px 0; }
  .sidebar-logo { padding: 0 16px 20px; border-bottom: 1px solid var(--gray-200); margin-bottom: 16px; }
  .sidebar-logo .badge { display: inline-flex; align-items: center; gap: 6px; background: var(--gray-900); color: #fff; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
  .sidebar-logo .sub { font-size: 11px; color: var(--gray-400); margin-top: 4px; }
  .sidebar-section { padding: 0 16px; margin-bottom: 8px; }
  .sidebar-label { font-size: 10px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: 1px; display: block; padding: 0 4px; margin-bottom: 4px; }
  .nav-link { display: block; padding: 5px 8px; border-radius: 6px; font-size: 12px; color: var(--gray-600); text-decoration: none; transition: background .12s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nav-link:hover { background: var(--gray-100); color: var(--gray-900); }
  .stats { margin: 0 16px 16px; padding: 12px; background: var(--blue-l); border-radius: 8px; }
  .stats div { font-size: 11px; color: var(--blue-d); line-height: 1.8; }
  .stats strong { font-size: 16px; display: block; color: var(--blue-d); }

  /* Main */
  .main { flex: 1; min-width: 0; max-width: 780px; padding: 32px 40px 80px; }
  h1 { font-size: 22px; font-weight: 800; color: var(--gray-900); margin-bottom: 4px; }
  .main-sub { font-size: 13px; color: var(--gray-400); margin-bottom: 32px; }

  /* Messages */
  .session-divider { display: flex; align-items: center; gap: 12px; margin: 32px 0 20px; }
  .session-divider::before, .session-divider::after { content: ''; flex: 1; height: 1px; background: var(--gray-200); }
  .session-divider span { font-size: 11px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }

  .msg { margin-bottom: 16px; max-width: 92%; }
  .msg.user { margin-left: auto; }
  .msg.assistant { margin-right: auto; }

  .msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
  .msg.user .msg-header { justify-content: flex-end; }
  .who { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .msg.user .who { color: var(--blue-d); }
  .msg.assistant .who { color: var(--teal); }
  .ts { font-size: 10px; color: var(--gray-400); }

  .msg-body { padding: 12px 16px; border-radius: 12px; }
  .msg.user .msg-body { background: var(--blue-l); border: 1px solid #dbeafe; border-bottom-right-radius: 4px; }
  .msg.assistant .msg-body { background: #fff; border: 1px solid var(--gray-200); border-bottom-left-radius: 4px; }

  .msg-body p { margin-bottom: 10px; }
  .msg-body p:last-child { margin-bottom: 0; }
  .msg-body code { background: var(--gray-100); padding: 1px 5px; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace; }
  .msg-body strong { font-weight: 600; color: var(--gray-900); }

  /* Mobile */
  @media (max-width: 640px) {
    .sidebar { display: none; }
    .main { padding: 20px 16px 60px; }
  }
</style>
</head>
<body>

<nav class="sidebar">
  <div class="sidebar-logo">
    <div class="badge">💬 Chat Export</div>
    <div class="sub">figma-ds · Typography DS</div>
  </div>
  <div class="stats">
    <strong>${totalMsgs}</strong>
    <div>tin nhắn từ ${sessions.filter(s=>s.messages.length).length} phiên làm việc</div>
  </div>
  <div class="sidebar-section">
    <span class="sidebar-label">Phiên làm việc</span>
    ${navItems}
  </div>
</nav>

<main class="main">
  <h1>Conversations — figma-ds</h1>
  <p class="main-sub">Export ngày ${new Date().toLocaleDateString('vi-VN')} · Đã lọc code blocks</p>

  ${chatHtml}
</main>

<script>
  var navLinks = document.querySelectorAll('.nav-link');
  var dividers = document.querySelectorAll('.session-divider');
  function updateNav() {
    var scrollY = window.scrollY + 160;
    var current = '';
    dividers.forEach(function(d) { if (d.offsetTop <= scrollY) current = d.id; });
    navLinks.forEach(function(a) {
      a.style.background = a.getAttribute('href') === '#' + current ? '#eff6ff' : '';
      a.style.color = a.getAttribute('href') === '#' + current ? '#1d4ed8' : '';
    });
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
</script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = getFiles();
if (!files.length) {
  console.error('Không tìm thấy file JSONL trong', CHAT_DIR);
  process.exit(1);
}

console.log(`Đang xử lý ${files.length} file...`);

const sessions = files.map(f => {
  const { messages, firstTs, lastTs } = parseFile(f.full);
  console.log(`  ${f.name}: ${messages.length} tin nhắn (${firstTs ? formatDate(firstTs) : 'không có timestamp'})`);
  return { file: f, messages, firstTs, lastTs };
}).filter(s => s.messages.length > 0);

const md   = renderMD(sessions);
const html = renderHTML(sessions);

fs.writeFileSync(OUT_MD,   md,   'utf8');
fs.writeFileSync(OUT_HTML, html, 'utf8');

console.log(`\n✓ Xuất xong:`);
console.log(`  ${OUT_MD}   (${Math.round(md.length/1024)}KB)`);
console.log(`  ${OUT_HTML} (${Math.round(html.length/1024)}KB)`);
console.log(`\nMở HTML: open chat-export.html`);
