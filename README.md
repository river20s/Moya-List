# Moya List

궁금증을 기록하고 관리하는 웹 애플리케이션입니다. 해시태그로 카테고리를 분류하고, 해결된 궁금증을 추적할 수 있습니다.

## 주요 기능

- **궁금증 기록**: 떠오르는 궁금증을 빠르게 기록
- **해시태그 분류**: `#` 기호를 사용해 여러 카테고리로 분류
- **해결 상태 관리**: 해결된 궁금증과 미해결 궁금증을 구분
- **상세 정리**: 궁금증에 대한 200자 정리 내용 작성
- **브라우저 익스텐션**: 웹 페이지에서 텍스트를 드래그하여 바로 등록 (개발 중)
- **Firebase 연동**: 클라우드 동기화 및 사용자 인증

## 기술 스택

- **프론트엔드**: React 19.2.0, Vite
- **스타일링**: Tailwind CSS v4
- **백엔드**: Firebase (Authentication, Firestore)
- **아이콘**: Lucide React
- **기타**: OpenAI API (AI 분류 기능 예정)

## 시작하기

### 필수 조건

- Node.js 16 이상
- npm 또는 yarn

### 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd Moya-List
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 Firebase 설정을 추가합니다:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

### 빌드

프로덕션 빌드:
```bash
npm run build
```

빌드 미리보기:
```bash
npm run preview
```

## 브라우저 익스텐션

Moya List는 크롬/엣지 브라우저 익스텐션을 제공합니다.

### 익스텐션 설치 (개발자 모드)

1. `moya-extension` 폴더를 확인합니다
2. Chrome/Edge에서 `chrome://extensions` 또는 `edge://extensions` 접속
3. "개발자 모드" 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. `moya-extension` 폴더 선택

### 사용 방법

1. 웹 페이지에서 텍스트를 드래그하여 선택
2. 마우스 우클릭하여 컨텍스트 메뉴 열기
3. "MoyaList에 등록: [선택한 텍스트]" 클릭
4. 자동으로 Moya List 탭이 열리며 선택한 텍스트가 입력됩니다

## 사용 가이드

### 궁금증 등록

1. 입력창에 궁금증을 작성합니다
2. `#` 기호와 함께 카테고리를 입력합니다 (예: `#과학 #우주`)
3. Enter 키 또는 추가 버튼을 클릭합니다

### 카테고리 필터링

- 사이드바에서 카테고리를 클릭하여 해당 카테고리의 궁금증만 표시
- "전체" 버튼으로 모든 궁금증 보기

### 궁금증 관리

- **해결 표시**: 체크 아이콘 클릭
- **상세 정리**: 궁금증 카드 더블클릭하여 200자 정리 내용 작성
- **삭제**: 휴지통 아이콘 클릭

## 프로젝트 구조

```
Moya-List/
├── src/
│   ├── App.jsx          # 메인 애플리케이션 컴포넌트
│   ├── main.jsx         # 애플리케이션 진입점
│   ├── App.css          # 스타일
│   └── index.css        # 글로벌 스타일
├── moya-extension/      # 브라우저 익스텐션
│   ├── manifest.json    # 익스텐션 설정
│   ├── background.js    # 백그라운드 스크립트
│   └── content.js       # 컨텐츠 스크립트
├── public/              # 정적 파일
├── .env                 # 환경 변수 (git 제외)
├── vite.config.js       # Vite 설정
└── package.json         # 프로젝트 의존성
```

## 개발 로드맵

자세한 개발 계획은 [TODO.md](TODO.md) 파일을 참고하세요.

### 완료된 기능
- Tailwind CSS v4 설정
- Firebase 연동 (Authentication, Firestore)
- 해시태그 기반 카테고리 분류
- 여러 카테고리 지원
- UI 리디자인 및 애니메이션

### 개발 예정
- 카테고리 관리 기능
- 소셜 로그인 (Google, Naver, Kakao)
- GPT-4o를 이용한 자동 카테고리 분류
- 랜덤 궁금증 표시
- 다크모드
- 궁금증 검색 및 통계

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 기여

버그 리포트와 기능 제안은 Issues를 통해 제출해 주세요.
