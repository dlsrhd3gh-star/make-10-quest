import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";

// 기본 Firebase 설정 (환경 변수 VITE_FIREBASE_API_KEY 가 있으면 적용)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForMake10QuestAppDummyKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "make10quest.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "make10quest",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "make10quest.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo123456"
};

let app, auth, db;
let isFirebaseActive = false;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseActive = true;
    console.log("🔥 Firebase backend successfully initialized!");
  } else {
    console.log("ℹ️ Firebase API Key not provided. Running in Hybrid/LocalStorage mode.");
  }
} catch (err) {
  console.warn("Firebase initialization skipped/failed. Using local storage fallback.", err);
}

// ----------------------------------------------------
// Mock Initial Leaderboard Data (명예의 전당 초기 봇 라이벌)
// ----------------------------------------------------
const DEFAULT_LEADERBOARD = [
  { id: 'bot1', name: '수학의신_민준', bossScore: 10, bossTime: 12.45, gold: 450, miniGameClears: 18, date: '2026-08-01' },
  { id: 'bot2', name: '10마스터_지우', bossScore: 10, bossTime: 14.80, gold: 380, miniGameClears: 15, date: '2026-08-01' },
  { id: 'bot3', name: '연산왕_서연', bossScore: 10, bossTime: 16.20, gold: 520, miniGameClears: 22, date: '2026-08-02' },
  { id: 'bot4', name: '스피드킹_도윤', bossScore: 9, bossTime: 11.10, gold: 310, miniGameClears: 12, date: '2026-07-30' },
  { id: 'bot5', name: '짝꿍수용사_하은', bossScore: 9, bossTime: 13.90, gold: 290, miniGameClears: 11, date: '2026-08-01' },
  { id: 'bot6', name: '초등수학짱_예준', bossScore: 8, bossTime: 15.50, gold: 240, miniGameClears: 9, date: '2026-07-28' },
  { id: 'bot7', name: '골드부자_수아', bossScore: 7, bossTime: 18.20, gold: 600, miniGameClears: 25, date: '2026-08-02' },
  { id: 'bot8', name: '보스클리어러', bossScore: 10, bossTime: 19.80, gold: 180, miniGameClears: 7, date: '2026-08-02' },
  { id: 'bot9', name: '10만들기천재', bossScore: 8, bossTime: 12.80, gold: 210, miniGameClears: 8, date: '2026-07-29' },
  { id: 'bot10', name: '귀요미탐험가', bossScore: 6, bossTime: 22.10, gold: 150, miniGameClears: 5, date: '2026-08-01' }
];

// LocalStorage 리더보드 초기화
function getLocalLeaderboard() {
  const data = localStorage.getItem('make10_leaderboard');
  if (!data) {
    localStorage.setItem('make10_leaderboard', JSON.stringify(DEFAULT_LEADERBOARD));
    return DEFAULT_LEADERBOARD;
  }
  return JSON.parse(data);
}

function saveLocalRecord(record) {
  const records = getLocalLeaderboard();
  
  // 동일 사용자 기존 기록이 있으면 업데이트 또는 추가
  const existingIdx = records.findIndex(r => r.name === record.name);
  if (existingIdx >= 0) {
    const existing = records[existingIdx];
    // 보스점수가 더 크거나, 같으면 시간이 더 짧을 때 보스기록 업데이트
    let isBetterBoss = false;
    if (record.bossScore > existing.bossScore) isBetterBoss = true;
    else if (record.bossScore === existing.bossScore && record.bossTime < existing.bossTime) isBetterBoss = true;

    records[existingIdx] = {
      ...existing,
      gold: Math.max(existing.gold, record.gold),
      miniGameClears: Math.max(existing.miniGameClears, record.miniGameClears),
      bossScore: isBetterBoss ? record.bossScore : existing.bossScore,
      bossTime: isBetterBoss ? record.bossTime : existing.bossTime,
      date: new Date().toISOString().split('T')[0]
    };
  } else {
    records.push({
      id: 'usr_' + Date.now(),
      ...record,
      date: new Date().toISOString().split('T')[0]
    });
  }

  localStorage.setItem('make10_leaderboard', JSON.stringify(records));
}

// ----------------------------------------------------
// Authentication Handlers
// ----------------------------------------------------
export async function loginWithGoogle() {
  if (isFirebaseActive && auth) {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return {
        uid: result.user.uid,
        name: result.user.displayName || "구글 용사",
        photo: result.user.photoURL,
        isAnon: false
      };
    } catch (err) {
      console.error("Google sign in error:", err);
      alert("Google 로그인 실패: " + err.message);
    }
  }
  
  // Local fallback
  const guestName = prompt("구글 로그인 시뮬레이션! 명예의 전당에 등록할 닉네임을 입력하세요:", "구글용사_" + Math.floor(Math.random()*100));
  if (!guestName) return null;
  const mockUser = {
    uid: "google_mock_" + Date.now(),
    name: guestName,
    photo: null,
    isAnon: false
  };
  localStorage.setItem("make10_user", JSON.stringify(mockUser));
  return mockUser;
}

