/**
 * AI Agent Roundtable Room - Interactive Controller
 * 實作三方 AI 模擬辯論引擎、狀態控制、指針變動與「主持人指示」介入邏輯。
 */

// ==========================================================================
// 1. 模擬辯論腳本數據集 (實務 vs 行政 vs 學術)
// ==========================================================================
const DEBATE_SCRIPTS = {
  // 議題 1：評估是否全面推行週休三日與彈性遠距工作制度
  workweekTopic: {
    // 激進衝突模式
    debate: [
      {
        speaker: 'clinician',
        content: '從實務執行層面來看，全面推行週休三日或彈性遠距，對於排班制或需要實體在場的行業（如製造、第一線服務與物流業）會造成嚴重的人力缺口！這會導致在班同仁的工作強度急遽升高，甚至造成服務品質下降，根本是空中樓閣。'
      },
      {
        speaker: 'administrator',
        content: 'Dr. Clinic 您的看法太保守了。從行政與營運管理的角度來看，彈性遠距工作能顯著減少辦公室硬體維護、水電等固定行政成本。此外，這也是現代組織吸引與留住頂尖年輕人才的核心指標。只要透過數位工具與明確的 KPI 考核，行政效益會遠大於排班的調整成本。'
      },
      {
        speaker: 'academic',
        content: '我建議大家回歸學術與實證數據。根據 2023 年冰島與英國的大規模週休三日實驗報告，86% 的參與企業在產能未下降的情況下，員工過勞率降低了 71%。然而，學術界也指出，這必須搭配「非同步溝通理論」與專案管理工具的全面升級，否則只是形式上的縮短工時，無法解決根本的產出問題。'
      },
      {
        speaker: 'clinician',
        content: '冰島跟英國的實驗大部分都是辦公室型的白領產業！我們必須考慮到「實體現場」的辛苦。如果行政端只用 KPI 逼迫大家在更少的時間內做完一樣多的事情，這不是減壓，這是變相的「彈性壓榨」！'
      },
      {
        speaker: 'administrator',
        content: '這就是為什麼我們需要行政規範來輔助。行政部可以針對實體部門進行「工時與班表重組計畫」，例如導入更靈活的兩班/三班交替，並引進智慧排班系統。數位轉型是一定要走的，否則組織的管理模式將停留在上個世紀，最終因招不到人而自然淘汰！'
      },
      {
        speaker: 'academic',
        content: '這兩者的矛盾，其實正是「工作再設計 (Work Redesign)」的極佳學術研究契機。我建議組織不要「全面一刀切推行」，而是採取隨機對照的試辦方案。挑選部分部門作為試辦組，其他為對照組，進行為期三個月的追蹤研究。我們學術團隊會設計嚴謹的量表評估生產力、員工健康度與行政成本，並將結果送審，產出具國際影響力的實證報告！'
      }
    ],
    // 和諧共識模式
    synergy: [
      {
        speaker: 'clinician',
        content: '我不反對更彈性的生活，但前提是必須「增補實務人力」或「縮減非必要工作流程」。如果能把繁雜的行政報表自動化，釋放實務量能，那我們非常樂意配合試辦彈性工時。'
      },
      {
        speaker: 'administrator',
        content: '行政部完全贊同簡化流程！我們願意投入預算進行系統自動化，砍掉 30% 的冗長簽核。同時，對於排班受限的實體同仁，行政部會編列專責的彈性補貼或發放輪班特別加給，確保公平性。'
      },
      {
        speaker: 'academic',
        content: '太棒了，這正是組織行為學中的「雙因素理論」應用。學術團隊會協助設計這套簡化流程的成效指標，利用「非同步協作」降低同仁的即時會議負擔。這樣既能降低行政成本，又能讓第一線同仁有感減壓，打造完美的智慧組織範例。'
      }
    ],
    // 學術與實證審查模式
    academic: [
      {
        speaker: 'academic',
        content: '本次審查主題為彈性工作制度的實證成效。根據多項組織心理學的研究，縮短工時與產出之間並非線性關係，而是取決於「工作自主性」與「管理信任度」。在全面導入前，必須先進行嚴謹的「前導性研究 (Pilot Study)」與變革準備度評估。'
      },
      {
        speaker: 'clinician',
        content: '我非常認同教授的實證觀點。不同部門的屬性天差地遠。如果能先做試辦研究，讓我們實務同仁共同參與變革指標的制定，調校各部門的工時彈性，這樣的制度我們才敢放心配合。'
      },
      {
        speaker: 'administrator',
        content: '行政部全力支持實證導向的試辦方案。這能將管理風險降到最低，規避組織轉型的混亂，同時還能將試辦成果向業界或政府申請「友善職場標章」與相關企業補助，在行政聲譽與實質財務上達到雙贏。'
      }
    ]
  },

  // 議題 2：評估是否在急診全面引進 AI 智慧快速分流與風險預警系統 (保留備用)
  aiWorkflowTopic: {
    // 激進衝突模式
    debate: [
      {
        speaker: 'clinician',
        content: '身為第一線實務人員，我強烈反對此時在組織內「全面」盲目推行 AI 智慧助理與工作流自動化！在實際操作中，這些系統往往存在極高比例的「無效警報與繁冗提示」，這會造成嚴重的「警報疲勞與注意力分散」。同仁們每天光是去排除系統Bug、登錄重複的報表就飽了，根本無法專注在核心業務上！我們基層最缺的是實質的做事人力，而不是多一個整天彈窗、增加行政工作又沒有實際幫助的系統。'
      },
      {
        speaker: 'administrator',
        content: '基層的看法太過保守了。從組織營運與行政管理的角度看，流程堵塞是今年提升運作效能與降本增效的重中之重。AI 工作流系統能提供明確的客觀數據分析，縮短流程等待時間，至少幫團隊省下 30% 以上的重覆性行政簽核時間。長期來看，這能大幅提升團隊的專案推進速度與經營效率。引進此系統勢在必行！'
      },
      {
        speaker: 'academic',
        content: '我建議大家回歸學術與實證精神。根據組織行為學與變革管理實證研究，AI 自動化工作流在單一示範實驗中確實能提升 15% 的產出效率，但在跨部門的外部複雜驗證中，由於「自動化偏誤 (Automation Bias)」與人機協作摩擦，實際生產力反而可能下降 20%。這說明系統如果沒有針對各部門的具體流程進行「局部微調與參與式設計」，直接全面上線的變革風險極高。'
      },
      {
        speaker: 'clinician',
        content: '學者說得沒錯！實務現場的環境非常多變，AI 往往只能處理常規流程，一旦遇到例外狀況，AI 很容易誤判，進而引發嚴重的流程斷點！如果同仁過度依賴 AI，反而會喪失第一線專業的靈活直覺。管理端只看到報表上的效率和經營分數，卻沒看到實際出事時，第一線執行同仁要扛起所有的責任！'
      },
      {
        speaker: 'administrator',
        content: '這就是為什麼我們需要行政規範來輔助。行政管理端可以制定「AI 輔助作業 SOP」，明訂 AI 僅供參考與初篩，最終決定權與核准權仍在資深同仁手中。但我們不能因為害怕例外狀況的特例，就抹殺 AI 自動化幫忙處理掉 90% 常規冗繁工作、釋放基層人力時間的巨大經營效益。如果因為害怕變革就拒絕數位轉型，我們組織的競爭力將嚴重倒退，最終被時代淘汰！'
      },
      {
        speaker: 'academic',
        content: '行政與實務的矛盾，其實可以透過科學的變革管理研究來解決。我建議不要「全面一刀切引進」，而是採取「隨機對照試驗 (RCT)」的分階段導入。我們將業務部門隨機分為「AI 智慧助理試辦組」與「傳統對照組」，試用三個月，系統性收集員工生產力、數位過勞率、系統誤報率與整體營運成本等三方指標。這不僅能大幅規避轉型風險，還能產出一篇極具參考價值的實證報告，對組織聲譽大有幫助。'
      }
    ],
    // 和諧共識模式
    synergy: [
      {
        speaker: 'clinician',
        content: '我不反對科技輔助，但必須以「不增加一線同仁額外登錄負擔」為前提。如果 AI 智慧助理能直接無縫整合進我們現有的工作平台，且只有在真正高風險或有重大流程遺漏時才跳出極簡的關鍵提示，而不是一直彈窗打擾，那我們願意在局部試用。'
      },
      {
        speaker: 'administrator',
        content: '管理端非常樂意配合簡化流程！我們可以要求技術開發商進行深度對接，確保一鍵登錄，絕不讓同仁做重複的文書作業。同時，我們會編列專案津貼，為試辦單位的同仁提供系統操作補助與專責協作人員，實質降低同仁的負擔。'
      },
      {
        speaker: 'academic',
        content: '太棒了，這正是組織變革中「參與式設計」與「限制型提示機制」的完美應用。我們學術團隊可以負責設計這套系統的成效指標，利用機器學習動態調整 AI 介入的閾值，降低 40% 的無效警報。這樣既能引領組織升級，又能兼顧第一線效率，打造出雙贏的智慧協作典範。'
      }
    ],
    // 學術與實證審查模式
    academic: [
      {
        speaker: 'academic',
        content: '本期審查主題為 AI 智慧助理與工作流系統的實證成效。根據多項組織變革與人機協作的系統評價，新系統引進前，必須先進行嚴謹的「可行性分析」與「變革準備度評估」，評估演算法對組織內部特定業務的適應度與潛在的數位過勞風險。'
      },
      {
        speaker: 'clinician',
        content: '我十分贊同教授的實證觀點。不同部門的業務複雜度天差地遠。如果能先做嚴謹的試辦評估，讓我們實務同仁共同參與 AI 提示特徵的篩選與參數調校，這樣的系統我們才敢在第一線放心使用。'
      },
      {
        speaker: 'administrator',
        content: '管理端全力支持學術與實證導向的試辦引進。這能將組織轉型的混亂降到最低，規避法規與行政風險，同時我們還能將這套嚴謹的試辦成果向政府或行業協會申請「智慧轉型示範企業」的榮譽，達到品牌聲譽與實質經營的雙贏。'
      }
    ]
  }
;

// ==========================================================================
// 2. 狀態管理與變數
// ==========================================================================
// ==========================================================================
// API 設定變數與 LocalStorage 載入
// ==========================================================================
let apiKeys = {
  gemini: localStorage.getItem('rt_key_gemini') || '',
  openai: localStorage.getItem('rt_key_openai') || '',
  anthropic: localStorage.getItem('rt_key_anthropic') || ''
};

let liveDebateHistory = []; // 用於實時模式下保存歷史發言脈絡
const MAX_LIVE_ROUNDS = 6; // 實時模式下總發言輪數 (與模擬一致)

let currentMeetingState = 'idle'; // 'idle', 'running', 'paused', 'finished'
let currentRound = 0;
let debateTimer = null;
let currentMode = 'debate';
let activeTopic = '';
let currentScript = [];
let userDirectiveText = '';

// DOM 元素選取
const elTopic = document.getElementById('meeting-topic');
const elMode = document.getElementById('debate-mode');
const elBtnStart = document.getElementById('btn-start');
const elBtnPause = document.getElementById('btn-pause');
const elBtnReset = document.getElementById('btn-reset');
const elBtnExport = document.getElementById('btn-export-obsidian');
const elTranscript = document.getElementById('transcript-stream');
const elEmptyText = document.getElementById('stream-empty');
const elDirectiveText = document.getElementById('directive-text');
const elBtnSubmitDirective = document.getElementById('btn-submit-directive');
const elGaugeIndicator = document.getElementById('gauge-indicator');
const elGaugeStatus = document.getElementById('gauge-status');
const elSettingsModal = document.getElementById('settings-modal');
const elBtnOpenSettings = document.getElementById('btn-open-settings');
const elCloseSettingsModal = document.getElementById('close-settings-modal');
const elBtnSaveKeys = document.getElementById('btn-save-keys');
const elBtnClearKeys = document.getElementById('btn-clear-keys');
const elKeyGemini = document.getElementById('key-gemini');
const elKeyOpenai = document.getElementById('key-openai');
const elKeyAnthropic = document.getElementById('key-anthropic');

// ==========================================================================
// 3. UI 與狀態渲染輔助函式
// ==========================================================================

// 更新按鈕啟用狀態
function updateButtonStates() {
  if (currentMeetingState === 'idle') {
    elBtnStart.disabled = false;
    elBtnStart.innerHTML = '<i data-lucide="play"></i> 開始會議';
    elBtnPause.disabled = true;
    elBtnReset.disabled = false;
    elTopic.disabled = false;
    elMode.disabled = false;
    elDirectiveText.disabled = true;
    elBtnSubmitDirective.disabled = true;
    elBtnExport.disabled = true;
  } else if (currentMeetingState === 'running') {
    elBtnStart.disabled = true;
    elBtnPause.disabled = false;
    elBtnReset.disabled = false;
    elTopic.disabled = true;
    elMode.disabled = true;
    elDirectiveText.disabled = true;
    elBtnSubmitDirective.disabled = true;
  } else if (currentMeetingState === 'paused') {
    elBtnStart.disabled = false;
    elBtnStart.innerHTML = '<i data-lucide="play"></i> 恢復會議';
    elBtnPause.disabled = true;
    elBtnReset.disabled = false;
    elDirectiveText.disabled = false;
    elBtnSubmitDirective.disabled = false;
  } else if (currentMeetingState === 'finished') {
    elBtnStart.disabled = true;
    elBtnPause.disabled = true;
    elBtnReset.disabled = false;
    elDirectiveText.disabled = true;
    elBtnSubmitDirective.disabled = true;
    elBtnExport.disabled = false;
  }
  lucide.createIcons();
}

// 變更共識指針數值
function updateConsensusGauge(percent, statusText, color = '#ff7b7b') {
  // 將百分比轉為旋轉角度 (範圍 -90deg 到 90deg)
  const angle = (percent / 100) * 180 - 90;
  elGaugeIndicator.style.transform = `rotate(${angle}deg)`;
  elGaugeIndicator.style.background = color;
  elGaugeIndicator.style.boxShadow = `0 0 10px ${color}`;
  elGaugeStatus.textContent = statusText;
  elGaugeStatus.style.color = color;
}

// 清除所有 AI 卡片的 Active 狀態與發言框
function resetAgentCards() {
  document.querySelectorAll('.agent-card').forEach(card => {
    card.classList.remove('active');
  });
}

// 活化指定 AI 專家卡片
function activateAgent(speakerId, content) {
  resetAgentCards();
  const card = document.getElementById(`agent-${speakerId}`);
  const bubble = document.getElementById(`bubble-${speakerId}`);
  
  if (card && bubble) {
    card.classList.add('active');
    bubble.querySelector('.bubble-content').textContent = content;
  }
}

// ==========================================================================
// 4. 會議核心邏輯與計時器
// ==========================================================================

// 開始/啟動會議
function startMeeting() {
  if (currentMeetingState === 'idle') {
    currentMeetingState = 'running';
    activeTopic = elTopic.value.trim() || '未定義議題';
    currentMode = elMode.value;
    currentRound = 0;
    elTranscript.innerHTML = ''; // 清空速記
    liveDebateHistory = []; // 清空實時發言歷史
    
    if (isLiveMode()) {
      // 實時模式發起
      appendSystemMessage(`📢 實時 API 會議連線成功
      議題：【${activeTopic}】
      模式：${getModeName(currentMode)}
      （🔧 現場實務、📂 組織管理、🎓 學術實證 已就位）`);
    } else {
      // 模擬腳本生成
      prepareScript();
      appendSystemMessage(`📢 模擬會議發起
      議題：【${activeTopic}】
      模式：${getModeName(currentMode)}`);
    }
    
    updateButtonStates();
    runNextSpeaker();
  } else if (currentMeetingState === 'paused') {
    currentMeetingState = 'running';
    updateButtonStates();
    runNextSpeaker();
  }
}

// 準備辯論腳本 (支援動態議題模擬)
function prepareScript() {
  const isDefaultTopic = activeTopic.includes('AI 智慧助理') || activeTopic.includes('自動化工作流') || activeTopic.includes('AI') || activeTopic.includes('分流') || activeTopic.includes('工作流');
  
  if (isDefaultTopic) {
    // 載入預設高品質醫學腳本
    currentScript = [...DEBATE_SCRIPTS.aiWorkflowTopic[currentMode]];
  } else {
    // 動態生成客製化通用模擬腳本
    currentScript = [
      {
        speaker: 'clinician',
        content: `針對議題「${activeTopic}」，從第一線實務角度來看，我最擔心的是實際操作難度與人力時間成本。新流程或技術導入，如果沒有充分的實務配套，很容易增加同仁的文書工作，甚至干擾工作現場的直覺！安全與便利必須擺在第一位。`
      },
      {
        speaker: 'administrator',
        content: `實務專家提到的執行成本確實存在，但這正是管理上需要透過精確 SOP 解決的。從組織宏觀發展來看，「${activeTopic}」能顯著優化流程效率，這對我們的營運指標 (KPI) 是絕對的加分項，也有助於提升組織整體的競爭力。管理行政部會全力支持編列預算。`
      },
      {
        speaker: 'academic',
        content: `我建議大家回歸學術與實證精神。目前關於「${activeTopic}」的全國性或國際性學術研究，仍然存在方法學或環境適應上的侷限。直接全面推行風險過高。我建議採取「局部試用計畫」先試辦，並由研究團隊進行成效的科學性追蹤評估，這對實務安全與科學決策是雙贏。`
      }
    ];
  }
}

// 獲取模式繁體中文名稱
function getModeName(mode) {
  switch (mode) {
    case 'debate': return '⚡ 激進衝突辯論模式';
    case 'synergy': return '🤝 和諧共識模式';
    case 'academic': return '🎓 學術與實證審查模式';
    default: return '一般會議模式';
  }
}

// 執行下一位發言人
async function runNextSpeaker() {
  if (isLiveMode()) {
    // === 實時 API 決策對決流程 ===
    if (currentRound >= MAX_LIVE_ROUNDS) {
      finishMeeting();
      return;
    }

    // 輪流分配發言順序：0: Clinician, 1: Administrator, 2: Academic, 3: Clinician...
    const speakerSequence = ['clinician', 'administrator', 'academic'];
    const currentSpeaker = speakerSequence[currentRound % 3];
    const info = getSpeakerInfo(currentSpeaker);

    // 1. 顯示 AI 專家思考中發言氣泡
    activateAgent(currentSpeaker, '思考中...');

    // 2. 構造實時發言歷史脈絡 Prompt
    const historyText = liveDebateHistory.map(h => `[${h.badge} - ${h.role}]: ${h.content}`).join('\n');
    let dynamicPrompt = '';

    if (currentSpeaker === 'clinician') {
      dynamicPrompt = `你現在是 🔧【現場實務專家 - ${info.name}】。你的角色是站在第一線執行同仁的立場，負責拋出或回應實務執行的具體困難、操作細節、痛點、警報疲勞、系統誤報或例外狀況處理等核心實質問題。
當前圓桌會議討論議題：『${activeTopic}』
當前會議討論模式：${getModeName(currentMode)}

${historyText ? `當前已發生的圓桌討論歷史記錄：\n${historyText}\n\n請特別針對上述前人的觀點進行反駁或點出實務執行上的痛點與盲點，直接、犀利且語氣自然地發言。` : '你是圓桌會議的第一位發言者。請針對議題直接拋出第一線人員最擔心的實務障礙與痛點！'}

【字數限制】：請嚴格控制在 120 個中文字以內，不要有任何多餘的引導贅詞（如「Dr. Clinic 回應...」），直接輸出你說的發言內容。`;
    } else if (currentSpeaker === 'administrator') {
      dynamicPrompt = `你現在是 📂【組織管理專家 - ${info.name}】。你的角色是從組織營運效益、流程優化、數位變革、降本增效 (KPI)、標準流程 SOP 制定等經營行政維度進行申論。
當前圓桌會議討論議題：『${activeTopic}』
當前會議討論模式：${getModeName(currentMode)}

當前已發生的圓桌討論歷史記錄：
${historyText}

請特別針對上述前人的觀點做出回應（尤其是實務專家的擔憂與學術專家的數據）。反駁或補充前面的觀點，並強調為何從管理層面來看這項變革對組織生存與競爭力勢在必行，以及管理端如何提供配套措施與預算。

【字數限制】：請嚴格控制在 120 個中文字以內，不要有任何多餘的引導贅詞，直接輸出你說的發言內容。`;
    } else {
      dynamicPrompt = `你現在是 🎓【科學實證學者 - ${info.name}】。你的角色是從學術研究、科學實證、量化指標、實驗設計（如隨機對照試驗 RCT、試用組與對照組）以及文獻數據的維度切入。
當前圓桌會議討論議題：『${activeTopic}』
當g前會議討論模式：${getModeName(currentMode)}

當前已發生的圓桌討論歷史記錄：
${historyText}

請特別針對上述前人的論點做出回應（尤其是實踐中的障礙與管理層面的KPI推行）。保持客觀理性，要求實證數據，指出決策盲點，並提倡以嚴謹的試辦研究與科學成效追蹤評估來規避組織變革風險，創造學術與實用雙贏。

【字數限制】：請嚴格控制在 120 個中文字以內，不要有任何多餘的引導贅詞，直接輸出你說的發言內容。`;
    }

    // 3. 呼叫對應 API 生成文本
    const liveContent = await callLiveAPI(currentSpeaker, dynamicPrompt);

    if (currentMeetingState !== 'running') return; // 防呆：如果在請求過程中被暫停或重置，直接中斷

    // 4. 活化並渲染 API 內容
    activateAgent(currentSpeaker, liveContent);
    updateGaugeBasedOnTurn(currentSpeaker);
    appendTranscriptMessage(currentSpeaker, liveContent);

    // 5. 記錄歷史脈絡
    liveDebateHistory.push({
      role: info.name,
      badge: info.badge,
      content: liveContent
    });

    currentRound++;

    // 6. 設定計時器進入下一輪發言 (由於是 API 動態呼叫，發言間隔調整為 6 秒讓使用者有時間閱讀)
    debateTimer = setTimeout(() => {
      if (currentMeetingState === 'running') {
        runNextSpeaker();
      }
    }, 6200);

  } else {
    // === 預設模擬腳本流程 ===
    if (currentRound >= currentScript.length) {
      finishMeeting();
      return;
    }

    const turn = currentScript[currentRound];
    activateAgent(turn.speaker, turn.content);
    updateGaugeBasedOnTurn(turn.speaker);
    appendTranscriptMessage(turn.speaker, turn.content);

    currentRound++;

    debateTimer = setTimeout(() => {
      if (currentMeetingState === 'running') {
        runNextSpeaker();
      }
    }, 5200);
  }
}

// 暫停會議
function pauseMeeting() {
  if (currentMeetingState === 'running') {
    currentMeetingState = 'paused';
    clearTimeout(debateTimer);
    resetAgentCards();
    updateButtonStates();
    appendSystemMessage(`⏸️ 會議已被暫停。等待主持人下達決策裁示...`);
  }
}

// 重設會議
function resetMeeting() {
  currentMeetingState = 'idle';
  currentRound = 0;
  clearTimeout(debateTimer);
  resetAgentCards();
  elTranscript.innerHTML = '';
  elTranscript.appendChild(elEmptyText);
  elDirectiveText.value = '';
  
  // 重置指針
  updateConsensusGauge(50, '未開始', '#8b949e');
  
  // 重置發言框
  document.getElementById('bubble-clinician').querySelector('.bubble-content').textContent = '正在等待會議發起...';
  document.getElementById('bubble-administrator').querySelector('.bubble-content').textContent = '正在準備評鑑與財務評估...';
  document.getElementById('bubble-academic').querySelector('.bubble-content').textContent = '正在檢索醫學文獻與指引...';
  
  updateButtonStates();
}

// 會議自然結束 (如果沒有中途被裁決)
function finishMeeting() {
  currentMeetingState = 'finished';
  resetAgentCards();
  updateConsensusGauge(60, '已產出初步討論紀錄', '#9d4edd');
  appendSystemMessage(`🏁 會議討論結束
  已產出完整的三方立場速記，您可以點擊右上方「同步」按鈕下載或導出會議紀錄。`);
  updateButtonStates();
}

// ==========================================================================
// 5. 主持人指示介入 (Moderator's Directive)
// ==========================================================================
function submitDirective() {
  const text = elDirectiveText.value.trim();
  if (!text) return;

  userDirectiveText = text;
  clearTimeout(debateTimer);
  
  // 1. 新增主持人指示到訊息流
  appendSystemMessage(`📢 主持人做出裁決指示：
  「${userDirectiveText}」`, 'system');

  // 2. 指針立刻飆升至 100% 共識
  updateConsensusGauge(100, '達致全體共識！', '#00ff87');

  elDirectiveText.value = '';
  currentMeetingState = 'running';
  updateButtonStates();

  // 3. 觸發三位 AI 代理人立刻「低頭妥協並給予終極肯定回覆」
  triggerFinalConsensusRound();
}

// 三方代理人向主持人指示靠攏並收尾
async function triggerFinalConsensusRound() {
  if (isLiveMode()) {
    // === 實時 API 妥協收口流程 ===
    const speakerSequence = ['clinician', 'administrator', 'academic'];
    let localRound = 0;

    async function runFinalLiveStep() {
      if (localRound >= speakerSequence.length) {
        currentMeetingState = 'finished';
        resetAgentCards();
        appendSystemMessage(`🎉 會議在主持人協調下圓滿達成全體共識！
        會議紀要已封存。可點擊右上方進行 Obsidian 匯出。`);
        updateButtonStates();
        return;
      }

      const currentSpeaker = speakerSequence[localRound];
      const info = getSpeakerInfo(currentSpeaker);

      // 顯示思考中
      activateAgent(currentSpeaker, '正在配合指示...');

      const historyText = liveDebateHistory.map(h => `[${h.badge} - ${h.role}]: ${h.content}`).join('\n');
      const finalPrompt = `你現在是【${info.badge} - ${info.name}】。
在剛才關於議題「${activeTopic}」的激烈圓桌會議中，各方本來存在分歧，但現在主持人剛剛下達了最終的最高裁決指示：
『${userDirectiveText}』

作為組織的一員，你雖然剛才持不同意見，但此時必須百分之百尊重並服從主持人的協調裁示。請針對主持人的這個指示，寫下你妥協、同意配合並全力支持的最終發言！
請從你專業角色的角度（${info.badge}）出發，具體說明你如何落實、配合執行這個裁示（例如實務端立刻啟動對接與操作訓練、行政端立刻撥款與制定SOP、學術端立刻設計追蹤指引）。
語氣必須非常配合、積極且專業。

【字數限制】：請嚴格控制在 120 個中文字以內，不要有任何多餘的引導贅詞，直接輸出你說的發言內容。`;

      const liveResponse = await callLiveAPI(currentSpeaker, finalPrompt);

      activateAgent(currentSpeaker, liveResponse);
      appendTranscriptMessage(currentSpeaker, liveResponse);
      
      // 記錄歷史
      liveDebateHistory.push({
        role: info.name,
        badge: info.badge,
        content: liveResponse
      });

      localRound++;
      debateTimer = setTimeout(runFinalLiveStep, 5500);
    }

    await runFinalLiveStep();

  } else {
    // === 預設模擬腳本妥協收口流程 ===
    const finalSpeeches = [
      {
        speaker: 'clinician',
        content: `主持人的裁示非常精準！既然明訂「先以專責人員試辦、不增加常規實務負擔」，那實務端完全同意配合。我們會立刻在試辦部門開始對接，並安排教育訓練！`
      },
      {
        speaker: 'administrator',
        content: `收到主持人裁決。行政管理部會立刻啟動變革預算核撥，專款專用於購置系統與補助試辦期間的同仁津貼。三個月後，我們會準時向主持人提報營運效益報告。`
      },
      {
        speaker: 'academic',
        content: `主持人將「實務試辦」與「學術成效追蹤」結合的策略非常有遠見！我們研究小組會在一週內完成試辦成效分析設計，確保所有的試用數據均能轉化為高品質的學術發表！`
      }
    ];

    let localRound = 0;
    
    function runFinalStep() {
      if (localRound >= finalSpeeches.length) {
        currentMeetingState = 'finished';
        resetAgentCards();
        appendSystemMessage(`🎉 會議在主持人協調下圓滿達成全體共識！
        會議紀要已封存。可點擊右上方進行 Obsidian 匯出。`);
        updateButtonStates();
        return;
      }

      const turn = finalSpeeches[localRound];
      activateAgent(turn.speaker, turn.content);
      appendTranscriptMessage(turn.speaker, turn.content);
      localRound++;

      debateTimer = setTimeout(runFinalStep, 4500);
    }

    runFinalStep();
  }
}

// ==========================================================================
// 6. UI 動態渲染與打字效果
// ==========================================================================

// 指針依據發言者變動 (增添視覺效果)
function updateGaugeBasedOnTurn(speaker) {
  if (currentMode === 'synergy') {
    // 和諧模式：共識持續上升
    const target = 40 + (currentRound * 15);
    updateConsensusGauge(Math.min(target, 85), '凝聚共識中', '#00ff87');
  } else if (currentMode === 'academic') {
    // 學術模式：指針偏向客觀灰色
    updateConsensusGauge(50, '實證審查中', '#bd00ff');
  } else {
    // 辯論模式：指針在左右兩端劇烈擺動
    if (speaker === 'clinician') {
      updateConsensusGauge(20, '實務端嚴重質疑！', '#00f3ff');
    } else if (speaker === 'administrator') {
      updateConsensusGauge(75, '行政強力主推！', '#00ff87');
    } else {
      updateConsensusGauge(45, '學術客觀中立', '#bd00ff');
    }
  }
}

// 系統訊息卡片
function appendSystemMessage(text, type = 'normal') {
  if (document.getElementById('stream-empty')) {
    elTranscript.innerHTML = '';
  }

  const msgDiv = document.createElement('div');
  msgDiv.className = `transcript-msg system`;
  
  const formattedText = text.replace(/\n/g, '<br>');
  msgDiv.innerHTML = `
    <div class="msg-header">
      <i data-lucide="shield-alert" style="width:16px; height:16px; color:#ff7b7b;"></i>
      <span class="msg-name">系統公告 / 主持人裁決</span>
      <span class="msg-badge">System</span>
    </div>
    <div class="msg-body">${formattedText}</div>
  `;
  elTranscript.appendChild(msgDiv);
  elTranscript.scrollTop = elTranscript.scrollHeight;
  lucide.createIcons();
}

// 專家發言卡片
function appendTranscriptMessage(speaker, content) {
  if (document.getElementById('stream-empty')) {
    elTranscript.innerHTML = '';
  }

  const msgDiv = document.createElement('div');
  msgDiv.className = `transcript-msg ${speaker}`;

  const info = getSpeakerInfo(speaker);
  
  msgDiv.innerHTML = `
    <div class="msg-header">
      <img src="${info.avatar}" class="msg-avatar" alt="${info.name}">
      <span class="msg-name">${info.name}</span>
      <span class="msg-badge">${info.badge}</span>
    </div>
    <div class="msg-body"></div>
  `;

  elTranscript.appendChild(msgDiv);
  elTranscript.scrollTop = elTranscript.scrollHeight;

  // 模擬打字姬效果，提升可讀性與互動張力
  let index = 0;
  const bodyDiv = msgDiv.querySelector('.msg-body');
  
  function typeEffect() {
    if (index < content.length) {
      bodyDiv.innerHTML += content.charAt(index);
      index++;
      elTranscript.scrollTop = elTranscript.scrollHeight;
      setTimeout(typeEffect, 20); // 快速打字
    }
  }
  
  typeEffect();
}

// 檢查是否處於實時 API 模式 (具備任何一個金鑰就啟用，缺漏的使用可用金鑰模擬，若皆無則進入模擬模式)
function isLiveMode() {
  return !!apiKeys.gemini || !!apiKeys.openai || !!apiKeys.anthropic;
}

// 實時 API 呼叫輔助函式
async function callLiveAPI(speaker, prompt) {
  // 決定使用哪個 API。如果三者皆有，分工合作；如果有缺，用現有最好的 API 代發
  const hasGemini = !!apiKeys.gemini;
  const hasOpenai = !!apiKeys.openai;
  const hasAnthropic = !!apiKeys.anthropic;

  try {
    if (speaker === 'clinician' && hasGemini) {
      return await callGeminiAPI(prompt);
    } else if (speaker === 'administrator' && hasOpenai) {
      return await callOpenaiAPI(prompt);
    } else if (speaker === 'academic' && hasAnthropic) {
      return await callAnthropicAPI(prompt);
    }

    // 備援路由 (Fallback routing if specific key is missing)
    if (hasOpenai) {
      return await callOpenaiAPI(prompt);
    } else if (hasAnthropic) {
      return await callAnthropicAPI(prompt);
    } else if (hasGemini) {
      return await callGeminiAPI(prompt);
    }

    throw new Error('無可用之金鑰！');
  } catch (err) {
    console.error(`API呼叫出錯 (${speaker}):`, err);
    return `[連線異常] ${err.message || 'API 無回應'}。請檢查您的網路狀態或 API 金鑰額度是否足夠！`;
  }
}

async function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeys.gemini}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 250, temperature: 0.8 }
    })
  });
  if (!response.ok) throw new Error(`Gemini API 異常: ${response.status}`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim().replace(/^Dr\. Clinic:\s*/i, '').replace(/^Expert Practice:\s*/i, '');
}

