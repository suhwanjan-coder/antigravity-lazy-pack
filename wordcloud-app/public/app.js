// Firebase Configuration
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
const wordForm = document.getElementById("word-form");
const wordInput = document.getElementById("word-input");
const charCount = document.getElementById("char-count");
const totalWordsEl = document.getElementById("total-words");
const uniqueWordsEl = document.getElementById("unique-words");
const btnReset = document.getElementById("btn-reset");
const btnRefresh = document.getElementById("btn-refresh");
const btnDownload = document.getElementById("btn-download");
const canvas = document.getElementById("wordcloud-canvas");
const canvasOverlay = document.getElementById("canvas-overlay");
const overlayText = document.getElementById("overlay-text");

// Dynamic Classroom DOM Elements
const questionsListContainer = document.getElementById("questions-list-container");
const btnShowQrcode = document.getElementById("btn-show-qrcode");
const btnImportModal = document.getElementById("btn-import-modal");
const qrcodeModal = document.getElementById("qrcode-modal");
const closeQrcodeModal = document.getElementById("close-qrcode-modal");
const qrcodeImage = document.getElementById("qrcode-image");
const studentUrlText = document.getElementById("student-url-text");
const importModal = document.getElementById("import-modal");
const closeImportModal = document.getElementById("close-import-modal");
const importTextarea = document.getElementById("import-textarea");
const btnImportSubmit = document.getElementById("btn-import-submit");

// Local State
let questionsData = [];
let responsesData = []; // All responses across questions (filtered locally)
let selectedQuestionId = null; // Currently viewed question on dashboard
let broadcastingQuestionId = null; // Question currently pushed to student mobile views
let redrawTimeout = null;
let isOfflineMode = false; // Flag to indicate if database failed/offline

// Default Mock/Test Questions if DB is uninitialized
const defaultQuestions = [
  {
    id: "q1",
    text: "您目前在教學上面臨最大的痛點是什麼？ (文字雲題)",
    type: "wordcloud"
  },
  {
    id: "q2",
    text: "您認為 AI 教育代理人最能幫您節省哪種時間？ (投票題)",
    type: "poll",
    options: ["編寫教案設計", "設計評量考題", "批改作業與回饋", "課堂即時互動"]
  }
];

// Local Storage keys for offline backup
const OFFLINE_QUESTIONS_KEY = "wordcloud_offline_questions";
const OFFLINE_STATE_KEY = "wordcloud_offline_active_id";
const OFFLINE_RESPONSES_KEY = "wordcloud_offline_responses";

// Helper to get offline questions
function getOfflineQuestions() {
  const stored = localStorage.getItem(OFFLINE_QUESTIONS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return defaultQuestions;
}

// Helper to save offline questions
function saveOfflineQuestions(questions) {
  localStorage.setItem(OFFLINE_QUESTIONS_KEY, JSON.stringify(questions));
}

// Helper to get offline responses
function getOfflineResponses() {
  const stored = localStorage.getItem(OFFLINE_RESPONSES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Map to simulate Firestore Timestamp if needed
      return parsed.map(item => ({
        ...item,
        timestamp: item.timestamp && item.timestamp.seconds ? 
          { toDate: () => new Date(item.timestamp.seconds * 1000) } : 
          { toDate: () => new Date() }
      }));
    } catch (e) {}
  }
  return [];
}

// Add a simulated response offline
function addOfflineResponse(questionId, word) {
  const responses = getOfflineResponses();
  const newResponse = {
    id: "offline_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    questionId: questionId,
    word: word,
    timestamp: { toDate: () => new Date() }
  };
  responses.push(newResponse);
  localStorage.setItem(OFFLINE_RESPONSES_KEY, JSON.stringify(responses));
  responsesData = responses;
  updateVisualizations();
}

// Clear offline responses for a question
function clearOfflineResponses(questionId) {
  let responses = getOfflineResponses();
  responses = responses.filter(r => r.questionId !== questionId);
  localStorage.setItem(OFFLINE_RESPONSES_KEY, JSON.stringify(responses));
  responsesData = responses;
  updateVisualizations();
}

