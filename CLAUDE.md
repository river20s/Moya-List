# CLAUDE.md - MoyaList 프로젝트 가이드

> **GitHub**: https://github.com/river20s/moya-list

## 프로젝트 개요

**MoyaList**는 "이게 뭐야?" 하는 궁금증을 빠르게 포착하고 해결 여부를 추적하는 학습 서비스다.

### 핵심 가치
- 빠른 등록: 떠오르는 궁금증을 즉시 캡처
- 추적 관리: 해결 여부, 태그별 분류
- 학습 인사이트: 히트맵, 통계로 학습 패턴 파악

## 기술 스택

### Backend
- **Language**: Java 17
- **Framework**: Spring Boot 3.4.1
- **ORM**: Spring Data JPA
- **Database**: MySQL 8.0
- **Cache**: Redis 7 (세션/캐싱용, 추후 적용)
- **Build**: Gradle (Groovy)

### Infrastructure
- **Container**: Docker Compose
- **Cloud**: AWS (예정)

### Frontend (예정)
- React

### Extension (예정)
- Chrome Extension

## 프로젝트 구조

```
moya-list/
├── backend/
│   └── src/main/java/com/river/moyalist/
│       ├── controller/     # REST API 엔드포인트
│       ├── service/        # 비즈니스 로직
│       ├── repository/     # JPA Repository
│       ├── entity/         # JPA Entity
│       ├── dto/            # Request/Response DTO
│       └── exception/      # 예외 처리
├── frontend/               # React 웹 클라이언트 (예정)
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
git checkout develop
git pull origin develop
git checkout -b feature/10-question-search

# 2. 작업 후 커밋
git add .
git commit -m "feat: Question 검색 기능 구현 (#10)"

# 3. 푸시 및 PR 생성
git push origin feature/10-question-search
# GitHub에서 PR 생성: feature/10-question-search → develop

# 4. 머지 후 브랜치 삭제
git checkout develop
git pull origin develop
git branch -d feature/10-question-search
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
| 기능 | 설명 | 우선순위 | 상태 |
|------|------|----------|------|
| 소셜 로그인 | Google, 카카오, 네이버 OAuth | 높음 | 미진행 |
| 프로필 조회 | 사용자 정보 조회 API | 높음 | ✅ 완료 |
| 프로필 수정 | 닉네임, 프로필 사진 수정 | 중간 | 미진행 |

### Question (질문)
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 질문 생성 | 제목, 설명, 출처URL 입력 | 높음 | ✅ 완료 | |
| 질문 조회 | 단건/목록 조회 | 높음 | ✅ 완료 | |
| 질문 수정 | 제목, 설명, 출처URL 수정 | 높음 | ✅ 완료 | |
| 질문 삭제 | soft delete | 높음 | ✅ 완료 | |
| 해결 표시 | isResolved 토글 API | 높음 | 미진행 | |
| 태그 연결 | 질문에 태그 연결/해제 | 높음 | ✅ 완료 | #8 |

### Tag (태그)
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 태그 생성 | 새 태그 추가 | 높음 | ✅ 완료 | #8 |
| 태그 조회 | 전체/단건 조회 | 높음 | ✅ 완료 | #8 |
| 태그 수정 | 태그명, 색상 변경 | 중간 | 미진행 | |
| 태그 삭제 | 태그 삭제 | 중간 | 미진행 | |
| 태그별 질문 조회 | 특정 태그의 질문 목록 | 높음 | 미진행 | |

### 검색/필터링
| 기능 | 설명 | 우선순위 | 상태 | 이슈 |
|------|------|----------|------|------|
| 키워드 검색 | 제목/설명 검색 | 높음 | 🔄 진행중 | #10 |
| 태그 필터링 | 태그 기반 필터 | 높음 | 🔄 진행중 | #10 |
| 해결 상태 필터링 | isResolved 필터 | 높음 | 🔄 진행중 | #10 |
| 페이지네이션 | 목록 페이징 | 높음 | 🔄 진행중 | #10 |
| 등록일 검색 | 일자 범위 검색 | 중간 | 미진행 | |

### 첨부파일 (Attachment)
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| 파일 업로드 | 질문에 파일 첨부 | 중간 | 미진행 | S3 연동 필요 |
| 파일 삭제 | 첨부파일 삭제 | 중간 | 미진행 | |

### 통계
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| Top 5 태그 | 주간/월간/연간 인기 태그 | 중간 | 미진행 | |
| 활동 히트맵 | GitHub 스타일 기여 히트맵 | 낮음 | 미진행 | 프론트 작업 필요 |

### 게스트 모드
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| 비로그인 질문 | 쿠키/캐시로 데이터 저장 | 중간 | 미진행 | LocalStorage |
| 데이터 마이그레이션 | 로그인 시 게스트 데이터 이관 | 중간 | 미진행 | |

### 브라우저 익스텐션
| 기능 | 설명 | 우선순위 | 상태 | 비고 |
|------|------|----------|------|------|
| 텍스트 선택 추가 | 우클릭 → MoyaList에 추가 | 낮음 | 미진행 | 별도 프로젝트 |
| 자동 출처 등록 | 현재 페이지 URL 자동 입력 | 낮음 | 미진행 | |
| 익스텐션 로그인 | 로그인 상태 유지 | 낮음 | 미진행 | |

## 현재 진행 상황

### 완료
- [x] 프로젝트 초기 설정
- [x] Docker 환경 구성 (MySQL, Redis)
- [x] ERD 및 DDL 작성
- [x] JPA Entity 구현 (User, Question, Tag, Attachment, QuestionTag)
- [x] 기본 CRUD API (User, Question, Tag)
- [x] DTO 및 예외 처리 구현
- [x] Question-Tag 연결 기능 (#8)

### 진행 중
- [ ] #10: Question 검색/필터링 기능
  - 키워드 검색 (title, description)
  - 태그별 필터링
  - 해결 상태 필터링
  - 페이지네이션

### 예정
- [ ] 인증/인가 (Spring Security + OAuth2)
- [ ] 첨부파일 업로드 (S3)
- [ ] 게스트 모드 구현
- [ ] 통계/히트맵 API
- [ ] React 프론트엔드
- [ ] Chrome Extension
- [ ] 배포 (AWS)

## 주의사항

### 작업 시 확인할 것
1. 새 기능 작업 전 `develop` 브랜치에서 최신 pull
2. feature 브랜치 생성 후 작업
3. 커밋 메시지 컨벤션 준수
4. PR 전 테스트 통과 확인

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
