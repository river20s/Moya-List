# CLAUDE.md - MoyaList 프로젝트 가이드

> **GitHub**: https://github.com/river20s/moya-list

## 프로젝트 개요

**MoyaList**는 "이게 뭐야?" 하는 궁금증을 빠르게 포착하고 해결 여부를 추적하는 학습 서비스다.

### 핵심 가치
- 빠른 등록: 떠오르는 궁금증을 즉시 캡처
- 추적 관리: 해결 여부, 태그별 분류
- 학습 인사이트: 히트맵, 통계로 학습 패턴 파악

## 개발 철학

### 학습 중심 개발
이 프로젝트는 **서비스 완성**과 함께 **학습**을 목표로 합니다.

**Claude와의 협업 방식:**
- ❌ Claude가 코드를 전부 작성하고 완성된 코드만 제시
- ✅ Claude가 개념을 설명하고, 코드 작성 방법을 가르친 후, 개발자가 직접 작성
- ✅ 각 코드의 의미와 동작 원리를 이해하며 진행
- ✅ "왜 이렇게 작성하는지", "어떤 원리로 동작하는지" 학습 우선

**원칙:**
1. 블랙박스 코드 지양 - 모든 코드의 의미를 이해하고 작성
2. 단계별 학습 - 한 번에 하나씩, 천천히 이해하며 진행
3. 질문 장려 - 이해되지 않는 부분은 즉시 질문하고 명확히 하기
4. 직접 실습 - 설명을 듣고 직접 코드를 작성해보며 체득

## 기술 스택

### Backend
- **Language**: Java 17
- **Framework**: Spring Boot 3.5.9
- **ORM**: Spring Data JPA
- **Database**: MySQL 8.0
- **Auth**: Spring Security + OAuth2 (Google) + JWT
- **Build**: Gradle (Groovy)

### Infrastructure
- **Container**: Docker Compose
- **Cloud**: AWS (예정)

### Frontend
- React + TypeScript + Vite (포트 5173 고정)
- Tailwind CSS
- React Router, Axios

### Extension (예정)
- Chrome Extension

## 프로젝트 구조

```
moya-list/
├── backend/
│   └── src/main/java/com/moyalist/backend/
│       ├── auth/           # JWT, OAuth2 인증 관련
│       ├── controller/     # REST API 엔드포인트
│       ├── service/        # 비즈니스 로직
│       ├── repository/     # JPA Repository
│       ├── entity/         # JPA Entity
│       ├── dto/            # Request/Response DTO
│       ├── specification/  # JPA Specification (동적 검색)
│       └── exception/      # 예외 처리
├── frontend/
│   └── src/
│       ├── api/            # Axios API 클라이언트
│       ├── components/     # 공통 UI 컴포넌트
│       ├── context/        # React Context (AuthContext)
│       ├── pages/          # 페이지 컴포넌트
│       └── types/          # TypeScript 타입 정의
├── extension/              # Chrome Extension (예정)
├── docs/                   # 설계 문서
├── init/                   # DB 초기화 스크립트
└── docker-compose.yml
```

## 데이터베이스 스키마

### 테이블 관계
```
users (1) ────< (N) questions
users (1) ────< (N) tags
questions (1) ────< (N) attachments
questions (N) ────< (N) tags  [through question_tags]
```

### 주요 테이블

#### users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| email | VARCHAR(255) | UNIQUE, 로그인 ID |
| name | VARCHAR(50) | 닉네임 |
| provider | VARCHAR(20) | 소셜 로그인 (google, kakao) |
| provider_id | VARCHAR(255) | 소셜 로그인 ID |

#### questions
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users |
| title | VARCHAR(500) | 궁금증 제목 |
| description | TEXT | 상세 설명 |
| source_url | VARCHAR(1000) | 출처 URL |
| is_resolved | BOOLEAN | 해결 여부 (default: false) |