// Switch app smoothly into offline fallback mode
function switchToOfflineMode(reason) {
  if (isOfflineMode) return;
  isOfflineMode = true;
  console.log("Offline mode activated. Reason:", reason);
  
  // Show offline banner and reason
  const banner = document.getElementById("offline-banner");
  if (banner) {
    banner.classList.remove("hidden");
    const reasonSpan = banner.querySelector(".offline-reason");
    if (reasonSpan) {
      reasonSpan.textContent = `（雲端狀態：${reason}）`;
    }
  }
  
  // Load local state
  questionsData = getOfflineQuestions();
  broadcastingQuestionId = localStorage.getItem(OFFLINE_STATE_KEY) || "q1";
  if (!selectedQuestionId) {
    selectedQuestionId = broadcastingQuestionId;
  }
  
  responsesData = getOfflineResponses();
  
  // Update view
  hideOverlay();
  renderQuestionsList();
  updateVisualizations();
}

// --- 1. Initialize DB with Test Questions inside wordcloud_inputs if empty ---
async function checkAndInitializeDatabase() {
  try {
    // Check if questions exist under the wordcloud_inputs collection
    const qSnapshot = await db.collection(collectionName)
      .where("isQuestion", "==", true)
      .get();
      
    if (qSnapshot.empty) {
      console.log("Seeding default classroom questions to wordcloud_inputs...");
      const batch = db.batch();
      defaultQuestions.forEach(q => {
        const docRef = db.collection(collectionName).doc(`question_${q.id}`);
        batch.set(docRef, {
          isQuestion: true,
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || null
        });
      });
      await batch.commit();
    }
    
    // Check system broadcasting state
    const stateDoc = await db.collection(collectionName).doc("active_state").get();
    if (!stateDoc.exists) {
      await db.collection(collectionName).doc("active_state").set({
        isSystemState: true,
        activeQuestionId: "q1"
      });
    }
  } catch (err) {
    console.error("Initialization error:", err);
    throw err; // bubble up to startApp so it switches to offline mode
  }
}

// --- 2. Listen to Firestore Question List & System State (inside wordcloud_inputs) ---
function startListeningToQuestions() {
  if (isOfflineMode) return;

  // Listen to system state for active question broadcasting
  db.collection(collectionName).doc("active_state").onSnapshot((doc) => {
    const data = doc.data();
    if (data && data.activeQuestionId) {
      broadcastingQuestionId = data.activeQuestionId;
      if (!selectedQuestionId) {
        selectedQuestionId = broadcastingQuestionId; // Sync view on initial load
      }
      renderQuestionsList();
    }
  }, (error) => {
    console.error("Error reading system state:", error);
    switchToOfflineMode(`系統狀態讀取失敗：${error.message}`);
  });

  // Listen to questions collection
  db.collection(collectionName)
    .where("isQuestion", "==", true)
    .onSnapshot((snapshot) => {
      questionsData = [];
      snapshot.forEach(doc => {
        questionsData.push({ ...doc.data() });
      });
      
      // Sort questions naturally (q1, q2, q3...)
      questionsData.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      
      if (questionsData.length > 0 && !selectedQuestionId) {
        selectedQuestionId = questionsData[0].id;
      }
      renderQuestionsList();
      updateVisualizations();
    }, (error) => {
      console.error("Error reading questions:", error);
      switchToOfflineMode(`題目庫讀取失敗：${error.message}`);
    });
}

