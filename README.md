# 🧙‍♂️ 숫자 마법학교: 10의 비밀 원정대 (Make 10 Quest)

초등학교 수학 교육과정 핵심인 **10 만들기(10의 보수 연산)**를 재미있게 학습하는 게이미피케이션(Gamification) 교수학습 프로젝트입니다.

---

## ✨ 핵심 기능

1. **3가지 미니게임 (각 25초 제한시간)**:
   - 🫧 **물방울 짝꿍 터뜨리기**: 제시된 숫자와 합쳐서 10이 되는 짝꿍 숫자의 물방울을 빠른 순발력으로 터뜨립니다.
   - 🧱 **10-Frame 상자 채우기**: 10칸 상자에서 빈 칸의 수(보수)를 직관적으로 파악하고 정답 블록을 맞춥니다.
   - 🔮 **10 구슬 짝맞추기**: 떠다니는 구슬 중 합이 10이 되는 2개의 구슬을 선택해 짝을 만듭니다.
   - *미니게임 클리어 시 점수에 따른 Gold 적립 & 클리어 횟수 증가.*

2. **🐉 10의 화염 드래곤 던전**:
   - 모은 Gold(50 Gold 소모)로 드래곤에게 도전합니다.
   - 10을 만드는 연산 문제 **10문항**이 출제되며, 맞춘 문제 수와 정밀한 클리어 소요 시간(초)이 측정됩니다.

3. **🏆 명예의 전당 (Leaderboard Top 10)**:
   - **드래곤전 랭킹**: 맞춘 문제 수가 많은 사용자를 1순위로, 동일할 경우 클리어 소요 시간이 짧은 사용자를 2순위로 정렬합니다.
   - **골드 부자 Top 10**: 모은 골드가 가장 많은 사용자 10명 표시.
   - **미니게임 마스터 Top 10**: 미니게임을 가장 많이 클리어한 사용자 10명 표시.
   - 표기 정보: 순위, 닉네임, **드래곤 맞춘 문제 수**, **드래곤 클리어 소요 시간**, **모은 총 골드**, **미니게임 클리어 횟수**.

4. **🔑 Firebase Auth & Database 연동**:
   - Google 로그인 및 익명 닉네임 로그인 지원.
   - Firestore 데이터베이스에 랭킹이 온라인으로 자동 저장 및 실시간 동기화 (Firebase Key 미입력 시 오프라인/LocalStorage 모드로 완전 동작).

---

## 🛠️ 개발 및 빌드 실행 방법

### 1. 의존성 설치 및 로컬 서버 실행
```bash
# 패키지 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 🚀 GitHub 업로드, Firebase 설정 & Vercel 배포 가이드

### 1. GitHub 업로드 방법
```bash
git init
git add .
git commit -m "Initial commit: Make 10 Quest app"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/make-10-quest.git
git push -u origin main
```

### 2. Firebase 설정 가이드
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성.
2. **Authentication** 설정:
   - [Sign-in method] 탭에서 **Google** 및 **익명(Anonymous)** 로그인 활성화.
3. **Firestore Database** 생성:
   - `leaderboard` 컬렉션 생성 (규칙에서 읽기/쓰기 허용).
4. 프로젝트 `.env.local` 파일 생성 후 환경변수 등록:
```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

### 3. Vercel 배포 방법
1. [Vercel](https://vercel.com/) 접속 후 [Add New Project] 선택.
2. 해당 GitHub 레포지토리(`make-10-quest`) 임포트.
3. Framework Preset: **Vite** 선택.
4. Environment Variables 항목에 위 Firebase `.env` 변수들을 추가 후 **Deploy** 버튼 클릭.
5. 배포 완료 후 제공되는 Vercel 도메인 URL로 접속!