#### tags
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users |
| name | VARCHAR(50) | 태그명 (user별 unique) |
| color | VARCHAR(20) | HEX 색상 (default: #6B7280) |

#### question_tags
- question_id, tag_id 복합 PK
- 다대다 관계 연결 테이블

#### attachments
- question_id FK로 연결
- S3 URL 저장

#### guest_questions
- 비로그인 사용자용 (session_id 기반)
- 회원가입 시 questions로 이관

## API 설계

### 기본 경로: `/api`

### Question API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /questions | 목록 조회 (검색/필터/페이지네이션) |
| GET | /questions/{id} | 단건 조회 |
| POST | /questions | 등록 |
| PUT | /questions/{id} | 수정 |
| PATCH | /questions/{id}/resolve | 해결 상태 토글 |
| DELETE | /questions/{id} | 삭제 |

### 검색/필터 파라미터 (GET /questions)
```
?keyword=spring      # 제목/설명 검색
&tagId=1             # 태그 필터
&isResolved=false    # 해결 상태 필터
&page=0&size=10      # 페이지네이션
```

### Tag API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /tags | 사용자의 태그 목록 |
| POST | /tags | 태그 생성 |
| PUT | /tags/{id} | 태그 수정 |
| DELETE | /tags/{id} | 태그 삭제 |

### User API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /users/{id} | 사용자 조회 |
| PUT | /users/{id} | 사용자 정보 수정 |
| DELETE | /users/{id} | 회원 탈퇴 |

## 개발 워크플로우

### GitHub 작업 흐름
```bash
# 1. 이슈 확인 후 브랜치 생성
git checkout main
git pull origin main
git checkout -b feature/28-jwt-user-extraction

# 2. 작업 후 커밋
git add .
git commit -m "feat: userId를 JWT 토큰에서 추출 (#28)"

# 3. 푸시 및 PR 생성
git push origin feature/28-jwt-user-extraction
gh pr create --title "..." --body "..."

# 4. 머지 후 브랜치 삭제 (gh pr merge --squash --delete-branch)
git checkout main && git pull origin main
```

### 이슈 기반 개발
1. GitHub Issues에서 작업할 이슈 선택
2. 이슈 번호로 브랜치 생성 (`feature/이슈번호-설명`)
3. 커밋 메시지에 이슈 번호 포함 (`#10`)
4. PR 생성 시 `Closes #10`으로 자동 이슈 종료

## 개발 컨벤션

### Git Branch 전략
```
main        # 배포 가능한 상태
└── develop # 개발 통합 브랜치
    ├── feature/이슈번호-기능명   # 기능 개발
    ├── fix/이슈번호-버그명       # 버그 수정
    └── refactor/이슈번호-내용    # 리팩토링
```

### Commit Message
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드, 설정 변경
```

예시: `feat: Question 검색 기능 구현 (#10)`

### 코드 스타일
- Entity: `@Entity`, `@Table`, Lombok 사용
- DTO: Request/Response 분리, `record` 또는 `class` 사용
- Service: 인터페이스 없이 구현체만 (`@Service`)
- Repository: JpaRepository 상속, 필요시 QueryDSL
- Controller: `@RestController`, ResponseEntity 반환
- 예외: GlobalExceptionHandler로 일괄 처리

### 패키지 구조 규칙
```
entity/     → JPA 엔티티 (DB 테이블 매핑)
dto/        → 요청/응답 객체 (API 계층)
repository/ → 데이터 접근 계층
service/    → 비즈니스 로직
controller/ → REST API 엔드포인트
exception/  → 커스텀 예외 및 핸들러
```

## 로컬 개발 환경

### Docker 실행
```bash
docker-compose up -d
```

### DB 접속 정보
```
Host: localhost
Port: 3306
Database: moya_list
Username: moya
Password: moya1234
```

### 애플리케이션 실행
```bash
cd backend
./gradlew bootRun
```

### 테스트
```bash
./gradlew test
```

## 기능 명세

### User (사용자)
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 소셜 로그인 | Google OAuth2 + JWT | 높음 | ✅ 완료 | #15 |
| 프로필 조회 | 사용자 정보 조회 API | 높음 | ✅ 완료 | #9 |
| 프로필 수정 | 닉네임 수정 | 중간 | ✅ 완료 | #16 |

### Question (질문)
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 질문 생성 | 제목, 설명, 출처URL 입력 | 높음 | ✅ 완료 | |
| 질문 조회 | 단건/목록 조회 | 높음 | ✅ 완료 | |
| 질문 수정 | 제목, 설명, 출처URL 수정 | 높음 | ✅ 완료 | #7 |
| 질문 삭제 | soft delete | 높음 | ✅ 완료 | #7 |
| 해결 표시 | isResolved 토글 API | 높음 | ✅ 완료 | #11 |
| 태그 연결 | 질문에 태그 연결/해제 | 높음 | ✅ 완료 | #8 |

### Tag (태그)
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 태그 생성 | 새 태그 추가 (랜덤 색상) | 높음 | ✅ 완료 | #8 |
| 태그 조회 | 전체/단건 조회 | 높음 | ✅ 완료 | #8 |
| 태그 수정 | 태그명, 색상 변경 | 중간 | ✅ 완료 | #13 |
| 태그 삭제 | 태그 삭제 | 중간 | ✅ 완료 | #14 |
| 태그별 질문 조회 | 특정 태그의 질문 목록 | 높음 | ✅ 완료 | #25 |

### 검색/필터링
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 키워드 검색 | 제목/설명 검색 | 높음 | ✅ 완료 | #10 |
| 태그 필터링 (단일) | 태그 기반 필터 | 높음 | ✅ 완료 | #10 |
| 해결 상태 필터링 | isResolved 필터 | 높음 | ✅ 완료 | #10 |
| 페이지네이션 | 목록 페이징 | 높음 | ✅ 완료 | #10 |
| 등록일 검색 | 일자 범위 검색 | 중간 | ✅ 완료 | #17 |
| 태그 다중 선택 필터 | '전체' 제외, 여러 태그 AND/OR 조합 | 높음 | 📋 예정 | |
| 날짜 달력 선택 | 달력 UI로 날짜/기간 지정 검색 | 중간 | 📋 예정 | |
| 검색창 쿼리 표현 | 필터 상태를 `status:미해결 tags:JS` 형식으로 검색창에 표시, 직접 입력도 가능, 자동완성 지원 | 중간 | 📋 예정 | |

### 인증/보안
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| userId JWT 추출 | 요청 Body userId 제거, 토큰에서 추출 | 높음 | ✅ 완료 | #28 |
| IDOR 방지 | 소유권 검사 (403 반환) | 높음 | ✅ 완료 | #30 |
| 데이터 격리 | userId 기반 쿼리 필터링 | 높음 | ✅ 완료 | #31 |

### 질문 상세 보기
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| 상세 페이지 | `/questions/{id}` 라우트, 새 탭/창에서 열기 | 높음 | 📋 예정 | |
| 상세 페이지 수정 | 제목/설명/출처URL 수정 | 높음 | 📋 예정 | |
| 상세 페이지 삭제 | 질문 삭제 후 목록으로 이동 | 높음 | 📋 예정 | |
| 상세 페이지 태그 수정 | 태그 추가/제거 | 높음 | 📋 예정 | |

### 태그 입력 자동화
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| `#태그명` 자동 파싱 | 질문 입력 시 `#` 뒤 문자열을 태그로 인식 (공백 기준 분리) | 높음 | 📋 예정 | |
| 태그 실시간 하이라이팅 | 입력 중 `#태그명` 부분 색상 강조 | 중간 | 📋 예정 | |
| 신규 태그 자동 등록 | 기존에 없는 태그면 등록 시 자동 생성 | 높음 | 📋 예정 | |

### UX 개선
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| '상세' 버튼 제거 | QuickInput의 '상세' 버튼 제거, '+' 버튼만 유지 | 낮음 | 📋 예정 | |
| 키보드 단축키 | `Ctrl+Shift+O` (Mac: `Cmd+Shift+O`): 새 질문 등록 모달, `Ctrl+\` (Mac: `Cmd+\`): 사이드바 토글 | 중간 | 📋 예정 | |

### 첨부파일 (Attachment)
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| 파일 업로드 | 질문에 파일 첨부 | 중간 | 미진행 | S3 연동 필요 (#18) |
| 파일 삭제 | 첨부파일 삭제 | 중간 | 미진행 | |

### 통계
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| Top 5 태그 | 인기 태그 통계 API | 중간 | ✅ 완료 | #19 |
| 활동 히트맵 | 사이드바 12주 롤링 히트맵, 날짜 클릭 시 궁금해한 것/해결한 것 분리 표시 | 중간 | ✅ 완료 | #33 |

### 게스트 모드
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 비로그인 질문 | LocalStorage 저장, 게스트 모드 헤더 표시 | 중간 | ✅ 완료 | #21 |
| 데이터 마이그레이션 | 로그인 시 배너로 이관 확인 | 중간 | ✅ 완료 | #21 |

### 메인 랜딩 페이지
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 랜딩 페이지 `/` | 클릭 즉시 입력, 스크롤로 /questions 이동 | 중간 | ✅ 완료 | #34 |
| 양방향 스크롤 네비게이션 | / ↔ /questions 스크롤로 이동 | 중간 | ✅ 완료 | #34 |
| 플로팅 상단 이동 버튼 | /questions 스크롤 시 상단 이동 버튼 (fade 애니메이션) | 낮음 | ✅ 완료 | #34 |

### 브라우저 익스텐션
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| 텍스트 선택 추가 | 우클릭 → MoyaList에 추가 | 낮음 | 미진행 | 별도 프로젝트 (#22) |
| 자동 출처 등록 | 현재 페이지 URL 자동 입력 | 낮음 | 미진행 | |
| 익스텐션 로그인 | 로그인 상태 유지 | 낮음 | 미진행 | |

## 현재 진행 상황

### 완료
- [x] 프로젝트 초기 설정 및 Docker 환경 구성
- [x] ERD 및 DDL 작성
- [x] JPA Entity 구현 (User, Question, Tag, Attachment, QuestionTag)
- [x] 기본 CRUD API (User, Question, Tag)
- [x] DTO 및 예외 처리 구현
- [x] Question-Tag 연결 기능 (#8)
- [x] Question 검색/필터링/페이지네이션 (#10)
- [x] 해결 상태 토글 API (#11)
- [x] 태그 수정/삭제 API (#13, #14)
- [x] 태그 생성 랜덤 색상 (#23)
- [x] Top 5 인기 태그 통계 API (#19)
- [x] 등록일 기반 검색 (#17)
- [x] 태그별 질문 조회 (#25)
- [x] Google OAuth2 로그인 + JWT 인증 (#15)
- [x] userId JWT 추출, IDOR 방지, 데이터 격리 (#28, #30, #31)
- [x] React 프론트엔드 기본 구현 (질문 목록/등록/필터, 태그, 로그인)
- [x] 게스트 모드 (LocalStorage 기반, 로그인 시 이관) (#21)
- [x] 활동 히트맵 (사이드바, 날짜 클릭 상세) (#33)
- [x] 메인 랜딩 페이지 및 양방향 스크롤 네비게이션 (#34)
- [x] Question 엔티티 `resolved_at` 컬럼 추가 (해결 날짜 추적)

### 진행 예정 (우선순위 순)
- [ ] 질문 상세 보기 페이지 `/questions/{id}` (수정/삭제/태그 수정)
- [ ] `#태그명` 자동 파싱 및 신규 태그 자동 등록
- [ ] 날짜 달력 UI 선택 및 기간 검색
- [ ] 태그 다중 선택 필터
- [ ] 검색창 쿼리 표현 및 자동완성
- [ ] '상세' 버튼 제거
- [ ] 키보드 단축키 (`Ctrl+Shift+O`, `Ctrl+\`, Mac 지원)
- [ ] 배포 (AWS EC2 + RDS)
- [ ] #18: 첨부파일 업로드 (S3)
- [ ] #22: Chrome Extension

## 주의사항

### 작업 시 확인할 것
1. 새 기능 작업 전 `main` 브랜치에서 최신 pull
2. feature 브랜치 생성 후 작업
3. 커밋 메시지 컨벤션 준수
4. PR 전 테스트 통과 확인

### 환경변수 관리
- `backend/src/main/resources/application-secret.yml` — 로컬 시크릿 (gitignore됨)
- Google OAuth2 Client ID/Secret, JWT Secret 포함
- `.env.example` 참고하여 작성

### 엔티티 수정 시
- `ddl-auto: validate` 설정이므로 스키마 변경 시 DDL 직접 실행 필요
- `init/moya_list_ddl.sql` 파일도 함께 업데이트

### API 응답 형식
```json
// 성공
{
  "id": 1,
  "title": "Spring이 뭐야?",
  ...
}

// 에러
{
  "status": 404,
  "error": "Not Found",
  "message": "Question not found with id: 1"
}
```

## 참고 문서
- ERD: `docs/erd.png`
- DB 설계: `docs/db-design.md`
- GitHub Issues: 기능별 상세 명세 확인