// --- 3. Render Questions List Sidebar UI ---
function renderQuestionsList() {
  if (questionsData.length === 0) {
    questionsListContainer.innerHTML = `<p class="card-desc" style="text-align:center;">無任何課堂題目，請點擊右上角批次匯入！</p>`;
    return;
  }

  let html = "";
  questionsData.forEach(q => {
    const isActive = q.id === selectedQuestionId ? "active" : "";
    const isBroadcasting = q.id === broadcastingQuestionId;
    const badgeClass = q.type === "wordcloud" ? "badge-wordcloud" : "badge-poll";
    const badgeText = q.type === "wordcloud" ? "文字雲" : "單選投票";
    
    html += `
      <div class="question-item ${isActive}" data-id="${q.id}">
        <span class="question-item-text">${q.text}</span>
        <div class="question-item-meta">
          <span class="question-type-badge ${badgeClass}">${badgeText}</span>
          <button class="btn-broadcast ${isBroadcasting ? 'broadcasting' : ''}" data-id="${q.id}">
            <i class="fa-solid ${isBroadcasting ? 'fa-volume-high' : 'fa-bullhorn'}"></i>
            ${isBroadcasting ? '廣播中' : '廣播問題'}
          </button>
        </div>
      </div>
    `;
  });
  
  questionsListContainer.innerHTML = html;

  // Add click handlers for question items (switches active view)
  questionsListContainer.querySelectorAll(".question-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".btn-broadcast")) return;
      
      const qId = item.getAttribute("data-id");
      selectedQuestionId = qId;
      renderQuestionsList();
      updateVisualizations();
    });
  });

  // Add click handlers for broadcast buttons
  questionsListContainer.querySelectorAll(".btn-broadcast").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const qId = btn.getAttribute("data-id");
      
      if (isOfflineMode) {
        broadcastingQuestionId = qId;
        localStorage.setItem(OFFLINE_STATE_KEY, qId);
        renderQuestionsList();
        console.log(`[Offline] Broadcasted question: ${qId}`);
        return;
      }
      
      try {
        await db.collection(collectionName).doc("active_state").set({
          isSystemState: true,
          activeQuestionId: qId
        });
        console.log(`Successfully broadcasted question: ${qId}`);
      } catch (err) {
        console.error("Broadcast failed:", err);
        alert("廣播失敗，請確認資料庫連線！");
      }
    });
  });
}

// --- 4. Listen to Responses (Filter out system state and question configurations locally) ---
function startListeningToResponses() {
  if (isOfflineMode) return;
  showOverlay("正在連線至雲端資料庫...");
  
  db.collection(collectionName)
    .orderBy("timestamp", "desc")
    .onSnapshot((snapshot) => {
      responsesData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Responses must have word, and must not be a question definition or active system state document
        if (data.word && !data.isQuestion && !data.isSystemState) {
          responsesData.push({ id: doc.id, ...data });
        }
      });
      
      updateVisualizations();
    }, (error) => {
      console.error("Firestore listen error:", error);
      switchToOfflineMode(`答案庫讀取失敗：${error.message}`);
    });
}

