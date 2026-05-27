// Firebase Configuration (Matching app.js)
const firebaseConfig = {
  apiKey: "AIzaSyA9yTUQ01nfyqBJB7lq1ZHV-IePsjkizSs",
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
    if (questionId !== currentActiveQuestionId) {
      currentActiveQuestionId = questionId;
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
  const answeredKey = `answered_${qId}`;
  const hasAnswered = localStorage.getItem(answeredKey);
  
  if (hasAnswered) {
    showSuccessState(localStorage.getItem(`answered_val_${qId}`) || "答案已送出");
    return;
  }
  
  transitionCardContent(() => {
    if (currentQuestionData.type === "wordcloud") {
      renderWordCloudInput();
    } else if (currentQuestionData.type === "poll") {
      renderPollButtons();
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
    // Write answer response to Firestore
    await db.collection(collectionName).add({
      questionId: qId,
      word: answerValue,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      deviceId: deviceId
    });
    
    // Save state locally to prevent repeat voting
    localStorage.setItem(`answered_${qId}`, "true");
    localStorage.setItem(`answered_val_${qId}`, answerValue);
    
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
