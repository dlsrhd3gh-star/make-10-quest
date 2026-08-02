import confetti from "canvas-confetti";
import { sounds } from "./audio.js";
import { 
  loginWithGoogle, 
  loginAnonymouslyUser, 
  logoutUser, 
  subscribeAuth, 
  saveRecordToDB, 
  fetchLeaderboards 
} from "./firebase.js";

// Global State
let currentUser = null;
let userGold = parseInt(localStorage.getItem("make10_gold") || "50", 10);
let userClears = parseInt(localStorage.getItem("make10_clears") || "0", 10);
let activeTimer = null;

// UI Elements
const elGold = document.getElementById("user-gold");
const elClears = document.getElementById("user-clears");
const elAuthBtn = document.getElementById("auth-btn");
const elAuthBtnText = document.getElementById("auth-btn-text");
const elAuthModal = document.getElementById("auth-modal");
const elGoogleLogin = document.getElementById("google-login-btn");
const elAnonLogin = document.getElementById("anon-login-btn");
const elCloseModal = document.getElementById("close-modal-btn");
const elBossEntryBtn = document.getElementById("boss-entry-btn");

const viewGames = document.getElementById("view-games");
const viewPlay = document.getElementById("view-play");
const viewHall = document.getElementById("view-hall");

const elGameActiveTitle = document.getElementById("game-active-title");
const elGameTimer = document.getElementById("game-timer");
const elGameScore = document.getElementById("game-score");
const elGameStage = document.getElementById("game-stage");

// ----------------------------------------------------
// App Initialization & State Sync
// ----------------------------------------------------
function updateHeaderUI() {
  elGold.textContent = userGold;
  elClears.textContent = userClears;
  localStorage.setItem("make10_gold", userGold.toString());
  localStorage.setItem("make10_clears", userClears.toString());

  if (currentUser) {
    elAuthBtnText.textContent = currentUser.name;
    elAuthBtn.title = "로그아웃";
  } else {
    elAuthBtnText.textContent = "로그인";
    elAuthBtn.title = "로그인 하러가기";
  }

  // Boss challenge button state
  if (userGold < 50) {
    elBossEntryBtn.disabled = true;
    elBossEntryBtn.innerHTML = `🔒 골드 부족 (50 Gold 필요)`;
  } else {
    elBossEntryBtn.disabled = false;
    elBossEntryBtn.innerHTML = `⚔️ 도전하기 (50 Gold)`;
  }
}

// Navigation Tabs Router
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    sounds.playClick();
    const targetTab = btn.getAttribute("data-tab");
    
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".view-panel").forEach(v => v.classList.remove("active"));

    if (targetTab === "games") {
      viewGames.classList.add("active");
    } else if (targetTab === "boss") {
      viewGames.classList.add("active");
      // Scroll smoothly to boss section
      document.querySelector(".boss-banner").scrollIntoView({ behavior: 'smooth' });
    } else if (targetTab === "hall") {
      viewHall.classList.add("active");
      renderHallOfFame("boss");
    }
  });
});

// Auth Flow Events
subscribeAuth((user) => {
  currentUser = user;
  updateHeaderUI();
});

elAuthBtn.addEventListener("click", () => {
  sounds.playClick();
  if (currentUser) {
    if (confirm("로그아웃 하시겠습니까?")) {
      logoutUser();
    }
  } else {
    elAuthModal.style.display = "flex";
  }
});

elGoogleLogin.addEventListener("click", async () => {
  sounds.playClick();
  const u = await loginWithGoogle();
  if (u) {
    currentUser = u;
    elAuthModal.style.display = "none";
    updateHeaderUI();
  }
});

elAnonLogin.addEventListener("click", async () => {
  sounds.playClick();
  const u = await loginAnonymouslyUser();
  if (u) {
    currentUser = u;
    elAuthModal.style.display = "none";
    updateHeaderUI();
  }
});

elCloseModal.addEventListener("click", () => {
  sounds.playClick();
  elAuthModal.style.display = "none";
});

// Mini Games Launcher
document.querySelectorAll(".play-btn[data-game]").forEach(btn => {
  btn.addEventListener("click", () => {
    sounds.playClick();
    const gameId = btn.getAttribute("data-game");
    startMiniGame(parseInt(gameId, 10));
  });
});

elBossEntryBtn.addEventListener("click", () => {
  if (userGold < 50) return;
  sounds.playClick();
  if (confirm("50 Gold를 사용하여 10의 화염 드래곤전에 도전하시겠습니까?")) {
    userGold -= 50;
    updateHeaderUI();
    startBossBattle();
  }
});