// --- 5. Dynamic Dual-Visualization Switcher ---
function updateVisualizations() {
  if (questionsData.length === 0 || !selectedQuestionId) return;

  const currentQ = questionsData.find(q => q.id === selectedQuestionId);
  if (!currentQ) return;

  // Filter responses locally for the selected question
  const activeResponses = responsesData.filter(res => res.questionId === selectedQuestionId);

  // Update Stats Box
  const totalCount = activeResponses.length;
  const uniqueWords = [...new Set(activeResponses.map(r => r.word.trim()))].length;
  totalWordsEl.textContent = totalCount;
  uniqueWordsEl.textContent = uniqueWords;

  // Clear existing poll chart elements if any
  const existingChart = document.getElementById("poll-results-container");
  if (existingChart) {
    existingChart.remove();
  }

  if (currentQ.type === "wordcloud") {
    // Show Canvas & draw
    canvas.style.display = "block";
    hideOverlay();
    
    if (activeResponses.length === 0) {
      showOverlay("目前無填答資料，請請學生掃描 QR Code 填答！", false);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    drawWordCloud(activeResponses);
  } else if (currentQ.type === "poll") {
    // Hide Canvas & render custom CSS animated bar chart overlay
    canvas.style.display = "none";
    hideOverlay();
    
    renderPollBarChart(currentQ, activeResponses);
  }
}

// Draw standard Word Cloud canvas
function drawWordCloud(activeResponses) {
  // Aggregate frequencies
  const frequencies = {};
  activeResponses.forEach(item => {
    const word = item.word.trim();
    if (word) {
      frequencies[word] = (frequencies[word] || 0) + 1;
    }
  });

  const fontScaleSlider = document.getElementById("font-scale-slider");
  const fontScale = fontScaleSlider ? parseFloat(fontScaleSlider.value) : 1.2;
  
  const maxFreq = Math.max(...Object.values(frequencies));
  const list = Object.entries(frequencies).map(([word, freq]) => {
    const baseWeight = Math.round((freq / maxFreq) * 45) + 15;
    const weight = Math.round(baseWeight * fontScale);
    return [word, weight];
  });
  
  list.sort((a, b) => b[1] - a[1]);
  
  try {
    resizeCanvas();
    const width = parseFloat(canvas.style.width);
    
    WordCloud(canvas, {
      list: list,
      gridSize: Math.round(16 * (width / 1024)) + 4,
      weightFactor: 1,
      fontFamily: "'Outfit', 'Inter', 'Noto Sans TC', sans-serif",
      fontWeight: '600',
      color: function () {
        const colors = ['#a855f7', '#06b6d4', '#ec4899', '#22c55e', '#3b82f6', '#ffffff', '#e9d5ff', '#cffafe'];
        return colors[Math.floor(Math.random() * colors.length)];
      },
      rotateRatio: 0.35,
      rotationSteps: 2,
      backgroundColor: 'transparent',
      drawOutOfBound: false,
      shrinkToFit: true,
      minSize: 12
    });
  } catch (error) {
    console.error("WordCloud2 canvas drawing error:", error);
  }
}

// Render dynamic animated bar chart for Poll questions
function renderPollBarChart(question, responses) {
  const options = question.options || [];
  
  // Calculate frequencies
  const counts = {};
  options.forEach(opt => counts[opt] = 0);
  
  responses.forEach(res => {
    const wordVal = res.word.trim();
    if (counts[wordVal] !== undefined) {
      counts[wordVal]++;
    }
  });
  
  const totalVotes = responses.length;
  
  // Generate HTML for Bar Charts
  let barsHtml = "";
  options.forEach(opt => {
    const count = counts[opt];
    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    
    barsHtml += `
      <div class="poll-bar-item">
        <div class="poll-bar-label">
          <span>${opt}</span>
          <span class="poll-bar-count">${count} 票 (${percent}%)</span>
        </div>
        <div class="poll-bar-track">
          <div class="poll-bar-fill" style="width: 0%;" data-width="${percent}%"></div>
        </div>
      </div>
    `;
  });
  
  const chartWrapper = document.createElement("div");
  chartWrapper.id = "poll-results-container";
  chartWrapper.className = "poll-results-container";
  
  if (totalVotes === 0) {
    chartWrapper.innerHTML = `
      <div class="state-container" style="color:var(--text-secondary);">
        <i class="fa-solid fa-square-poll-horizontal state-icon waiting-icon" style="font-size:3rem;"></i>
        <h3 style="color:white;">等待投票資料投射...</h3>
        <p>目前此題目尚無人填答，請請學生使用手機進行投票選擇！</p>
      </div>
    `;
  } else {
    chartWrapper.innerHTML = `
      <h3 style="color: white; font-family:var(--font-family-title); margin-bottom:10px; font-weight:600; font-size:1.15rem; border-left:3px solid var(--color-secondary); padding-left:10px;">
        目前總投票：${totalVotes} 票
      </h3>
      ${barsHtml}
    `;
  }
  
  // Insert bar chart inside the canvas parent container
  canvas.parentElement.appendChild(chartWrapper);
  
  // Trigger bar expansion animations on the next repaint
  requestAnimationFrame(() => {
    chartWrapper.querySelectorAll(".poll-bar-fill").forEach(fill => {
      const widthVal = fill.getAttribute("data-width");
      setTimeout(() => {
        fill.style.width = widthVal;
      }, 50);
    });
  });
}

// --- 6. Event Form Submission (Adapts to Teacher Testing) ---
wordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!selectedQuestionId) {
    alert("請先選擇題目！");
    return;
  }
  
  const word = wordInput.value.trim();
  if (!word) return;
  
  if (isOfflineMode) {
    addOfflineResponse(selectedQuestionId, word);
    wordInput.value = "";
    charCount.textContent = "0";
    wordInput.focus();
    return;
  }
  
  const submitBtn = wordForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  wordInput.disabled = true;
  
  try {
    await db.collection(collectionName).add({
      questionId: selectedQuestionId,
      word: word,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Reset Input
    wordInput.value = "";
    charCount.textContent = "0";
  } catch (error) {
    console.error("Firestore writing error:", error);
    alert("送出失敗！請稍後重試！");
  } finally {
    submitBtn.disabled = false;
    wordInput.disabled = false;
    wordInput.focus();
  }
});

