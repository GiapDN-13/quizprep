import { useState, useEffect, useMemo, useRef } from 'react'

// ---------- helpers ----------
const LETTERS = 'ABCDEFGH'
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const sameSet = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join()

// shuffle options of a question, remap answer indices
const shuffleOptions = (q) => {
  const order = shuffle(q.options.map((_, i) => i))
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answers: q.answers.map((a) => order.indexOf(a)),
  }
}

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)) },
}
const wrongKey = (sid) => `quizapp:${sid}:wrong`
const statsKey = (sid) => `quizapp:${sid}:stats`
const knownKey = (sid) => `quizapp:${sid}:known`

function recordResult(sid, qid, correct) {
  const wrong = store.get(wrongKey(sid), {})
  if (correct) {
    if (wrong[qid]) {
      wrong[qid].streak = (wrong[qid].streak || 0) + 1
      if (wrong[qid].streak >= 2) delete wrong[qid] // đúng 2 lần liên tiếp -> thoát danh sách sai
    }
  } else {
    wrong[qid] = { count: (wrong[qid]?.count || 0) + 1, streak: 0, at: Date.now() }
  }
  store.set(wrongKey(sid), wrong)
  const stats = store.get(statsKey(sid), { attempts: 0, correct: 0 })
  stats.attempts += 1
  if (correct) stats.correct += 1
  store.set(statsKey(sid), stats)
  notifyProgressChange()
}

// ---------- remote data source (sửa nội dung không cần deploy) ----------
// Ưu tiên URL từ xa (GitHub raw / CDN); lỗi thì tự quay về bản đóng gói trong app.
const DATA_BASE = 'quizapp:data:base'
// Đặt sẵn ở đây sau khi có repo, ví dụ:
// 'https://raw.githubusercontent.com/<user>/<repo>/main/public/data'
const DEFAULT_DATA_BASE = ''
const dataBase = () => (localStorage.getItem(DATA_BASE) ?? DEFAULT_DATA_BASE).replace(/\/$/, '')

// trả về danh sách URL để thử theo thứ tự: từ xa trước, rồi bản local
function dataUrls(path) {
  const p = path.replace(/^data\//, '')
  const local = `${import.meta.env.BASE_URL}data/${p}`
  const base = dataBase()
  return base ? [`${base}/${p}?t=${Date.now()}`, local] : [local]
}
async function fetchData(path, asText = false) {
  let lastErr
  for (const u of dataUrls(path)) {
    try {
      const r = await fetch(u)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return asText ? await r.text() : await r.json()
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Không tải được dữ liệu')
}

// ---------- cloud sync (Supabase REST) ----------
const SYNC_URL = 'quizapp:sync:url'
const SYNC_KEY = 'quizapp:sync:key'
const SYNC_CODE = 'quizapp:sync:code'
const syncConfig = () => ({
  url: (localStorage.getItem(SYNC_URL) || '').replace(/\/$/, ''),
  key: localStorage.getItem(SYNC_KEY) || '',
  code: localStorage.getItem(SYNC_CODE) || '',
})
const syncEnabled = () => { const c = syncConfig(); return !!(c.url && c.key && c.code) }

// collect all progress keys (all subjects) from localStorage
function collectProgress() {
  const out = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('quizapp:') && !k.startsWith('quizapp:sync:') && !k.startsWith('quizapp:ai:')) {
      try { out[k] = JSON.parse(localStorage.getItem(k)) } catch { /* skip */ }
    }
  }
  return out
}
function applyProgress(data) {
  for (const [k, v] of Object.entries(data || {})) {
    if (k.startsWith('quizapp:') && !k.startsWith('quizapp:sync:')) {
      localStorage.setItem(k, JSON.stringify(v))
    }
  }
}
// field-aware merge so 2 devices don't clobber each other
function mergeProgress(local, remote) {
  const out = { ...local }
  for (const [k, rv] of Object.entries(remote || {})) {
    const lv = out[k]
    if (lv === undefined) { out[k] = rv; continue }
    if (k.endsWith(':wrong')) {
      const m = { ...lv }
      for (const [qid, e] of Object.entries(rv || {})) {
        m[qid] = m[qid]
          ? { count: Math.max(m[qid].count || 0, e.count || 0), streak: Math.max(m[qid].streak || 0, e.streak || 0), at: Math.max(m[qid].at || 0, e.at || 0) }
          : e
      }
      out[k] = m
    } else if (k.endsWith(':known')) {
      out[k] = { ...lv, ...rv }
    } else if (k.endsWith(':stats')) {
      out[k] = (rv.attempts || 0) >= (lv.attempts || 0) ? rv : lv
    } else {
      out[k] = rv
    }
  }
  return out
}

async function syncPull() {
  const c = syncConfig()
  const r = await fetch(`${c.url}/rest/v1/progress?sync_code=eq.${encodeURIComponent(c.code)}&select=data`, {
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
  })
  if (!r.ok) throw new Error(`Pull lỗi ${r.status}`)
  const rows = await r.json()
  return rows[0]?.data || {}
}
async function syncPush(data) {
  const c = syncConfig()
  const r = await fetch(`${c.url}/rest/v1/progress`, {
    method: 'POST',
    headers: {
      apikey: c.key, Authorization: `Bearer ${c.key}`,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ sync_code: c.code, data, updated_at: new Date().toISOString() }),
  })
  if (!r.ok) throw new Error(`Push lỗi ${r.status}`)
}
// full cycle: pull -> merge -> apply -> push merged
async function syncNow() {
  if (!syncEnabled()) return { ok: false, reason: 'chưa cấu hình' }
  const remote = await syncPull()
  const merged = mergeProgress(collectProgress(), remote)
  applyProgress(merged)
  await syncPush(merged)
  return { ok: true, at: Date.now() }
}

// debounced push notifier used by recordResult / reset / mark-known
let _pushTimer = null
const _pushListeners = new Set()
function notifyProgressChange() {
  _pushListeners.forEach((fn) => fn())
  if (!syncEnabled()) return
  clearTimeout(_pushTimer)
  _pushTimer = setTimeout(() => { syncPush(collectProgress()).catch(() => {}) }, 1500)
}

