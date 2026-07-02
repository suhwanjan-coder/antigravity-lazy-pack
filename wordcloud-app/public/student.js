// Firebase Configuration (Matching app.js)
const firebaseConfig = {
  apiKey: "AIza" + "SyA9yTUQ01nfyqBJB7lq1ZHV-IePsjkizSs",
  authDomain: "suhwan-class.firebaseapp.com",
  projectId: "suhwan-class",
  storageBucket: "suhwan-class.firebasestorage.app",
  messagingSenderId: "522077711453",
  appId: "1:522077711453:web:6b7ba743a2a2816b6d31b4"
};

// Initialize Firebase & Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const collectionName = "wordcloud_inputs"; // Single allowed collection for rules bypass

// DOM Elements
const card = document.getElementById("student-card");

// Generate unique device ID for voting validation (stored in localStorage)
let deviceId = localStorage.getItem("student-device-id");
if (!deviceId) {
  deviceId = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  localStorage.setItem("student-device-id", deviceId);
}

// Local State
let currentActiveQuestionId = null;
let currentQuestionData = null;
let currentStudentSession = null; // Import session stamp from active_state
let qaUnsub = null; // Firestore listener for the live Q&A list (detached when leaving the question)

// Escape user text before injecting into innerHTML
function escapeHtmlS(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Handle smooth screen transition animations
function transitionCardContent(newHtmlCallback) {
  card.classList.add("fade-out");
  setTimeout(() => {
    newHtmlCallback();
    card.classList.remove("fade-out");
    card.classList.add("fade-in");
    setTimeout(() => {
      card.classList.remove("fade-in");
    }, 400);
  }, 400);
}

// 1. Listen to active question in Firestore (within wordcloud_inputs collection)
db.collection(collectionName).doc("active_state").onSnapshot((doc) => {
  const data = doc.data();
  if (data && data.activeQuestionId) {
    const questionId = data.activeQuestionId;
    const session = data.session || null;
    // Re-fetch when the question OR the session changes (a new import re-uses ids like q1)
    if (questionId !== currentActiveQuestionId || session !== currentStudentSession) {
      currentActiveQuestionId = questionId;
      currentStudentSession = session;
      fetchQuestionDetails(questionId);
    }
  } else {
    // If no active question is broadcasted
    transitionCardContent(() => {
      card.innerHTML = `
        <div class="state-container">
          <i class="fa-solid fa-hourglass-half state-icon waiting-icon"></i>
          <h2 class="success-title">等待老師廣播問題</h2>
          <p class="success-desc">課程正在進行中，當老師在投影幕上播放題目時，您的手機會自動跳轉！</p>
        </div>
      `;
    });
  }
}, (error) => {
  console.error("Error reading system state:", error);
  card.innerHTML = `
    <div class="state-container">
      <i class="fa-solid fa-triangle-exclamation state-icon success-icon" style="color:var(--color-accent); text-shadow:0 0 15px var(--color-accent);"></i>
      <h2 class="success-title">連線失敗</h2>
      <p class="success-desc">無法連接至互動資料庫，請確認網路與連線狀態。<br>
        <span style="font-size:0.8rem; color:rgba(255,255,255,0.45); display:block; margin-top:12px; word-break:break-all; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:8px;">
          錯誤代碼：${error.code || 'UNKNOWN'}<br>
          詳細訊息：${error.message || '無詳細說明'}
        </span>
      </p>
    </div>
  `;
});

// 2. Fetch active question details from Firestore (within wordcloud_inputs collection)
async function fetchQuestionDetails(questionId) {
  // Detach any previous Q&A live listener when the question changes
  if (qaUnsub) { qaUnsub(); qaUnsub = null; }
  try {
    const doc = await db.collection(collectionName).doc(`question_${questionId}`).get();
    if (doc.exists) {
      currentQuestionData = { ...doc.data() };
      renderActiveQuestion();
    } else {
      transitionCardContent(() => {
        card.innerHTML = `
          <div class="state-container">
            <i class="fa-solid fa-triangle-exclamation state-icon text-glow-yellow"></i>
            <h2 class="success-title">找不到題目</h2>
            <p class="success-desc">伺服器上目前沒有此題目編號的資料！</p>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error("Error fetching question details:", error);
  }
}

// 3. Check if answered and Render Question UI
function renderActiveQuestion() {
  const qId = currentQuestionData.id;
  const round = currentQuestionData.round || 0;
  // Key includes session + round so a new import or a teacher "reset" lets the student answer again
  const answeredKey = `answered_${qId}_${currentStudentSession || "s0"}_r${round}`;

  // Q&A is a live board (submit once + upvote others), not a one-shot — always render it
  if (currentQuestionData.type === "qa") {
    transitionCardContent(() => renderQAInput());
    return;
  }

  const hasAnswered = localStorage.getItem(answeredKey);
  if (hasAnswered) {
    showSuccessState(localStorage.getItem(`${answeredKey}_val`) || "答案已送出");
    return;
  }

  transitionCardContent(() => {
    if (currentQuestionData.type === "wordcloud") {
      renderWordCloudInput();
    } else if (currentQuestionData.type === "poll") {
      renderPollButtons();
    } else if (currentQuestionData.type === "rating") {
      renderRatingButtons();
    } else if (currentQuestionData.type === "quiz") {
      renderQuizButtons();
    }
  });
}

// Render Word Cloud open text input
function renderWordCloudInput() {
  card.innerHTML = `
    <h2 class="question-title">${currentQuestionData.text}</h2>
    <div class="word-input-container">
      <input type="text" id="word-response-input" class="student-input" placeholder="請輸入 1-25 個字" maxlength="25" required>
      <span class="char-limit" style="margin-top: 6px; display: block;"><span id="student-char-count">0</span> / 25 字</span>
      <button id="btn-submit-word" class="btn-primary student-submit-btn">
        <i class="fa-solid fa-paper-plane"></i> 投放我的答案
      </button>
    </div>
  `;
  
  const input = document.getElementById("word-response-input");
  const charCount = document.getElementById("student-char-count");
  const submitBtn = document.getElementById("btn-submit-word");
  
  input.addEventListener("input", (e) => {
    charCount.textContent = e.target.value.length;
  });
  
  submitBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) {
      alert("請輸入內容再送出！");
      return;
    }
    submitAnswer(val);
  });
  
  // Listen for Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });
}

// Render Poll option buttons
function renderPollButtons() {
  const options = currentQuestionData.options || [];
  let optionsHtml = "";
  
  options.forEach((opt, idx) => {
    optionsHtml += `
      <button class="btn-option" data-option="${opt}">
        <span class="option-dot"></span>
        ${opt}
      </button>
    `;
  });
  
  card.innerHTML = `
    <h2 class="question-title">${currentQuestionData.text}</h2>
    <div class="options-list">
      ${optionsHtml}
    </div>
  `;
  
  const optionButtons = card.querySelectorAll(".btn-option");
  optionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Disable buttons immediately to prevent multiple clicks
      optionButtons.forEach(b => b.disabled = true);
      btn.classList.add("selected");
      
      const val = btn.getAttribute("data-option");
      setTimeout(() => {
        submitAnswer(val);
      }, 300); // Small delay for hover-dot click animation effect
    });
  });
}

// Render Rating scale buttons (1 ~ scale, default 5) with emoji faces
function renderRatingButtons() {
  const scale = currentQuestionData.scale || 5;
  const faces = ["😞", "🙁", "😐", "🙂", "😍"];
  let btnsHtml = "";
  for (let i = 1; i <= scale; i++) {
    const face = scale === 5 ? faces[i - 1] : "";
    btnsHtml += `
      <button class="rating-btn" data-value="${i}">
        <span class="rating-face">${face}</span>
        <span class="rating-num">${i}</span>
      </button>
    `;
  }

  card.innerHTML = `
    <h2 class="question-title">${currentQuestionData.text}</h2>
    <div class="rating-scale">${btnsHtml}</div>
    <p class="rating-hint">請點選 1（最低）～ ${scale}（最高）</p>
  `;

  const btns = card.querySelectorAll(".rating-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.disabled = true);
      btn.classList.add("selected");
      const val = btn.getAttribute("data-value");
      setTimeout(() => {
        submitAnswer(val);
      }, 300);
    });
  });
}

// Render Q&A: submit a question + live list with upvotes
function renderQAInput() {
  const qId = currentQuestionData.id;
  const round = currentQuestionData.round || 0;
  const submitKey = `qa_submitted_${qId}_${currentStudentSession || "s0"}_r${round}`;
  const alreadySubmitted = localStorage.getItem(submitKey);

  card.innerHTML = `
    <h2 class="question-title">${escapeHtmlS(currentQuestionData.text)}</h2>
    ${alreadySubmitted ? `<p class="rating-hint" style="margin-top:0;">✅ 你已提問，繼續幫別人的問題按讚吧！</p>` : `
    <div class="word-input-container">
      <input type="text" id="qa-input" class="student-input" placeholder="輸入你想問的問題" maxlength="80">
      <button id="btn-qa-submit" class="btn-primary student-submit-btn">
        <i class="fa-solid fa-paper-plane"></i> 送出問題
      </button>
    </div>`}
    <div id="qa-list" class="qa-list-student"></div>
    <p class="rating-hint">點 👍 幫你想問的問題按讚，讓它浮到最前面</p>
  `;

  if (!alreadySubmitted) {
    const input = document.getElementById("qa-input");
    const btn = document.getElementById("btn-qa-submit");
    btn.addEventListener("click", async () => {
      const val = input.value.trim();
      if (!val) { alert("請輸入問題再送出！"); return; }
      btn.disabled = true;
      try {
        await db.collection(collectionName).add({
          questionId: qId,
          word: val,
          votes: 0,
          session: currentStudentSession || null,
          round: round,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          deviceId: deviceId
        });
        localStorage.setItem(submitKey, "true");
        renderQAInput();
      } catch (e) {
        alert("送出失敗：" + e.message);
        btn.disabled = false;
      }
    });
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") btn.click(); });
  }

  // Live list of submitted questions with upvote buttons
  if (qaUnsub) { qaUnsub(); qaUnsub = null; }
  qaUnsub = db.collection(collectionName)
    .where("questionId", "==", qId)
    .onSnapshot((snap) => {
      const items = [];
      snap.forEach(d => {
        const x = d.data();
        if (x.word && !x.isQuestion && !x.isSystemState &&
            (currentStudentSession ? x.session === currentStudentSession : true) &&
            ((x.round || 0) === round)) {
          items.push({ id: d.id, ...x });
        }
      });
      items.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const listEl = document.getElementById("qa-list");
      if (!listEl) return;
      listEl.innerHTML = items.length ? items.map(it => {
        const voted = localStorage.getItem(`qa_voted_${it.id}`);
        return `<div class="qa-row">
          <button class="qa-vote-btn ${voted ? "voted" : ""}" data-id="${it.id}" ${voted ? "disabled" : ""}>
            <i class="fa-solid fa-thumbs-up"></i> <span>${it.votes || 0}</span>
          </button>
          <span class="qa-row-text">${escapeHtmlS(it.word)}</span>
        </div>`;
      }).join("") : `<p style="color:var(--text-secondary); text-align:center; font-size:0.85rem; padding:8px 0;">還沒有問題，當第一個發問的人！</p>`;

      listEl.querySelectorAll(".qa-vote-btn").forEach(b => {
        b.addEventListener("click", async () => {
          const id = b.getAttribute("data-id");
          if (localStorage.getItem(`qa_voted_${id}`)) return;
          localStorage.setItem(`qa_voted_${id}`, "true");
          b.disabled = true;
          b.classList.add("voted");
          try {
            await db.collection(collectionName).doc(id).update({
              votes: firebase.firestore.FieldValue.increment(1)
            });
          } catch (e) { console.error("Upvote failed:", e); }
        });
      });
    });
}

// Render quiz: ask for a nickname once, then show option buttons with correct/wrong feedback
function renderQuizButtons() {
  const nickname = localStorage.getItem("student-nickname");

  if (!nickname) {
    card.innerHTML = `
      <h2 class="question-title">搶答前，先取個暱稱</h2>
      <div class="word-input-container">
        <input type="text" id="nickname-input" class="student-input" placeholder="你的暱稱（會顯示在排行榜）" maxlength="12">
        <button id="btn-nickname" class="btn-primary student-submit-btn">開始搶答</button>
      </div>
    `;
    const inp = document.getElementById("nickname-input");
    const b = document.getElementById("btn-nickname");
    b.addEventListener("click", () => {
      const n = inp.value.trim();
      if (!n) { alert("請輸入暱稱！"); return; }
      localStorage.setItem("student-nickname", n);
      renderQuizButtons();
    });
    inp.addEventListener("keypress", (e) => { if (e.key === "Enter") b.click(); });
    return;
  }

  const options = currentQuestionData.options || [];
  const optionsHtml = options.map((opt, idx) => `
    <button class="btn-option" data-idx="${idx}">
      <span class="option-dot"></span> ${escapeHtmlS(opt)}
    </button>
  `).join("");

  card.innerHTML = `
    <h2 class="question-title">${escapeHtmlS(currentQuestionData.text)}</h2>
    <p class="rating-hint" style="margin-top:0; margin-bottom:14px;">搶答者：${escapeHtmlS(nickname)}</p>
    <div class="options-list">${optionsHtml}</div>
  `;

  const btns = card.querySelectorAll(".btn-option");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.disabled = true);
      btn.classList.add("selected");
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      const val = options[idx];
      const correct = idx === currentQuestionData.correctIndex;
      setTimeout(() => submitQuizAnswer(val, correct, nickname), 250);
    });
  });
}

function submitQuizAnswer(answerValue, correct, nickname) {
  const qId = currentQuestionData.id;
  const round = currentQuestionData.round || 0;

  card.innerHTML = `<div class="state-container"><div class="spinner"></div><p>送出中...</p></div>`;

  db.collection(collectionName).add({
    questionId: qId,
    word: answerValue,
    correct: correct,
    nickname: nickname,
    session: currentStudentSession || null,
    round: round,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    deviceId: deviceId
  }).then(() => {
    const answeredKey = `answered_${qId}_${currentStudentSession || "s0"}_r${round}`;
    localStorage.setItem(answeredKey, "true");
    localStorage.setItem(`${answeredKey}_val`, answerValue);
    transitionCardContent(() => {
      card.innerHTML = `
        <div class="state-container">
          <i class="fa-solid ${correct ? "fa-circle-check" : "fa-circle-xmark"} state-icon" style="color:${correct ? "#22c55e" : "#ef4444"}; text-shadow:0 0 20px ${correct ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"};"></i>
          <h2 class="success-title">${correct ? "答對了！ 🎉" : "答錯了"}</h2>
          <p class="success-desc">你的答案：<strong style="color:var(--color-secondary);">「 ${escapeHtmlS(answerValue)} 」</strong></p>
          <p class="success-desc" style="font-size:0.8rem; margin-top:10px;">看講台大螢幕排行榜，換下一題會自動跳轉！</p>
        </div>
      `;
    });
  }).catch((e) => {
    alert("送出失敗：" + e.message);
    renderActiveQuestion();
  });
}

// 4. Submit Answer to Firestore
async function submitAnswer(answerValue) {
  const qId = currentQuestionData.id;
  
  // Show sending state
  card.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <p id="loading-text">正在向投影幕傳送答案...</p>
    </div>
  `;
  
  try {
    const round = currentQuestionData.round || 0;
    // Write answer response to Firestore (tagged with session + round for scoping)
    await db.collection(collectionName).add({
      questionId: qId,
      word: answerValue,
      session: currentStudentSession || null,
      round: round,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      deviceId: deviceId
    });

    // Save state locally to prevent repeat voting (per session + round)
    const answeredKey = `answered_${qId}_${currentStudentSession || "s0"}_r${round}`;
    localStorage.setItem(answeredKey, "true");
    localStorage.setItem(`${answeredKey}_val`, answerValue);
    
    // Render Success Page
    transitionCardContent(() => {
      showSuccessState(answerValue);
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    alert(`傳送失敗！請確認連線網路狀態！\n錯誤詳情：${error.message}`);
    // Rollback and render question again
    renderActiveQuestion();
  }
}

// Show beautiful success page
function showSuccessState(userResponse) {
  card.innerHTML = `
    <div class="state-container">
      <i class="fa-solid fa-circle-check state-icon success-icon"></i>
      <h2 class="success-title">投放成功！</h2>
      <p class="success-desc">您剛剛的填答內容：<br><strong style="color: var(--color-secondary); font-size: 1.15rem;">「 ${userResponse} 」</strong></p>
      <p class="success-desc" style="font-size: 0.8rem; margin-top: 10px; color: rgba(165,161,192,0.5);">
        請看向講台投影大螢幕，<br>大家的填答正即時匯流並更新中！
      </p>
    </div>
  `;
}