// --- 7. Admin Reset & Redraw triggers ---
btnReset.addEventListener("click", async () => {
  if (!selectedQuestionId) return;
  const currentQ = questionsData.find(q => q.id === selectedQuestionId);
  const qText = currentQ ? currentQ.text : "當前題目";
  
  if (!confirm(`⚠️ 確定要清除「 ${qText} 」的所有填答數據嗎？\n此動作無法復原！`)) {
    return;
  }
  
  if (isOfflineMode) {
    clearOfflineResponses(selectedQuestionId);
    return;
  }
  
  showOverlay("正在清除該題填答資料...");
  
  try {
    // Query responses associated with the selected question
    const snapshot = await db.collection(collectionName)
      .where("questionId", "==", selectedQuestionId)
      .get();
      
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      // Safety filter: ensure we never delete question or system state configs
      const data = doc.data();
      if (!data.isQuestion && !data.isSystemState) {
        batch.delete(doc.ref);
      }
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Clearing database error:", error);
    alert("清除失敗！請重試。");
    hideOverlay();
  }
});

btnRefresh.addEventListener("click", () => {
  updateVisualizations();
});

// --- 8. QR Code Popup Modal Manager ---
btnShowQrcode.addEventListener("click", () => {
  // Determine URL path for the student response page
  let currentUrl = window.location.href;
  let studentUrl = "";
  
  if (currentUrl.includes("index.html")) {
    studentUrl = currentUrl.replace("index.html", "student.html");
  } else {
    // If ending with /
    const urlObj = new URL(currentUrl);
    studentUrl = `${urlObj.origin}/student.html`;
  }
  
  studentUrlText.textContent = studentUrl;
  
  // Use free dynamic QR Code API to generate target QR image
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(studentUrl)}`;
  qrcodeImage.src = qrApiUrl;
  
  // Display Modal
  qrcodeModal.classList.remove("hidden");
});

closeQrcodeModal.addEventListener("click", () => {
  qrcodeModal.classList.add("hidden");
});

qrcodeModal.addEventListener("click", (e) => {
  if (e.target === qrcodeModal) {
    qrcodeModal.classList.add("hidden");
  }
});

// --- 9. Batch Questions Importer & Text Parser ---
btnImportModal.addEventListener("click", () => {
  importModal.classList.remove("hidden");
  importTextarea.focus();
});

closeImportModal.addEventListener("click", () => {
  importModal.classList.add("hidden");
});

importModal.addEventListener("click", (e) => {
  if (e.target === importModal) {
    importModal.classList.add("hidden");
  }
});

// The Parser logic
btnImportSubmit.addEventListener("click", async () => {
  const text = importTextarea.value.trim();
  if (!text) {
    alert("請輸入要解析的問題！");
    return;
  }
  
  showOverlay("正在解析並部署題目庫...");
  
  try {
    const parsedQuestions = parseQuestionsText(text);
    if (parsedQuestions.length === 0) {
      alert("解析失敗！請確保格式包含 Q1. 題目內容，且題型標示正確。");
      hideOverlay();
      return;
    }
    
    if (isOfflineMode) {
      saveOfflineQuestions(parsedQuestions);
      questionsData = parsedQuestions;
      
      const firstQId = parsedQuestions[0].id;
      broadcastingQuestionId = firstQId;
      localStorage.setItem(OFFLINE_STATE_KEY, firstQId);
      
      // Wipe offline responses
      localStorage.removeItem(OFFLINE_RESPONSES_KEY);
      responsesData = [];
      
      selectedQuestionId = firstQId;
      importTextarea.value = "";
      importModal.classList.add("hidden");
      hideOverlay();
      
      renderQuestionsList();
      updateVisualizations();
      console.log("[Offline] Seeded new questions successfully, cleared response database!");
      return;
    }
    
    // Seeding Firestore Batch
    const batch = db.batch();
    
    // First, clear existing questions from Firestore
    const oldQSites = await db.collection(collectionName)
      .where("isQuestion", "==", true)
      .get();
    oldQSites.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Seeding new questions
    parsedQuestions.forEach(q => {
      const docRef = db.collection(collectionName).doc(`question_${q.id}`);
      batch.set(docRef, {
        isQuestion: true,
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options || null
      });
    });
    
    // Reset active broadcasting question to the first parsed question
    const firstQId = parsedQuestions[0].id;
    const stateRef = db.collection(collectionName).doc("active_state");
    batch.set(stateRef, { 
      isSystemState: true,
      activeQuestionId: firstQId 
    });
    
    await batch.commit();
    
    // Completely wipe all response data (ignore system configs and question docs)
    const responsesSnapshot = await db.collection(collectionName).get();
    const clearResponsesBatch = db.batch();
    responsesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.isQuestion && !data.isSystemState) {
        clearResponsesBatch.delete(doc.ref);
      }
    });
    await clearResponsesBatch.commit();
    
    // Reset states and close Modal
    selectedQuestionId = firstQId;
    importTextarea.value = "";
    importModal.classList.add("hidden");
    console.log("Seeded new questions successfully, cleared response database!");
  } catch (err) {
    console.error("Import questions failed:", err);
    alert("匯入失敗！請確認連線網路狀態！");
    hideOverlay();
  }
});

// Custom Text Parser for dynamic importing
function parseQuestionsText(inputText) {
  // Regex to split questions by blocks starting with Q followed by digit
  const questionBlocks = inputText.split(/(?=\bQ\d+[\.\:\s])/i);
  const results = [];
  let index = 1;
  
  questionBlocks.forEach(block => {
    const lines = block.trim().split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    
    // First line is the question header: Q1. Question Text (Type)
    const headerLine = lines[0];
    
    // Clean out Q1. or Q2: prefix
    let questionText = headerLine.replace(/^Q\d+[\.\:\s]*/i, "").trim();
    
    // Parse Type
    let type = "wordcloud"; // Default
    if (questionText.includes("(投票)") || questionText.includes("（投票）") || lines.length > 1) {
      type = "poll";
    }
    
    // Strip type descriptors from clean text
    questionText = questionText.replace(/\s*[\(（](文字雲|投票)[\)）]/g, "").trim();
    
    const options = [];
    if (type === "poll") {
      // Parse following lines as options
      for (let i = 1; i < lines.length; i++) {
        let opt = lines[i];
        // Strip prefixes like A., B., -, * or C.
        opt = opt.replace(/^([A-Z]\.|\-|\*)\s*/i, "").trim();
        if (opt) {
          options.push(opt);
        }
      }
    }
    
    const qId = `q${index}`;
    const questionObj = {
      id: qId,
      text: questionText,
      type: type
    };
    
    if (type === "poll" && options.length > 0) {
      questionObj.options = options;
    }
    
    results.push(questionObj);
    index++;
  });
  
  return results;
}

// --- 10. Canvas resizing & layout toggles ---
function resizeCanvas() {
  const container = canvas.parentElement;
  const padding = 24 * 2;
  const width = container.clientWidth - padding;
  const height = container.clientHeight - padding;
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
}

function showOverlay(message, showSpinner = true) {
  canvasOverlay.style.opacity = "1";
  canvasOverlay.style.pointerEvents = "all";
  overlayText.textContent = message;
  
  const spinner = canvasOverlay.querySelector(".spinner");
  if (showSpinner) {
    spinner.style.display = "block";
  } else {
    spinner.style.display = "none";
  }
}

function hideOverlay() {
  canvasOverlay.style.opacity = "0";
  canvasOverlay.style.pointerEvents = "none";
}

// Download Word Cloud Canvas as Image
btnDownload.addEventListener("click", () => {
  const currentQ = questionsData.find(q => q.id === selectedQuestionId);
  if (!currentQ || currentQ.type !== "wordcloud") {
    alert("只有文字雲題型支援畫布下載！");
    return;
  }

  // Filter responses locally for the selected question
  const activeResponses = responsesData.filter(res => res.questionId === selectedQuestionId);
  if (activeResponses.length === 0) {
    alert("目前沒有文字，無法下載！");
    return;
  }
  
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  
  tempCtx.fillStyle = "#060410";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  
  const link = document.createElement("a");
  link.download = `課堂互動文字雲-${currentQ.text.slice(0, 12)}-${new Date().toISOString().slice(0,10)}.png`;
  link.href = tempCanvas.toDataURL("image/png");
  link.click();
});

window.addEventListener("resize", () => {
  clearTimeout(redrawTimeout);
  redrawTimeout = setTimeout(() => {
    updateVisualizations();
  }, 300);
});

// --- Layout Toggles & Font Scale ---
const statsCard = document.getElementById("stats-card");
const helpCard = document.getElementById("help-card");
const toggleStatsCb = document.getElementById("toggle-stats-checkbox");
const toggleHelpCb = document.getElementById("toggle-help-checkbox");
const closeStatsBtn = document.getElementById("close-stats");
const closeHelpBtn = document.getElementById("close-help");
const fontScaleSlider = document.getElementById("font-scale-slider");
const fontScaleValue = document.getElementById("font-scale-value");

function loadLayoutSettings() {
  const showStats = localStorage.getItem("layout-show-stats") !== "false";
  const showHelp = localStorage.getItem("layout-show-help") !== "false";
  
  toggleStatsCb.checked = showStats;
  toggleHelpCb.checked = showHelp;
  
  updateCardVisibility("stats", showStats);
  updateCardVisibility("help", showHelp);
}

function updateCardVisibility(type, visible) {
  const card = type === "stats" ? statsCard : helpCard;
  const cb = type === "stats" ? toggleStatsCb : toggleHelpCb;
  
  cb.checked = visible;
  localStorage.setItem(`layout-show-${type}`, visible);
  
  if (visible) {
    card.classList.remove("hidden");
  } else {
    card.classList.add("hidden");
  }
}

toggleStatsCb.addEventListener("change", (e) => {
  updateCardVisibility("stats", e.target.checked);
});

toggleHelpCb.addEventListener("change", (e) => {
  updateCardVisibility("help", e.target.checked);
});

closeStatsBtn.addEventListener("click", () => {
  updateCardVisibility("stats", false);
});

closeHelpBtn.addEventListener("click", () => {
  updateCardVisibility("help", false);
});

// Font scale slider events
function loadFontScaleSetting() {
  const storedScale = localStorage.getItem("wordcloud-font-scale") || "1.2";
  if (fontScaleSlider) {
    fontScaleSlider.value = storedScale;
    fontScaleValue.textContent = `${storedScale}x`;
  }
}

if (fontScaleSlider) {
  fontScaleSlider.addEventListener("input", (e) => {
    const scaleVal = e.target.value;
    fontScaleValue.textContent = `${scaleVal}x`;
    localStorage.setItem("wordcloud-font-scale", scaleVal);
    
    clearTimeout(redrawTimeout);
    redrawTimeout = setTimeout(() => {
      updateVisualizations();
    }, 50);
  });
}

// --- Start Executing App ---
// --- Start Executing App ---
async function startApp() {
  loadLayoutSettings();
  loadFontScaleSetting();
  
  // Set a timeout to trigger offline mode if database initialization takes too long
  let dbInitCompleted = false;
  const dbTimeout = setTimeout(() => {
    if (!dbInitCompleted) {
      console.warn("Database initialization timed out. Switching to offline mode...");
      switchToOfflineMode("資料庫連線逾時（無回應）");
    }
  }, 3500);

  try {
    if (typeof firebase === 'undefined') {
      throw new Error("Firebase SDK 載入失敗");
    }
    
    await checkAndInitializeDatabase();
    dbInitCompleted = true;
    clearTimeout(dbTimeout);
    
    startListeningToQuestions();
    startListeningToResponses();
  } catch (err) {
    dbInitCompleted = true;
    clearTimeout(dbTimeout);
    console.error("Failed to start online app, switching to offline mode:", err);
    switchToOfflineMode(err.message || "未知連線錯誤");
  }
}

startApp();