// ----------------------------------------------------
// GAME 1: Bubble Pop 10 (25 Seconds)
// ----------------------------------------------------
function startMiniGame(gameId) {
  document.querySelectorAll(".view-panel").forEach(v => v.classList.remove("active"));
  viewPlay.classList.add("active");

  if (activeTimer) clearInterval(activeTimer);

  if (gameId === 1) runBubblePopGame();
  else if (gameId === 2) runTenFrameGame();
  else if (gameId === 3) runFallingMarbleGame();
}

function runBubblePopGame() {
  elGameActiveTitle.textContent = "🫧 짝꿍 물방울 터뜨리기";
  let score = 0;
  let timeLeft = 25;
  elGameScore.textContent = score;
  elGameTimer.textContent = timeLeft;

  let currentTargetNum = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
  let pairNum = 10 - currentTargetNum;

  function renderStage() {
    elGameStage.innerHTML = `
      <div style="font-size: 1.4rem; font-weight: 800; margin-bottom: 12px;">
        🎯 [ ${currentTargetNum} ] 의 10 짝꿍 숫자를 터뜨리세요!
      </div>
      <div class="bubbles-container" id="bubble-list"></div>
    `;

    const container = document.getElementById("bubble-list");
    // Generate 6 bubbles: 1 correct, 5 random numbers
    const options = [pairNum];
    while (options.length < 6) {
      const r = Math.floor(Math.random() * 9) + 1;
      options.push(r);
    }
    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    options.forEach(num => {
      const b = document.createElement("div");
      b.className = "bubble-item";
      b.textContent = num;
      b.addEventListener("click", () => {
        if (num === pairNum) {
          sounds.playPop();
          score += 10;
          elGameScore.textContent = score;
          // Generate new question
          currentTargetNum = Math.floor(Math.random() * 9) + 1;
          pairNum = 10 - currentTargetNum;
          renderStage();
        } else {
          sounds.playWrong();
        }
      });
      container.appendChild(b);
    });
  }

  renderStage();

  activeTimer = setInterval(() => {
    timeLeft--;
    elGameTimer.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(activeTimer);
      finishMiniGame("물방울 터뜨리기", score);
    }
  }, 1000);
}

// ----------------------------------------------------
// GAME 2: Ten-Frame Box (25 Seconds)
// ----------------------------------------------------
function runTenFrameGame() {
  elGameActiveTitle.textContent = "🧱 10-Frame 상자 채우기";
  let score = 0;
  let timeLeft = 25;
  elGameScore.textContent = score;
  elGameTimer.textContent = timeLeft;

  function renderStage() {
    const filledCount = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
    const neededCount = 10 - filledCount;

    let cellsHtml = "";
    for (let i = 0; i < 10; i++) {
      if (i < filledCount) {
        cellsHtml += `<div class="ten-frame-cell filled"></div>`;
      } else {
        cellsHtml += `<div class="ten-frame-cell"></div>`;
      }
    }

    elGameStage.innerHTML = `
      <div style="font-size: 1.3rem; font-weight: 800; margin-bottom: 8px;">
        상자에 ⭐<sup>${filledCount}개</sup>의 별이 있습니다. 10으로 완성하려면 몇 개가 더 필요할까요?
      </div>
      <div class="ten-frame-grid">${cellsHtml}</div>
      <div class="number-choices" id="choices-box"></div>
    `;

    const choicesBox = document.getElementById("choices-box");
    // Generate 4 choices
    const choices = [neededCount];
    while (choices.length < 4) {
      const r = Math.floor(Math.random() * 9) + 1;
      if (!choices.includes(r)) choices.push(r);
    }
    choices.sort(() => Math.random() - 0.5);

    choices.forEach(val => {
      const btn = document.createElement("button");
      btn.className = "num-choice-btn";
      btn.textContent = val;
      btn.addEventListener("click", () => {
        if (val === neededCount) {
          sounds.playCorrect();
          score += 10;
          elGameScore.textContent = score;
          renderStage();
        } else {
          sounds.playWrong();
        }
      });
      choicesBox.appendChild(btn);
    });
  }

  renderStage();

  activeTimer = setInterval(() => {
    timeLeft--;
    elGameTimer.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(activeTimer);
      finishMiniGame("10-Frame 상자 채우기", score);
    }
  }, 1000);
}