// ---------- AI (CKEY.VN, OpenAI-compatible; endpoint + key CỐ ĐỊNH, chỉ model đổi được) ----------
const AI_ENDPOINT = 'https://api.xah.io/v1/chat/completions'
// key cố định (encode base64 để đỡ lộ trần trong source; KHÔNG phải bảo mật thực sự)
const AI_APIKEY = atob('c2stNDJjMTg0MDgyOWFjNDk3NGM1MGEzMmU3MTdiODAyZDFlNmQwNTQzNGI0YTgxZDg1MGQ1MTY1ZjZlN2FkZjI4Nw==')
const AI_MODEL = 'quizapp:ai:model'   // per-máy, KHÔNG sync
const AI_MODELS = [
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5 — nhanh & rẻ (khuyên dùng)' },
  { id: 'claude-sonnet-4.6', name: 'Claude Sonnet 4.6 — cân bằng' },
  { id: 'claude-opus-4.6', name: 'Claude Opus 4.6 — mạnh nhất' },
  { id: 'gpt-5.4', name: 'GPT-5.4 (OpenAI)' },
  { id: 'gemini-3.1-pro-high', name: 'Gemini 3.1 Pro (Google)' },
]
const getAiModel = () => localStorage.getItem(AI_MODEL) || AI_MODELS[0].id
const aiEnabled = () => true   // luôn sẵn sàng vì key cố định

// messages: [{role:'user'|'assistant', content}]; system: chuỗi → thêm role:'system'
async function askAI(messages, system, { maxTokens = 1024, model } = {}) {
  const mdl = model || getAiModel()
  const body = {
    model: mdl,
    max_tokens: maxTokens,
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
  }
  let r
  try {
    r = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${AI_APIKEY}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Không gọi được API (mạng, hoặc nhà cung cấp chưa mở CORS cho trình duyệt).')
  }
  if (!r.ok) {
    let msg = `Lỗi API ${r.status}`
    try { const e = await r.json(); msg = e.error?.message || e.message || msg } catch { /* keep */ }
    if (r.status === 401 || r.status === 403) msg = 'Key không hợp lệ / hết credit.'
    if (r.status === 400 && /model/i.test(msg)) msg = `Model "${mdl}" không dùng được — chọn model khác.`
    if (r.status === 429) msg = 'Quá nhiều yêu cầu, thử lại sau chút.'
    throw new Error(msg)
  }
  const data = await r.json()
  return (data.choices?.[0]?.message?.content || '').trim()
}

// build the knowledge-base system prompt so the AI knows scope + how to answer
function tutorSystem(subject, q) {
  const correct = q.answers.map((i) => `${LETTERS[i]}. ${q.options[i]}`).join(' | ')
  return [
    `Bạn là trợ giảng ôn thi cho môn "${subject.name}" (${subject.description}).`,
    `Chủ đề câu hỏi: ${q.topic}.`,
    `Nhiệm vụ: giúp sinh viên HIỂU bản chất để tự làm được các câu tương tự, không chỉ học vẹt.`,
    `Phong cách: trả lời NGẮN GỌN, chính xác, tập trung ôn thi; dùng tiếng Việt nhưng GIỮ NGUYÊN thuật ngữ/tên hàm/công thức bằng tiếng Anh. Có thể dùng ví dụ hoặc công thức khi cần.`,
    `Nếu sinh viên hỏi ngoài phạm vi câu hỏi/môn học, hãy lịch sự kéo về nội dung ôn thi.`,
    `--- NGỮ CẢNH CÂU HỎI ---`,
    `Câu hỏi: ${q.question}`,
    `Các lựa chọn:\n${q.options.map((o, i) => `${LETTERS[i]}. ${o}`).join('\n')}`,
    `Đáp án đúng: ${correct}`,
    q.explanation ? `Giải thích gốc: ${q.explanation}` : '',
    q.verified === false ? `Lưu ý: đáp án này do AI suy ra từ đề thi, CHƯA được kiểm chứng — nếu thấy chưa chắc, hãy nói rõ và phân tích các khả năng.` : '',
  ].filter(Boolean).join('\n')
}

// ---------- shared bits ----------
function Badges({ q }) {
  return (
    <span className="meta-row">
      <span className="badge badge-topic">{q.topic}</span>
      {q.source === 'theory'
        ? <span className="badge badge-multi">🧠 Câu tự luyện từ lý thuyết</span>
        : q.verified
          ? <span className="badge badge-verified">✓ Đáp án gốc</span>
          : <span className="badge badge-unverified">⚠ AI giải — chưa verify{q.confidence === 'medium' ? ' (độ tin cậy TB)' : ''}</span>}
      {q.answers.length > 1 && <span className="badge badge-multi">Chọn {q.answers.length} đáp án</span>}
      {q.review && <span className="badge badge-review" title={q.review}>🚩 Đề lỗi/thiếu dữ liệu</span>}
    </span>
  )
}