export async function loginAnonymouslyUser() {
  if (isFirebaseActive && auth) {
    try {
      const result = await signInAnonymously(auth);
      return {
        uid: result.user.uid,
        name: "익명 탐험가#" + result.user.uid.substring(0, 4),
        photo: null,
        isAnon: true
      };
    } catch (err) {
      console.error("Anonymous sign in error:", err);
    }
  }

  // Local fallback
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const mockUser = {
    uid: "anon_" + Date.now(),
    name: `익명 탐험가#${randomId}`,
    photo: null,
    isAnon: true
  };
  localStorage.setItem("make10_user", JSON.stringify(mockUser));
  return mockUser;
}

export async function logoutUser() {
  if (isFirebaseActive && auth) {
    await signOut(auth);
  }
  localStorage.removeItem("make10_user");
}

export function subscribeAuth(callback) {
  if (isFirebaseActive && auth) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          name: user.displayName || (user.isAnonymous ? "익명 탐험가#" + user.uid.substring(0, 4) : "용사님"),
          photo: user.photoURL,
          isAnon: user.isAnonymous
        });
      } else {
        callback(null);
      }
    });
  } else {
    const saved = localStorage.getItem("make10_user");
    callback(saved ? JSON.parse(saved) : null);
    return () => {};
  }
}

// ----------------------------------------------------
// Firestore / Local Storage Leaderboard sync
// ----------------------------------------------------
export async function saveRecordToDB(record) {
  // Local storage에 무조건 우선 기록
  saveLocalRecord(record);

  if (isFirebaseActive && db) {
    try {
      const userUid = (auth && auth.currentUser) ? auth.currentUser.uid : (record.uid || "anonymous");
      await addDoc(collection(db, "leaderboard"), {
        ...record,
        uid: userUid,
        timestamp: serverTimestamp()
      });
      console.log("Record saved to Firestore with UID:", userUid);
    } catch (e) {
      console.error("Error writing document to Firestore: ", e);
    }
  }
}

export async function fetchLeaderboards() {
  let allRecords = getLocalLeaderboard();

  if (isFirebaseActive && db) {
    try {
      const q = query(collection(db, "leaderboard"), limit(50));
      const querySnapshot = await getDocs(q);
      const remoteRecords = [];
      querySnapshot.forEach((doc) => {
        remoteRecords.push({ id: doc.id, ...doc.data() });
      });
      if (remoteRecords.length > 0) {
        allRecords = [...allRecords, ...remoteRecords];
      }
    } catch (e) {
      console.warn("Could not fetch remote Firestore records, using local dataset.", e);
    }
  }

  // 중복 사용자 처리 (동일 닉네임 시 최고 기록 유지)
  const userMap = new Map();
  allRecords.forEach(r => {
    if (!userMap.has(r.name)) {
      userMap.set(r.name, r);
    } else {
      const existing = userMap.get(r.name);
      let isBetterBoss = false;
      if ((r.bossScore || 0) > (existing.bossScore || 0)) isBetterBoss = true;
      else if ((r.bossScore || 0) === (existing.bossScore || 0) && (r.bossTime || 999) < (existing.bossTime || 999)) isBetterBoss = true;

      userMap.set(r.name, {
        ...existing,
        gold: Math.max(existing.gold || 0, r.gold || 0),
        miniGameClears: Math.max(existing.miniGameClears || 0, r.miniGameClears || 0),
        bossScore: isBetterBoss ? r.bossScore : existing.bossScore,
        bossTime: isBetterBoss ? r.bossTime : existing.bossTime
      });
    }
  });

  const merged = Array.from(userMap.values());

  // 1. 보스전 랭킹: (1) 맞춘 문제 수 내림차순 -> (2) 클리어 시간 오름차순
  const bossRankings = [...merged]
    .filter(r => (r.bossScore !== undefined && r.bossScore > 0))
    .sort((a, b) => {
      if (b.bossScore !== a.bossScore) {
        return b.bossScore - a.bossScore; // 더 많이 맞춘 사람 우선
      }
      return (a.bossTime || 999) - (b.bossTime || 999); // 더 빠른 시간 우선
    })
    .slice(0, 10);

  // 2. 골드 부자 랭킹 (Top 10)
  const goldRankings = [...merged]
    .sort((a, b) => (b.gold || 0) - (a.gold || 0))
    .slice(0, 10);

  // 3. 미니게임 다빈도 클리어 랭킹 (Top 10)
  const miniGameRankings = [...merged]
    .sort((a, b) => (b.miniGameClears || 0) - (a.miniGameClears || 0))
    .slice(0, 10);

  return {
    bossRankings,
    goldRankings,
    miniGameRankings
  };
}