// ----------------------------------------------------
// GAME 3: Falling Marble Match (25 Seconds)
// ----------------------------------------------------
function runFallingMarbleGame() {
  elGameActiveTitle.textContent = "🔮 10 구슬 짝맞추기";
  let score = 0;
  let timeLeft = 25;
  elGameScore.textContent = score;
  elGameTimer.textContent = timeLeft;

  let selectedMarble = null;

  elGameStage.innerHTML = `
    <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 12px; color: var(--text-muted);">
      두 구슬을 짝지어 합이 <strong>10</strong>이 되게 하세요!
    </div>
    <div class="marble-board" id="marble-board"></div>
  `;

  const board = document.getElementById("marble-board");
  const marbles = [];

  // 안전한 구슬 충돌 방지 렌더링 위치 탐색
  function findSafePosition() {
    const boardW = Math.max(board.clientWidth || 500, 340);
    const boardH = Math.max(board.clientHeight || 260, 220);
    const margin = 12;
    const marbleSize = 54;

    const maxX = Math.max(10, boardW - marbleSize - margin);
    const maxY = Math.max(10, boardH - marbleSize - margin);

    for (let attempt = 0; attempt < 60; attempt++) {
      const x = Math.floor(Math.random() * maxX) + margin;
      const y = Math.floor(Math.random() * maxY) + margin;

      // 기존 구슬들과의 최소 거리(64px) 검사
      let isOverlap = false;
      for (const existing of marbles) {
        const ex = parseFloat(existing.style.left);
        const ey = parseFloat(existing.style.top);
        const dist = Math.hypot(x - ex, y - ey);
        if (dist < 64) {
          isOverlap = true;
          break;
        }
      }

      if (!isOverlap) {
        return { x, y };
      }
    }

    return {
      x: Math.floor(Math.random() * maxX) + margin,
      y: Math.floor(Math.random() * maxY) + margin
    };
  }

  // 10이 되는 짝(Pair) 단위로 구슬을 생성해주는 함수
  function createMarblePair() {
    if (marbles.length >= 8) return;
    const val1 = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
    const val2 = 10 - val1; // 짝꿍 수

    [val1, val2].forEach(val => {
      const pos = findSafePosition();
      const m = document.createElement("div");
      m.className = "marble";
      m.textContent = val;
      m.style.left = `${pos.x}px`;
      m.style.top = `${pos.y}px`;
      m.dataset.value = val;

      m.addEventListener("click", () => {
        sounds.playClick();
        if (!selectedMarble) {
          selectedMarble = m;
          m.classList.add("selected");
        } else if (selectedMarble === m) {
          selectedMarble.classList.remove("selected");
          selectedMarble = null;
        } else {
          const v1 = parseInt(selectedMarble.dataset.value, 10);
          const v2 = parseInt(m.dataset.value, 10);

          if (v1 + v2 === 10) {
            sounds.playCorrect();
            score += 15;
            elGameScore.textContent = score;

            // 터뜨리기 효과
            selectedMarble.style.transform = "scale(0)";
            m.style.transform = "scale(0)";
            
            const m1 = selectedMarble;
            const m2 = m;
            selectedMarble = null;

            setTimeout(() => {
              m1.remove();
              m2.remove();
              const idx1 = marbles.indexOf(m1);
              if (idx1 > -1) marbles.splice(idx1, 1);
              const idx2 = marbles.indexOf(m2);
              if (idx2 > -1) marbles.splice(idx2, 1);

              // 짝 제거 후 새로 1쌍(2개) 추가 생성!
              createMarblePair();
            }, 150);
          } else {
            sounds.playWrong();
            selectedMarble.classList.remove("selected");
            selectedMarble = null;
          }
        }
      });

      board.appendChild(m);
      marbles.push(m);
    });
  }

  // DOM 렌더링 딜레이 대응 (requestAnimationFrame으로 3쌍 6개 구슬 배치)
  requestAnimationFrame(() => {
    createMarblePair();
    createMarblePair();
    createMarblePair();
  });

  activeTimer = setInterval(() => {
    timeLeft--;
    elGameTimer.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(activeTimer);
      finishMiniGame("구슬 짝맞추기", score);
    }
  }, 1000);
}