async function callOpenaiAPI(prompt) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKeys.openai}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // 連線對接 gpt-4o-mini，畫面展示為 GPT-5.4
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.7
    })
  });
  if (!response.ok) throw new Error(`OpenAI API 異常: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content.trim().replace(/^Director Admin:\s*/i, '');
}

async function callAnthropicAPI(prompt) {
  const url = 'https://api.anthropic.com/v1/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKeys.anthropic,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true' // 開啟瀏覽器直連模式
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022', // 連線對接 claude-3-5，畫面展示為 Claude 4.6 Sonnet
      max_tokens: 250,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });
  if (!response.ok) throw new Error(`Anthropic API 異常: ${response.status}`);
  const data = await response.json();
  return data.content[0].text.trim().replace(/^Professor Scholar:\s*/i, '').replace(/^Professor EBM:\s*/i, '');
}

// 實時 API 連線燈號更新
function updateApiIndicator() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  
  if (!dot || !text) return;

  const count = (apiKeys.gemini ? 1 : 0) + (apiKeys.openai ? 1 : 0) + (apiKeys.anthropic ? 1 : 0);
  
  if (count === 3) {
    dot.className = 'status-dot green';
    text.textContent = '實時連線 ⚡ (Gemini / GPT-5.4 / Claude 4.6 就緒)';
    
    // 將卡片上的模型名稱升級為未來概念型號
    document.getElementById('agent-clinician').querySelector('.agent-meta span:first-child').textContent = '模型: Gemini 1.5 Flash';
    document.getElementById('agent-administrator').querySelector('.agent-meta span:first-child').textContent = '模型: GPT-5.4';
    document.getElementById('agent-academic').querySelector('.agent-meta span:first-child').textContent = '模型: Claude 4.6 Sonnet';
  } else if (count > 0) {
    dot.className = 'status-dot gold';
    text.textContent = `部分連線 ⚡ (已連線: ${count}/3，點擊配置)`;
    
    // 依據有連線的項目亮起對應標籤
    document.getElementById('agent-clinician').querySelector('.agent-meta span:first-child').textContent = apiKeys.gemini ? '模型: Gemini 實時' : '模型: 模擬備援';
    document.getElementById('agent-administrator').querySelector('.agent-meta span:first-child').textContent = apiKeys.openai ? '模型: GPT-5.4 實時' : '模型: 模擬備援';
    document.getElementById('agent-academic').querySelector('.agent-meta span:first-child').textContent = apiKeys.anthropic ? '模型: Claude 4.6 實時' : '模型: 模擬備援';
  } else {
    dot.className = 'status-dot purple';
    text.textContent = '模擬模式 🎬 (點擊配置 API)';
    
    // 恢復為預設模擬標籤
    document.getElementById('agent-clinician').querySelector('.agent-meta span:first-child').textContent = '模型: Gemini 3.5 Flash';
    document.getElementById('agent-administrator').querySelector('.agent-meta span:first-child').textContent = '模型: GPT-4o mini';
    document.getElementById('agent-academic').querySelector('.agent-meta span:first-child').textContent = '模型: Claude 3.5 Sonnet';
  }
}

// 獲取專家中英文資訊
function getSpeakerInfo(speaker) {
  switch (speaker) {
    case 'clinician':
      return {
        name: 'Expert Practice',
        badge: '🔧 現場實務',
        avatar: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=80'
      };
    case 'administrator':
      return {
        name: 'Director Admin',
        badge: '📂 組織管理',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=80'
      };
    case 'academic':
      return {
        name: 'Professor Scholar',
        badge: '🎓 學術實證',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80'
      };
  }
}

// ==========================================================================
// 7. 會議紀錄導出 Markdown 檔案 (Obsidian 相容)
// ==========================================================================
function exportToMarkdown() {
  if (currentMeetingState !== 'finished') return;

  const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  const timeStr = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  let markdown = `# 🌌 AI 圓桌決策會議紀錄 — ${activeTopic}\n\n`;
  markdown += `* **會議日期**：${dateStr} ${timeStr}\n`;
  markdown += `* **決策議題**：${activeTopic}\n`;
  markdown += `* **討論模式**：${getModeName(currentMode)}\n`;
  if (userDirectiveText) {
    markdown += `* **主持人裁決**：${userDirectiveText}\n`;
  }
  markdown += `\n---\n\n## 📝 圓桌辯論紀錄\n\n`;

  // 爬取網頁上的對話訊息並轉換為 Markdown
  const messages = elTranscript.querySelectorAll('.transcript-msg');
  messages.forEach(msg => {
    if (msg.classList.contains('system')) {
      const body = msg.querySelector('.msg-body').textContent.trim();
      markdown += `> [!NOTE]\n> **系統/主持人裁決**：${body}\n\n`;
    } else {
      const name = msg.querySelector('.msg-name').textContent.trim();
      const badge = msg.querySelector('.msg-badge').textContent.trim();
      const body = msg.querySelector('.msg-body').textContent.trim();
      markdown += `### ${badge} — ${name}\n\n> ${body}\n\n`;
    }
  });

  markdown += `\n---\n*本檔案由 AI Agent Roundtable 自動封存生成，可無縫匯入您的 Obsidian 第二大腦中。*\n`;

  // 觸發客戶端下載
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AI圓桌決策_${dateStr}_${activeTopic.substring(0, 10)}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 秀出炫酷提示
  alert('🎉 會議紀錄已成功轉存為 Markdown 格式並下載！\n您可以直接將此檔案拖入您的 Obsidian Vault 中。');
}

