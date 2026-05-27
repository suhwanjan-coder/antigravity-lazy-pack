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
    
    // 生成對應腳本
    prepareScript();
    
    // 新增系統會議發起訊息
    appendSystemMessage(`📢 會議正式發起
    議題：【${activeTopic}】
    模式：${getModeName(currentMode)}`);
    
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
function runNextSpeaker() {
  if (currentRound >= currentScript.length) {
    // 會議自動自然結束
    finishMeeting();
    return;
  }

  const turn = currentScript[currentRound];
  activateAgent(turn.speaker, turn.content);
  
  // 動態更新指針數值 (隨著討論過程分歧或拉近)
  updateGaugeBasedOnTurn(turn.speaker);

  // 將對話紀錄追加至右側側欄 (打字姬模擬)
  appendTranscriptMessage(turn.speaker, turn.content);

  currentRound++;

  // 設定計時器進入下一輪發言 (模擬 5 秒發言時間)
  debateTimer = setTimeout(() => {
    if (currentMeetingState === 'running') {
      runNextSpeaker();
    }
  }, 5200);
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
function triggerFinalConsensusRound() {
  // 建立三位專家基於主持人指示的最終發言
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
      // 終極結束
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