// Mini Game End Handler
function finishMiniGame(title, score) {
  sounds.playVictory();
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

  const earnedGold = Math.floor(score / 2) + 15; // Score-based Gold reward
  userGold += earnedGold;
  userClears += 1;
  updateHeaderUI();

  // Save progress
  saveRecordToDB({
    name: currentUser ? currentUser.name : "익명 탐험가",
    gold: userGold,
    miniGameClears: userClears,
    bossScore: 0,
    bossTime: 999
  });

  elGameStage.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 3rem; margin-bottom: 12px;">🎉</div>
      <h2 style="font-size: 1.8rem; font-weight: 900; color: #f59e0b; margin-bottom: 10px;">
        미니게임 완료!
      </h2>
      <p style="font-size: 1.2rem; margin-bottom: 16px;">
        획득 점수: <strong>${score}점</strong>
      </p>
      <div style="background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; padding: 12px 24px; border-radius: 30px; font-size: 1.2rem; font-weight: 800; color: #fbbf24; margin-bottom: 24px; display: inline-block;">
        🪙 +${earnedGold} Gold 획득!
      </div>
      <div>
        <button id="finish-back-btn" class="play-btn" style="max-width: 200px;">
          메인으로 돌아가기
        </button>
      </div>
    </div>
  `;

  document.getElementById("finish-back-btn").addEventListener("click", () => {
    sounds.playClick();
    document.querySelectorAll(".view-panel").forEach(v => v.classList.remove("active"));
    viewGames.classList.add("active");
  });
}

// ----------------------------------------------------
// DRAGON BATTLE: 🐉 10의 화염 드래곤 (10 Questions Challenge)
// ----------------------------------------------------
function startBossBattle() {
  document.querySelectorAll(".view-panel").forEach(v => v.classList.remove("active"));
  viewPlay.classList.add("active");

  if (activeTimer) clearInterval(activeTimer);

  elGameActiveTitle.textContent = "🐉 10의 화염 드래곤 던전";
  let currentQuestionIdx = 0;
  let correctAnswers = 0;
  const totalQuestions = 10;
  const startTime = performance.now();

  elGameScore.textContent = `0 / ${totalQuestions}`;
  elGameTimer.textContent = "0.0s";

  // Generate 10 random math problems that equal 10
  const questions = [];
  for (let i = 0; i < totalQuestions; i++) {
    const type = i % 3;
    if (type === 0) {
      // A + ? = 10
      const a = Math.floor(Math.random() * 9) + 1;
      questions.push({
        text: `${a} + ? = 10`,
        answer: 10 - a
      });
    } else if (type === 1) {
      // 10 - B = ?
      const b = Math.floor(Math.random() * 9) + 1;
      questions.push({
        text: `10 - ${b} = ?`,
        answer: 10 - b
      });
    } else {
      // A + ? + B = 10
      const a = Math.floor(Math.random() * 4) + 1;
      const b = Math.floor(Math.random() * 4) + 1;
      questions.push({
        text: `${a} + ? + ${b} = 10`,
        answer: 10 - (a + b)
      });
    }
  }

  // Live Elapsed Time Counter
  const timeInterval = setInterval(() => {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    elGameTimer.textContent = `${elapsed}s`;
  }, 100);

  function renderBossQuestion() {
    if (currentQuestionIdx >= totalQuestions) {
      clearInterval(timeInterval);
      const totalTimeSec = parseFloat(((performance.now() - startTime) / 1000).toFixed(2));
      finishBossBattle(correctAnswers, totalTimeSec);
      return;
    }

    const q = questions[currentQuestionIdx];
    elGameScore.textContent = `${correctAnswers} / ${totalQuestions}`;

    elGameStage.innerHTML = `
      <div class="boss-quiz-box">
        <div class="boss-avatar">🐉</div>
        <div style="font-size: 1.1rem; color: var(--text-muted);">
          드래곤의 질문 [ ${currentQuestionIdx + 1} / ${totalQuestions} ]
        </div>
        <div class="boss-question">${q.text}</div>
        <div class="number-choices" id="boss-choices"></div>
      </div>
    `;

    const choicesBox = document.getElementById("boss-choices");
    const options = [q.answer];
    while (options.length < 4) {
      const r = Math.floor(Math.random() * 10);
      if (!options.includes(r)) options.push(r);
    }
    options.sort(() => Math.random() - 0.5);

    options.forEach(val => {
      const btn = document.createElement("button");
      btn.className = "num-choice-btn";
      btn.textContent = val;
      btn.addEventListener("click", () => {
        if (val === q.answer) {
          sounds.playBossHit();
          correctAnswers++;
        } else {
          sounds.playWrong();
        }
        currentQuestionIdx++;
        renderBossQuestion();
      });
      choicesBox.appendChild(btn);
    });
  }

  renderBossQuestion();
}

// Boss Battle Finish Handler
async function finishBossBattle(score, timeSec) {
  sounds.playVictory();
  confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });

  const record = {
    name: currentUser ? currentUser.name : "익명 탐험가",
    bossScore: score,
    bossTime: timeSec,
    gold: userGold,
    miniGameClears: userClears
  };

  // Save to Firebase & Local Storage
  await saveRecordToDB(record);

  elGameStage.innerHTML = `
    <div style="text-align: center; padding: 24px; max-width: 500px;">
      <div style="font-size: 3.5rem; margin-bottom: 12px;">🏆</div>
      <h2 style="font-size: 2rem; font-weight: 900; color: #f43f5e; margin-bottom: 8px;">
        드래곤전 도전 완료!
      </h2>
      <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 20px;">
        명예의 전당에 당신의 위대한 기록이 등록되었습니다!
      </p>

      <div style="background: rgba(15, 23, 42, 0.8); border: 2px solid var(--accent-pink); padding: 20px; border-radius: 16px; margin-bottom: 24px;">
        <div style="font-size: 1.3rem; margin-bottom: 8px;">
          🎯 맞춘 문제 수: <strong style="color: #fbbf24;">${score} / 10 문제</strong>
        </div>
        <div style="font-size: 1.3rem; margin-bottom: 8px;">
          ⏱️ 클리어 시간: <strong style="color: #38bdf8;">${timeSec}초</strong>
        </div>
        <div style="font-size: 0.95rem; color: var(--text-muted);">
          (명예의 전당은 '맞춘 문제 수' 우선, 그 다음 '빠른 클리어 시간' 순으로 정렬됩니다)
        </div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="view-hall-btn" class="play-btn" style="background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);">
          🏆 명예의 전당 확인하기
        </button>
      </div>
    </div>
  `;

  document.getElementById("view-hall-btn").addEventListener("click", () => {
    sounds.playClick();
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('.tab-btn[data-tab="hall"]').classList.add("active");

    document.querySelectorAll(".view-panel").forEach(v => v.classList.remove("active"));
    viewHall.classList.add("active");

    renderHallOfFame("boss");
  });
}

// ----------------------------------------------------
// HALL OF FAME: Leaderboard Renderer
// ----------------------------------------------------
let currentSubTab = "boss";

document.querySelectorAll(".sub-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    sounds.playClick();
    const tab = btn.getAttribute("data-subtab");
    document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSubTab = tab;
    renderHallOfFame(tab);
  });
});

async function renderHallOfFame(type = "boss") {
  const container = document.getElementById("hall-content");
  container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">📊 랭킹 불러오는 중...</div>`;

  const { bossRankings, goldRankings, miniGameRankings } = await fetchLeaderboards();

  let list = [];
  if (type === "boss") list = bossRankings;
  else if (type === "gold") list = goldRankings;
  else if (type === "clears") list = miniGameRankings;

  if (!list || list.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 40px;">아직 기록이 없습니다. 먼저 도전해 보세요!</div>`;
    return;
  }

  let tableHtml = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>순위</th>
          <th>용사 닉네임</th>
          <th>드래곤 맞춘 문제수</th>
          <th>드래곤 클리어 시간</th>
          <th>모은 골드</th>
          <th>미니게임 클리어</th>
        </tr>
      </thead>
      <tbody>
  `;

  list.forEach((item, idx) => {
    const rank = idx + 1;
    let rankBadge = `${rank}`;
    if (rank === 1) rankBadge = `<span class="rank-badge rank-1">🥇</span>`;
    else if (rank === 2) rankBadge = `<span class="rank-badge rank-2">🥈</span>`;
    else if (rank === 3) rankBadge = `<span class="rank-badge rank-3">🥉</span>`;
    else rankBadge = `<span class="rank-badge">${rank}</span>`;

    const bossScoreText = (item.bossScore !== undefined && item.bossScore > 0) ? `${item.bossScore} / 10` : '-';
    const bossTimeText = (item.bossTime && item.bossTime < 900) ? `${item.bossTime}초` : '-';

    tableHtml += `
      <tr>
        <td>${rankBadge}</td>
        <td>${item.name || '익명 탐험가'}</td>
        <td style="color: #fbbf24; font-weight: 800;">${bossScoreText}</td>
        <td style="color: #38bdf8;">${bossTimeText}</td>
        <td>🪙 ${item.gold || 0}</td>
        <td>🎯 ${item.miniGameClears || 0}회</td>
      </tr>
    `;
  });

  tableHtml += `</tbody></table>`;
  container.innerHTML = tableHtml;
}

// Initial Run
updateHeaderUI();