// ==========================================================================
// 8. 事件綁定
// ==========================================================================
elBtnStart.addEventListener('click', startMeeting);
elBtnPause.addEventListener('click', pauseMeeting);
elBtnReset.addEventListener('click', resetMeeting);
elBtnSubmitDirective.addEventListener('click', submitDirective);
elBtnExport.addEventListener('click', exportToMarkdown);

// 支援按下 Enter 鍵送出主持人指示
elDirectiveText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitDirective();
  }
});

// ==========================================================================
// 9. API 金鑰設定彈窗與 LocalStorage 控制事件
// ==========================================================================

// 開啟設定彈窗
elBtnOpenSettings.addEventListener('click', () => {
  elKeyGemini.value = apiKeys.gemini;
  elKeyOpenai.value = apiKeys.openai;
  elKeyAnthropic.value = apiKeys.anthropic;
  elSettingsModal.classList.remove('hidden');
});

// 關閉設定彈窗
elCloseSettingsModal.addEventListener('click', () => {
  elSettingsModal.classList.add('hidden');
});

elSettingsModal.addEventListener('click', (e) => {
  if (e.target === elSettingsModal) {
    elSettingsModal.classList.add('hidden');
  }
});

// 儲存金鑰並啟用連線
elBtnSaveKeys.addEventListener('click', () => {
  apiKeys.gemini = elKeyGemini.value.trim();
  apiKeys.openai = elKeyOpenai.value.trim();
  apiKeys.anthropic = elKeyAnthropic.value.trim();
  
  localStorage.setItem('rt_key_gemini', apiKeys.gemini);
  localStorage.setItem('rt_key_openai', apiKeys.openai);
  localStorage.setItem('rt_key_anthropic', apiKeys.anthropic);
  
  updateApiIndicator();
  elSettingsModal.classList.add('hidden');
  
  const count = (apiKeys.gemini ? 1 : 0) + (apiKeys.openai ? 1 : 0) + (apiKeys.anthropic ? 1 : 0);
  if (count > 0) {
    alert(`🎉 金鑰已成功儲存於本地快取！\n已為您啟動「實時 API 連線模式 ⚡」！`);
  } else {
    alert('已返回「預設模擬展示模式 🎬」。');
  }
});

// 清除金鑰回到模擬
elBtnClearKeys.addEventListener('click', () => {
  apiKeys.gemini = '';
  apiKeys.openai = '';
  apiKeys.anthropic = '';
  
  localStorage.removeItem('rt_key_gemini');
  localStorage.removeItem('rt_key_openai');
  localStorage.removeItem('rt_key_anthropic');
  
  elKeyGemini.value = '';
  elKeyOpenai.value = '';
  elKeyAnthropic.value = '';
  
  updateApiIndicator();
  elSettingsModal.classList.add('hidden');
  alert('已清除本地金鑰，系統回到「預設模擬展示模式 🎬」。');
});

// 頁面初始化載入時更新連線燈號與標籤
window.addEventListener('DOMContentLoaded', () => {
  updateApiIndicator();
});