function Options({ q, selected, onToggle, revealed, disabled }) {
  const multi = q.answers.length > 1
  return (
    <div>
      {q.options.map((opt, i) => {
        let cls = 'option'
        if (revealed) {
          if (q.answers.includes(i)) cls += ' correct'
          else if (selected.includes(i)) cls += ' wrong'
        } else if (selected.includes(i)) cls += ' selected'
        return (
          <button key={i} className={cls} disabled={disabled} onClick={() => onToggle(i, multi)}>
            <span className="letter">{LETTERS[i]}</span>
            <span>{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

function useToggleSelect() {
  const [selected, setSelected] = useState([])
  const toggle = (i, multi) => {
    setSelected((sel) => multi
      ? (sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i])
      : [i])
  }
  return [selected, setSelected, toggle]
}

function HintBox({ q, show, setShow }) {
  if (!q.hint) return null
  if (!show) {
    return (
      <button className="btn btn-sm btn-plain hint-toggle" onClick={(e) => { e.stopPropagation(); setShow(true) }}>
        💡 Mẹo ghi nhớ <kbd>H</kbd>
      </button>
    )
  }
  return (
    <div className="hint-box" onClick={(e) => { e.stopPropagation(); setShow(false) }} title="Nhấn để ẩn">
      <span>💡 {q.hint}</span>
      <span className="hint-close">✕ ẩn</span>
    </div>
  )
}

// AI panel per question: translate EN↔VI + free-form Q&A tutor
function QuestionAI({ subject, q }) {
  const [trans, setTrans] = useState(null)   // {question, options, explanation}
  const [showTrans, setShowTrans] = useState(false)
  const [tLoading, setTLoading] = useState(false)
  const [tErr, setTErr] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [msgs, setMsgs] = useState([])       // {role, content}
  const [input, setInput] = useState('')
  const [cLoading, setCLoading] = useState(false)
  const [cErr, setCErr] = useState('')
  const scrollRef = useRef(null)

  const needKey = !aiEnabled()

  const doTranslate = async () => {
    if (trans) { setShowTrans((s) => !s); return }
    setTLoading(true); setTErr('')
    try {
      const payload = JSON.stringify({ question: q.question, options: q.options, explanation: q.explanation || '' })
      const sys = 'Bạn là người dịch chuyên ngành. Dịch sang tiếng Việt tự nhiên, GIỮ NGUYÊN thuật ngữ/tên hàm/công thức/mã bằng tiếng Anh. CHỈ trả về JSON hợp lệ đúng khoá {"question":"","options":[],"explanation":""}, không thêm chữ nào khác.'
      const out = await askAI([{ role: 'user', content: payload }], sys, { maxTokens: 1200 })
      let parsed
      try { parsed = JSON.parse(out) } catch { parsed = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) }
      setTrans(parsed); setShowTrans(true)
    } catch (e) { setTErr(e.message) }
    setTLoading(false)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || cLoading) return
    const next = [...msgs, { role: 'user', content: text }]
    setMsgs(next); setInput(''); setCLoading(true); setCErr('')
    try {
      const reply = await askAI(next, tutorSystem(subject, q), { maxTokens: 1024 })
      setMsgs([...next, { role: 'assistant', content: reply }])
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50)
    } catch (e) { setCErr(e.message); setMsgs(msgs) }
    setCLoading(false)
  }

  const quick = (text) => { setInput(text); setTimeout(send, 0) }

  return (
    <div className="qai" onClick={(e) => e.stopPropagation()}>
      <div className="qai-bar">
        <button className="btn btn-sm btn-plain" onClick={doTranslate} disabled={tLoading}>
          {tLoading ? '⏳ Đang dịch…' : showTrans ? '🌐 Ẩn bản dịch' : '🌐 Dịch sang tiếng Việt'}
        </button>
        <button className="btn btn-sm btn-plain" onClick={() => setChatOpen((o) => !o)}>
          {chatOpen ? '💬 Đóng hỏi AI' : '💬 Hỏi AI về câu này'}
        </button>
      </div>
      {tErr && <div className="qai-err">✗ {tErr}</div>}
      {showTrans && trans && (
        <div className="qai-trans">
          <div><strong>Câu hỏi:</strong> {trans.question}</div>
          <ol type="A" style={{ margin: '6px 0', paddingLeft: 22 }}>
            {(trans.options || []).map((o, i) => <li key={i}>{o}</li>)}
          </ol>
          {trans.explanation && <div><strong>Giải thích:</strong> {trans.explanation}</div>}
        </div>
      )}
      {chatOpen && (
        <div className="qai-chat">
          {needKey && <div className="qai-err">Chưa có Claude API key. Bấm <strong>⚙ Cài đặt</strong> ở góc trên để thêm key.</div>}
          <div className="qai-msgs" ref={scrollRef}>
            {msgs.length === 0 && !needKey && (
              <div className="qai-quick">
                <button onClick={() => quick('Giải thích tại sao đáp án đúng, dễ hiểu.')}>Vì sao đáp án đúng?</button>
                <button onClick={() => quick('Vì sao các đáp án còn lại sai?')}>Vì sao đáp án kia sai?</button>
                <button onClick={() => quick('Cho tôi một câu tương tự để luyện, kèm đáp án ẩn.')}>Câu tương tự để luyện</button>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`qai-msg ${m.role}`}>{m.content}</div>
            ))}
            {cLoading && <div className="qai-msg assistant">⏳ Đang trả lời…</div>}
          </div>
          {cErr && <div className="qai-err">✗ {cErr}</div>}
          {!needKey && (
            <div className="qai-input">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                placeholder="Hỏi bất cứ điều gì về câu này…" />
              <button className="btn btn-sm btn-primary" onClick={send} disabled={cLoading || !input.trim()}>Gửi</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Practice mode ----------
function Practice({ subject, pool, onExit, title }) {
  const [queue] = useState(() => shuffle(pool).map(shuffleOptions))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected, toggle] = useToggleSelect()
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [session, setSession] = useState({ done: 0, ok: 0 })

  const q = idx < queue.length ? queue[idx] : null
  const multi = q ? q.answers.length > 1 : false
  const isCorrect = q ? sameSet(selected, q.answers) : false

  const submit = () => {
    setRevealed(true)
    recordResult(subject.id, q.id, isCorrect)
    setSession((s) => ({ done: s.done + 1, ok: s.ok + (isCorrect ? 1 : 0) }))
  }
  const next = () => { setIdx(idx + 1); setSelected([]); setRevealed(false); setShowHint(false) }
  const choose = (i) => {
    if (!q || revealed) return
    if (multi) { toggle(i, true); return }
    setSelected([i])
    const ok = sameSet([i], q.answers)
    setRevealed(true)
    recordResult(subject.id, q.id, ok)
    setSession((s) => ({ done: s.done + 1, ok: s.ok + (ok ? 1 : 0) }))
  }

  useEffect(() => {
    const h = (e) => {
      if (!q || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= q.options.length) { e.preventDefault(); choose(n - 1) }
      else if (e.key === 'Enter') {
        e.preventDefault()
        if (revealed) next()
        else if (multi && selected.length) submit()
      } else if (e.key === 'h' || e.key === 'H') setShowHint((s) => !s)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  if (!queue.length) return <Empty onExit={onExit} />
  if (idx >= queue.length) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Hoàn thành!</h2>
        <div className="score-big">{session.ok}/{session.done}</div>
        <p>đúng {session.done ? Math.round((session.ok / session.done) * 100) : 0}%</p>
        <button className="btn btn-primary" onClick={onExit}>Về trang chính</button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="meta-row" style={{ justifyContent: 'space-between' }}>
        <span>{title} — Câu {idx + 1}/{queue.length}</span>
        <span>Đúng: {session.ok}/{session.done}</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${(idx / queue.length) * 100}%` }} /></div>
      <Badges q={q} />
      <div className="question-text">{q.question}</div>
      {multi && !revealed && (
        <div className="multi-note">📌 Câu nhiều đáp án — chọn đúng <strong>{q.answers.length}</strong> ý (đã chọn {selected.length}/{q.answers.length}) rồi bấm <strong>Kiểm tra</strong>.</div>
      )}
      <HintBox q={q} show={showHint} setShow={setShowHint} />
      <Options
        q={q} selected={selected} revealed={revealed} disabled={revealed}
        onToggle={(i) => choose(i)}
      />
      {revealed && (
        <>
          <div className={`explanation ${isCorrect ? 'good' : 'bad'}`}>
            <strong>{isCorrect ? '✓ Chính xác!' : `✗ Chưa đúng. Đáp án đúng: ${q.answers.map((a) => LETTERS[a]).join(', ')}`}</strong>
            {multi && !isCorrect && (
              <div className="multi-breakdown">
                {q.options.map((_, i) => {
                  const isAns = q.answers.includes(i), picked = selected.includes(i)
                  if (!isAns && !picked) return null
                  const st = isAns && picked ? '✓ chọn đúng' : isAns ? '✗ bỏ sót' : '✗ chọn thừa'
                  return <div key={i} className={isAns ? 'ok' : 'bad'}>{LETTERS[i]}. {st}</div>
                })}
              </div>
            )}
            <div style={{ marginTop: 6 }}>{q.explanation}</div>
          </div>
          {q.review && <div className="review-note">🚩 <strong>Lưu ý:</strong> {q.review}</div>}
          <QuestionAI subject={subject} q={q} />
        </>
      )}
      <div className="nav-row">
        <button className="btn btn-plain" onClick={onExit}>Thoát</button>
        {!revealed && multi && <button className="btn btn-primary" disabled={!selected.length} onClick={submit}>Kiểm tra ⏎</button>}
        {revealed && <button className="btn btn-primary" onClick={next}>Câu tiếp ⏎</button>}
      </div>
      <div className="kbd-help">Phím tắt: <kbd>1</kbd>–<kbd>{q.options.length}</kbd> chọn đáp án · <kbd>⏎</kbd> {multi ? 'kiểm tra / ' : ''}câu tiếp · <kbd>H</kbd> mẹo ghi nhớ</div>
    </div>
  )
}

// ---------- Exam mode ----------
function ExamSetup({ pool, onStart, onExit }) {
  const [num, setNum] = useState(Math.min(50, pool.length))
  const [mins, setMins] = useState(60)
  return (
    <div className="card">
      <h2>Thi thử</h2>
      <p style={{ color: 'var(--muted)' }}>Ngân hàng hiện có {pool.length} câu (theo bộ lọc chủ đề đang chọn).</p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '14px 0' }}>
        <label>Số câu:{' '}
          <input type="number" min="5" max={pool.length} value={num}
            onChange={(e) => setNum(Math.max(1, Math.min(pool.length, +e.target.value || 1)))}
            style={{ width: 70, padding: 6, borderRadius: 8, border: '1px solid var(--border)' }} />
        </label>
        <label>Thời gian (phút):{' '}
          <input type="number" min="1" max="180" value={mins}
            onChange={(e) => setMins(Math.max(1, Math.min(180, +e.target.value || 1)))}
            style={{ width: 70, padding: 6, borderRadius: 8, border: '1px solid var(--border)' }} />
        </label>
      </div>
      <div className="nav-row">
        <button className="btn btn-plain" onClick={onExit}>Thoát</button>
        <button className="btn btn-primary" onClick={() => onStart(num, mins)}>Bắt đầu thi</button>
      </div>
    </div>
  )
}

function Exam({ subject, pool, onExit }) {
  const [config, setConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // qIdx -> [indices]
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef(null)

  const start = (num, mins) => {
    setQuestions(shuffle(pool).slice(0, num).map(shuffleOptions))
    setSecondsLeft(mins * 60)
    setConfig({ num, mins })
  }

  useEffect(() => {
    if (!config || finished) return
    timerRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [config, finished])

  useEffect(() => {
    if (config && secondsLeft <= 0 && !finished) doFinish()
  }, [secondsLeft]) // eslint-disable-line

  const pick = (qIdx, i, multi) => {
    setAnswers((a) => {
      const cur = a[qIdx] || []
      const next = multi
        ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i])
        : [i]
      return { ...a, [qIdx]: next }
    })
  }

  useEffect(() => {
    const h = (e) => {
      if (!config || finished || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      const q = questions[idx]
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= q.options.length) { e.preventDefault(); pick(idx, n - 1, q.answers.length > 1) }
      else if (e.key === 'ArrowRight' && idx < questions.length - 1) setIdx(idx + 1)
      else if (e.key === 'ArrowLeft' && idx > 0) setIdx(idx - 1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const doFinish = () => {
    setFinished(true)
    clearInterval(timerRef.current)
    questions.forEach((q, i) => {
      recordResult(subject.id, q.id, sameSet(answers[i] || [], q.answers))
    })
  }

  if (!config) return <ExamSetup pool={pool} onStart={start} onExit={onExit} />

  if (finished) {
    const results = questions.map((q, i) => ({ q, sel: answers[i] || [], ok: sameSet(answers[i] || [], q.answers) }))
    const score = results.filter((r) => r.ok).length
    return (
      <div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Kết quả</h2>
          <div className="score-big">{score}/{questions.length}</div>
          <p>{Math.round((score / questions.length) * 100)}% — {score / questions.length >= 0.5 ? 'Đạt (≥50%)' : 'Chưa đạt (<50%)'}</p>
          <button className="btn btn-primary" onClick={onExit}>Về trang chính</button>
        </div>
        <div className="card">
          <h3>Xem lại bài làm</h3>
          {results.map((r, i) => (
            <div key={i} className="review-item">
              <div className="meta-row" style={{ justifyContent: 'space-between' }}>
                <strong style={{ color: r.ok ? 'var(--green)' : 'var(--red)' }}>
                  {r.ok ? '✓' : '✗'} Câu {i + 1}
                </strong>
                <Badges q={r.q} />
              </div>
              <div className="question-text" style={{ fontSize: 15 }}>{r.q.question}</div>
              <Options q={r.q} selected={r.sel} revealed disabled onToggle={() => {}} />
              <div className="explanation">{r.q.explanation}</div>
              {r.q.hint && <div className="hint-box static">💡 {r.q.hint}</div>}
              <QuestionAI subject={subject} q={r.q} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const q = questions[idx]
  const sel = answers[idx] || []
  const mm = String(Math.max(0, Math.floor(secondsLeft / 60))).padStart(2, '0')
  const ss = String(Math.max(0, secondsLeft % 60)).padStart(2, '0')
  const answeredCount = Object.values(answers).filter((a) => a.length).length

  return (
    <div className="card">
      <div className="meta-row" style={{ justifyContent: 'space-between' }}>
        <span>Câu {idx + 1}/{questions.length} · đã trả lời {answeredCount}</span>
        <span className={`timer ${secondsLeft < 300 ? 'low' : ''}`}>⏱ {mm}:{ss}</span>
      </div>
      <Badges q={q} />
      <div className="question-text">{q.question}</div>
      <Options
        q={q} selected={sel} revealed={false} disabled={false}
        onToggle={(i, multi) => pick(idx, i, multi)}
      />
      <div className="nav-row">
        <button className="btn btn-plain" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Trước</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => { if (confirm('Nộp bài ngay?')) doFinish() }}>Nộp bài</button>
          <button className="btn btn-primary" disabled={idx === questions.length - 1} onClick={() => setIdx(idx + 1)}>Sau →</button>
        </div>
      </div>
      <div className="qnav">
        {questions.map((_, i) => (
          <button key={i}
            className={`${(answers[i] || []).length ? 'answered' : ''} ${i === idx ? 'current' : ''}`}
            onClick={() => setIdx(i)}>{i + 1}</button>
        ))}
      </div>
      <div className="kbd-help">Phím tắt: <kbd>1</kbd>–<kbd>{q.options.length}</kbd> chọn đáp án · <kbd>←</kbd>/<kbd>→</kbd> chuyển câu</div>
    </div>
  )
}

// ---------- Flashcards ----------
function Flashcards({ subject, pool, onExit }) {
  const known = store.get(knownKey(subject.id), {})
  const [hideKnown, setHideKnown] = useState(false)
  const [queue, setQueue] = useState(() => shuffle(pool))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [, force] = useState(0)

  const visible = hideKnown ? queue.filter((q) => !known[q.id]) : queue
  const q = visible.length ? visible[Math.min(idx, visible.length - 1)] : null
  const knownCount = queue.filter((x) => known[x.id]).length

  const mark = (isKnown) => {
    const k = store.get(knownKey(subject.id), {})
    if (isKnown) k[q.id] = true; else delete k[q.id]
    store.set(knownKey(subject.id), k)
    notifyProgressChange()
    force((x) => x + 1)
    next()
  }
  const next = () => { setFlipped(false); setShowHint(false); setIdx((i) => (i + 1) % visible.length) }
  const prev = () => { setFlipped(false); setShowHint(false); setIdx((i) => (i - 1 + visible.length) % visible.length) }

  useEffect(() => {
    const h = (e) => {
      if (!q || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f) }
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'h' || e.key === 'H') setShowHint((s) => !s)
      else if (e.key === 'k' || e.key === 'K') mark(true)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  if (!visible.length) return <Empty onExit={onExit} msg="Bạn đã thuộc hết thẻ trong bộ lọc này 🎉" />

  return (
    <div>
      <div className="card">
        <div className="meta-row" style={{ justifyContent: 'space-between' }}>
          <span>Thẻ {Math.min(idx, visible.length - 1) + 1}/{visible.length} · đã thuộc {knownCount}/{queue.length}</span>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" checked={hideKnown} onChange={(e) => { setHideKnown(e.target.checked); setIdx(0); setFlipped(false) }} /> Ẩn thẻ đã thuộc
          </label>
        </div>
      </div>
      <div className="card flashcard" onClick={() => setFlipped(!flipped)}>
        {!flipped ? (
          <>
            <Badges q={q} />
            <div className="question-text" style={{ marginTop: 14 }}>{q.question}</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'left', width: '100%' }}>
              {q.options.map((o, i) => <div key={i}><strong>{LETTERS[i]}.</strong> {o}</div>)}
            </div>
            <div style={{ marginTop: 12 }}><HintBox q={q} show={showHint} setShow={setShowHint} /></div>
            <div className="hint">Nhấn thẻ hoặc <kbd>Space</kbd> để xem đáp án · <kbd>←</kbd>/<kbd>→</kbd> chuyển thẻ · <kbd>K</kbd> đã thuộc</div>
          </>
        ) : (
          <>
            <div className="flash-answer">
              {q.answers.map((a) => `${LETTERS[a]}. ${q.options[a]}`).join('\n')}
            </div>
            <div className="explanation" style={{ textAlign: 'left', marginTop: 16 }}>{q.explanation}</div>
            <div style={{ width: '100%' }}><QuestionAI subject={subject} q={q} /></div>
            <div className="hint">Nhấn nền thẻ để quay lại câu hỏi</div>
          </>
        )}
      </div>
      <div className="nav-row">
        <button className="btn btn-plain" onClick={onExit}>Thoát</button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-plain" onClick={prev}>←</button>
          <button className="btn btn-ghost" onClick={() => mark(false)}>Chưa thuộc</button>
          <button className="btn btn-primary" onClick={() => mark(true)}>Đã thuộc ✓</button>
          <button className="btn btn-plain" onClick={next}>→</button>
        </div>
      </div>
    </div>
  )
}

// ---------- Theory (markdown viewer) ----------
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function inlineMd(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
function mdToHtml(md) {
  let html = ''
  const lines = md.split('\n')
  let i = 0, inCode = false, listBuf = [], tableBuf = []
  const flushList = () => {
    if (listBuf.length) { html += '<ul>' + listBuf.map((l) => `<li>${l}</li>`).join('') + '</ul>'; listBuf = [] }
  }
  const flushTable = () => {
    if (tableBuf.length >= 2) {
      const rows = tableBuf.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r.replace(/\|/g, ' ').trim()) || !/^[\s|:-]+$/.test(r))
      const parse = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => inlineMd(escapeHtml(c.trim())))
      const header = parse(tableBuf[0])
      const body = tableBuf.slice(2).map(parse)
      html += '<table><thead><tr>' + header.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>'
        + body.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>'
    } else if (tableBuf.length) {
      tableBuf.forEach((r) => { html += `<p>${inlineMd(escapeHtml(r))}</p>` })
    }
    tableBuf = []
  }
  for (i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      flushList(); flushTable()
      if (!inCode) { html += '<pre><code>'; inCode = true } else { html += '</code></pre>'; inCode = false }
      continue
    }
    if (inCode) { html += escapeHtml(line) + '\n'; continue }
    if (/^\s*\|/.test(line)) { flushList(); tableBuf.push(line.trim()); continue }
    flushTable()
    const h = line.match(/^(#{1,4})\s+(.*)/)
    if (h) { flushList(); const lv = h[1].length; html += `<h${lv}>${inlineMd(escapeHtml(h[2]))}</h${lv}>`; continue }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) { listBuf.push(inlineMd(escapeHtml(line.replace(/^\s*([-*]|\d+\.)\s+/, '')))); continue }
    flushList()
    if (/^\s*>\s?/.test(line)) { html += `<blockquote>${inlineMd(escapeHtml(line.replace(/^\s*>\s?/, '')))}</blockquote>`; continue }
    if (/^\s*---+\s*$/.test(line)) { html += '<hr/>'; continue }
    if (line.trim() === '') continue
    html += `<p>${inlineMd(escapeHtml(line))}</p>`
  }
  flushList(); flushTable()
  if (inCode) html += '</code></pre>'
  return html
}

function Theory({ subject, onExit }) {
  const [md, setMd] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => {
    fetchData(subject.theory, true)
      .then(setMd)
      .catch(() => setErr('Không tải được tài liệu lý thuyết.'))
  }, [subject])
  if (err) return <Empty onExit={onExit} msg={err} />
  if (md === null) return <div className="card empty">Đang tải…</div>
  return (
    <div>
      <div className="nav-row" style={{ marginTop: 0, marginBottom: 12 }}>
        <button className="btn btn-plain" onClick={onExit}>← Về trang chính</button>
      </div>
      <div className="card theory" dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />
    </div>
  )
}

// ---------- Settings UI (Sync + AI) ----------
function SyncModal({ onClose, onChanged }) {
  const c = syncConfig()
  const [url, setUrl] = useState(c.url)
  const [key, setKey] = useState(c.key)
  const [code, setCode] = useState(c.code)
  const [aiModel, setAiModel] = useState(getAiModel())
  const [status, setStatus] = useState('')
  const [aiTest, setAiTest] = useState('')
  const [dataUrl, setDataUrl] = useState(dataBase())
  const [dataTest, setDataTest] = useState('')

  const saveAll = () => {
    localStorage.setItem(SYNC_URL, url.trim().replace(/\/$/, ''))
    localStorage.setItem(SYNC_KEY, key.trim())
    localStorage.setItem(SYNC_CODE, code.trim())
    localStorage.setItem(AI_MODEL, aiModel.trim())
    localStorage.setItem(DATA_BASE, dataUrl.trim().replace(/\/$/, ''))
    onChanged?.()
  }
  const testData = async () => {
    const b = dataUrl.trim().replace(/\/$/, '')
    if (!b) { setDataTest('Đang dùng dữ liệu đóng gói sẵn trong app.'); return }
    setDataTest('⏳ Đang kiểm tra…')
    try {
      const r = await fetch(`${b}/subjects.json?t=${Date.now()}`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const list = await r.json()
      setDataTest(`✓ Kết nối được — thấy ${list.length} môn. Lưu rồi tải lại trang để dùng.`)
    } catch (e) {
      setDataTest(`✗ ${e.message}. Kiểm tra URL (phải trỏ tới thư mục chứa subjects.json) hoặc CORS.`)
    }
  }
  const test = async () => {
    saveAll()
    setStatus('Đang đồng bộ…')
    try { await syncNow(); setStatus('✓ Đã lưu & đồng bộ! Tiến độ đã gộp giữa các máy.'); onChanged?.() }
    catch (e) { setStatus('✗ ' + (e.message || 'Lỗi. Kiểm tra lại URL / key / bảng progress.')) }
  }
  const saveOnly = () => { saveAll(); setStatus('✓ Đã lưu trên máy này.') }
  const disconnect = () => {
    localStorage.removeItem(SYNC_URL); localStorage.removeItem(SYNC_KEY); localStorage.removeItem(SYNC_CODE)
    setUrl(''); setKey(''); setCode(''); setStatus('Đã ngắt đồng bộ trên máy này.'); onChanged?.()
  }
  const testAI = async () => {
    localStorage.setItem(AI_MODEL, aiModel.trim())
    setAiTest('⏳ Đang kiểm tra model…')
    const t0 = Date.now()
    try {
      const out = await askAI([{ role: 'user', content: 'Trả lời đúng một từ: OK' }], null, { maxTokens: 20, model: aiModel.trim() })
      setAiTest(`✓ Model chạy tốt (${((Date.now() - t0) / 1000).toFixed(1)}s). Trả lời: "${out.slice(0, 40)}"`)
    } catch (e) { setAiTest('✗ ' + e.message) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h2>⚙ Cài đặt</h2>

        <h3 style={{ marginTop: 6 }}>☁ Đồng bộ đa thiết bị (Supabase)</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '2px 0 4px' }}>
          Dán thông tin Supabase (miễn phí) + đặt một <strong>mã đồng bộ</strong> bí mật; nhập cùng 3 giá trị trên mọi máy. Hướng dẫn ở file <code>HUONG_DAN_SYNC.md</code>. Cấu hình AI bên dưới cũng được sync kèm.
        </p>
        <label className="fld">Supabase URL
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
        </label>
        <label className="fld">Anon public key
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGci..." />
        </label>
        <label className="fld">Mã đồng bộ (tự đặt, dùng chung mọi máy)
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="vd: giapdn-2026" />
        </label>

        <h3 style={{ marginTop: 20 }}>📚 Nguồn dữ liệu câu hỏi</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '2px 0 4px' }}>
          Để trống = dùng dữ liệu đóng gói sẵn trong app. Điền URL thư mục chứa <code>subjects.json</code> (vd GitHub raw) để lấy nội dung mới nhất mà <strong>không cần deploy lại</strong>. Lỗi mạng sẽ tự quay về bản đóng gói.
        </p>
        <label className="fld">URL dữ liệu từ xa (tuỳ chọn)
          <input value={dataUrl} onChange={(e) => { setDataUrl(e.target.value); setDataTest('') }}
            placeholder="https://raw.githubusercontent.com/user/repo/main/public/data" />
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button className="btn btn-sm btn-plain" onClick={testData}>⚡ Test nguồn</button>
          {dataTest && <span className={`sync-status ${dataTest.startsWith('✓') ? 'ok' : dataTest.startsWith('✗') ? 'bad' : ''}`} style={{ margin: 0, flex: 1 }}>{dataTest}</span>}
        </div>

        <h3 style={{ marginTop: 20 }}>🤖 AI hỏi-đáp & dịch</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '2px 0 4px' }}>
          Đã cấu hình sẵn qua CKEY.VN — bạn chỉ cần <strong>chọn model</strong> (lưu riêng từng máy, không đồng bộ). Bấm <strong>Test</strong> để thử model trước khi dùng.
        </p>
        <label className="fld">Model (dùng cho nút Hỏi AI & Dịch)
          <select value={aiModel} onChange={(e) => { setAiModel(e.target.value); setAiTest('') }}
            style={{ display: 'block', width: '100%', marginTop: 5, padding: 9, borderRadius: 9, border: '1px solid var(--border)' }}>
            {AI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            {!AI_MODELS.some((m) => m.id === aiModel) && <option value={aiModel}>{aiModel} (tuỳ chỉnh)</option>}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button className="btn btn-sm btn-plain" onClick={testAI}>⚡ Test model</button>
          {aiTest && <span className={`sync-status ${aiTest.startsWith('✓') ? 'ok' : aiTest.startsWith('✗') ? 'bad' : ''}`} style={{ margin: 0, flex: 1 }}>{aiTest}</span>}
        </div>

        {status && <div className={`sync-status ${status.startsWith('✓') ? 'ok' : status.startsWith('✗') ? 'bad' : ''}`}>{status}</div>}
        <div className="nav-row">
          <button className="btn btn-plain" onClick={onClose}>Đóng</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {c.url && <button className="btn btn-plain" onClick={disconnect}>Ngắt sync</button>}
            <button className="btn btn-plain" onClick={saveOnly}>Chỉ lưu</button>
            <button className="btn btn-primary" onClick={test}>Lưu & Đồng bộ</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- misc ----------
function Empty({ onExit, msg = 'Không có câu hỏi nào trong mục này.' }) {
  return (
    <div className="card empty">
      <p>{msg}</p>
      <button className="btn btn-primary" onClick={onExit}>Về trang chính</button>
    </div>
  )
}

// ---------- Home ----------
function Home({ subject, onMode, topic, setTopic, pool, theoryPool, topics }) {
  const [, force] = useState(0)
  const stats = store.get(statsKey(subject.id), { attempts: 0, correct: 0 })
  const wrong = store.get(wrongKey(subject.id), {})
  const wrongIds = Object.keys(wrong)
  const wrongInPool = pool.filter((q) => wrongIds.includes(q.id)).length
  const known = store.get(knownKey(subject.id), {})
  const unverified = pool.filter((q) => !q.verified).length

  const modes = [
    { id: 'practice', icon: '📝', name: 'Practice', desc: 'Làm từng câu, hiện đáp án + giải thích ngay.', count: `${pool.length} câu` },
    { id: 'exam', icon: '⏱️', name: 'Thi thử', desc: 'Chọn số câu & thời gian, nộp bài mới biết điểm.', count: `${pool.length} câu` },
    { id: 'flash', icon: '🃏', name: 'Flashcard', desc: 'Lật thẻ học thuộc, đánh dấu thẻ đã thuộc.', count: `${pool.length} câu` },
    { id: 'wrong', icon: '🔁', name: 'Ôn câu sai', desc: 'Luyện lại các câu từng làm sai (đúng 2 lần liên tiếp sẽ thoát danh sách).', count: `${wrongInPool} câu` },
    ...(subject.theory ? [{ id: 'theory', icon: '📖', name: 'Lý thuyết', desc: 'Tổng hợp lý thuyết theo chương + mẹo nhận diện bẫy đề, để xử lý câu không có trong ngân hàng.', count: 'Đọc tài liệu' }] : []),
    ...(theoryPool.length ? [{ id: 'theoryquiz', icon: '🧠', name: 'Luyện lý thuyết', desc: 'Trắc nghiệm sinh từ tài liệu lý thuyết — câu MỚI, không có trong ngân hàng đề.', count: `${theoryPool.length} câu` }] : []),
  ]

  const resetProgress = (what) => {
    const labels = { all: 'TOÀN BỘ tiến độ (thống kê, câu sai, thẻ đã thuộc)', wrong: 'danh sách câu sai', known: 'danh sách thẻ đã thuộc', stats: 'thống kê lượt làm' }
    if (!confirm(`Xoá ${labels[what]} của môn này?`)) return
    if (what === 'all' || what === 'wrong') localStorage.removeItem(wrongKey(subject.id))
    if (what === 'all' || what === 'known') localStorage.removeItem(knownKey(subject.id))
    if (what === 'all' || what === 'stats') localStorage.removeItem(statsKey(subject.id))
    notifyProgressChange()
    force((x) => x + 1)
  }

  return (
    <div>
      <div className="card">
        <h2>{subject.name}</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 4px' }}>{subject.description}</p>
        <div className="meta-row">
          <span className="badge badge-verified">✓ {pool.length - unverified} câu có đáp án gốc</span>
          {unverified > 0 && <span className="badge badge-unverified">⚠ {unverified} câu đề thi FE — đáp án do AI giải, chưa verify</span>}
        </div>
        <div className="chip-row">
          {topics.map((t) => (
            <button key={t} className={`chip ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>{t}</button>
          ))}
        </div>
        <div className="stat-grid">
          <div className="stat-box"><div className="num">{stats.attempts}</div><div className="lbl">lượt trả lời</div></div>
          <div className="stat-box"><div className="num">{stats.attempts ? Math.round((stats.correct / stats.attempts) * 100) : 0}%</div><div className="lbl">tỉ lệ đúng</div></div>
          <div className="stat-box"><div className="num">{wrongIds.length}</div><div className="lbl">câu đang sai</div></div>
          <div className="stat-box"><div className="num">{Object.keys(known).length}</div><div className="lbl">thẻ đã thuộc</div></div>
        </div>
        <div className="reset-row">
          <span>🗑 Xoá tiến độ:</span>
          <button className="btn btn-sm btn-plain" onClick={() => resetProgress('wrong')}>Câu sai</button>
          <button className="btn btn-sm btn-plain" onClick={() => resetProgress('known')}>Thẻ đã thuộc</button>
          <button className="btn btn-sm btn-plain" onClick={() => resetProgress('stats')}>Thống kê</button>
          <button className="btn btn-sm btn-danger" onClick={() => resetProgress('all')}>Tất cả</button>
        </div>
      </div>
      <div className="mode-grid">
        {modes.map((m) => (
          <button key={m.id} className="mode-card" onClick={() => onMode(m.id)}>
            <div className="icon">{m.icon}</div>
            <h3>{m.name}</h3>
            <p>{m.desc}</p>
            <span className="badge badge-topic count-badge">{m.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------- App root ----------
export default function App() {
  const [subjects, setSubjects] = useState(null)
  const [subject, setSubject] = useState(null)
  const [data, setData] = useState(null)
  const [theoryQs, setTheoryQs] = useState([])
  const [mode, setMode] = useState('home')
  const [topic, setTopic] = useState('Tất cả')
  const [error, setError] = useState(null)
  const [showSync, setShowSync] = useState(false)
  const [syncState, setSyncState] = useState(syncEnabled() ? 'idle' : 'off')
  const [, forceApp] = useState(0)

  useEffect(() => {
    fetchData('subjects.json')
      .then((list) => {
        setSubjects(list)
        if (list.length === 1) loadSubject(list[0])
      })
      .catch(() => setError('Không tải được danh sách môn học.'))
  }, [])

  // auto pull-merge-push on open, and push when tab hidden
  useEffect(() => {
    if (!syncEnabled()) return
    setSyncState('syncing')
    syncNow().then(() => { setSyncState('ok'); forceApp((x) => x + 1) }).catch(() => setSyncState('err'))
    const onHide = () => { if (document.visibilityState === 'hidden' && syncEnabled()) syncPush(collectProgress()).catch(() => {}) }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  const loadSubject = (s) => {
    setSubject(s)
    setData(null)
    setTheoryQs([])
    fetchData(s.file)
      .then(setData)
      .catch(() => setError(`Không tải được dữ liệu môn ${s.name}.`))
    if (s.theoryQuiz) {
      fetchData(s.theoryQuiz)
        .then((d) => setTheoryQs(d.questions || []))
        .catch(() => {})
    }
  }

  const pool = useMemo(() => {
    if (!data) return []
    return topic === 'Tất cả' ? data.questions : data.questions.filter((q) => q.topic === topic)
  }, [data, topic])

  const topics = useMemo(() => {
    if (!data) return ['Tất cả']
    const seen = []
    for (const q of [...data.questions, ...theoryQs]) {
      if (q.topic && !seen.includes(q.topic)) seen.push(q.topic)
    }
    return ['Tất cả', ...seen]
  }, [data, theoryQs])

  useEffect(() => {
    if (!topics.includes(topic)) setTopic('Tất cả')
  }, [topics]) // eslint-disable-line

  const theoryPool = useMemo(() => (
    topic === 'Tất cả' ? theoryQs : theoryQs.filter((q) => q.topic === topic)
  ), [theoryQs, topic])

  const wrongPool = useMemo(() => {
    if (!data || !subject) return []
    const wrong = store.get(wrongKey(subject.id), {})
    return [...pool, ...theoryPool].filter((q) => wrong[q.id])
  }, [data, subject, pool, theoryPool, mode])

  if (error) return <div className="card empty">{error}</div>
  if (!subjects) return <div className="card empty">Đang tải…</div>

  const goHome = () => setMode('home')

  return (
    <div>
      <div className="topbar">
        <div className="brand" onClick={() => { setMode('home') }}>
          🎓 QuizPrep<small>ôn thi FE</small>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {subjects.length > 1 && subject && (
            <select
              value={subject.id}
              onChange={(e) => { loadSubject(subjects.find((s) => s.id === e.target.value)); setMode('home'); setTopic('Tất cả') }}
              style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border)' }}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="btn btn-sm btn-plain sync-btn" title="Cài đặt: đồng bộ & AI" onClick={() => setShowSync(true)}>
            {syncState === 'off' && '⚙ Cài đặt'}
            {syncState === 'syncing' && '⏳ Sync…'}
            {syncState === 'ok' && '⚙ ☁✓'}
            {syncState === 'idle' && '⚙ ☁✓'}
            {syncState === 'err' && '⚙ ☁⚠'}
          </button>
        </div>
      </div>
      {showSync && <SyncModal onClose={() => setShowSync(false)} onChanged={() => { setSyncState(syncEnabled() ? 'ok' : 'off'); forceApp((x) => x + 1) }} />}

      {!subject && (
        <div className="mode-grid">
          {subjects.map((s) => (
            <button key={s.id} className="mode-card" onClick={() => loadSubject(s)}>
              <div className="icon">📚</div>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
            </button>
          ))}
        </div>
      )}

      {subject && !data && !error && <div className="card empty">Đang tải câu hỏi…</div>}

      {data && mode === 'home' && <Home subject={subject} onMode={setMode} topic={topic} setTopic={setTopic} pool={pool} theoryPool={theoryPool} topics={topics} />}
      {data && mode === 'practice' && <Practice subject={subject} pool={pool} onExit={goHome} title="Practice" />}
      {data && mode === 'exam' && <Exam subject={subject} pool={pool} onExit={goHome} />}
      {data && mode === 'flash' && <Flashcards subject={subject} pool={pool} onExit={goHome} />}
      {data && mode === 'theory' && <Theory subject={subject} onExit={goHome} />}
      {data && mode === 'theoryquiz' && <Practice subject={subject} pool={theoryPool} onExit={goHome} title="Luyện lý thuyết" />}
      {data && mode === 'wrong' && (
        wrongPool.length
          ? <Practice subject={subject} pool={wrongPool} onExit={goHome} title="Ôn câu sai" />
          : <Empty onExit={goHome} msg="Chưa có câu sai nào — làm Practice hoặc Thi thử trước nhé!" />
      )}
    </div>
  )
}
