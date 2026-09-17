# Teampl

대학 팀 프로젝트(팀플) 협업을 위한 올인원 웹 플랫폼입니다. 태스크 관리, AI 기반 업무 분배/평가, 실시간 채팅·화상통화, 공유 드라이브, 투표, 일정 관리를 하나의 서비스에서 제공합니다.

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [폴더 구조](#폴더-구조)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [배포](#배포)
- [기여자](#기여자)

## 주요 기능

### 태스크 관리
- 칸반 보드(TODO → 진행중 → 검수중 → 완료) 기반 워크플로우
- 우선순위(high/medium/low), 마감일 관리
- 산출물 파일 제출 및 팀원 승인(Approval) 플로우
- 태스크별 댓글(익명 옵션 포함)

### AI 어시스턴트 (OpenAI GPT-4o / GPT-4o-mini)
- 프로젝트 주제와 팀원 수만 입력하면 단계(Stage)와 세부 태스크를 자동 생성·배분
- 최종 결과 보고서를 AI가 채점(0~100점)하고 강점/약점/총평을 제공
- 팀원별 기여도를 담당 태스크 비율(%)로 표시

### 실시간 협업
- Socket.io 기반 프로젝트 채팅 / 1:1 채팅, 타이핑 인디케이터
- WebRTC 기반 1:1 및 그룹 음성·영상 통화 (시그널링 서버 직접 구현)
- 태스크·일정 변경 등 실시간 알림 브로드캐스트

### 그 외
- 공유 드라이브: 폴더 계층 구조, 파일 업로드, KT Cloud Object Storage(S3 호환) 연동
- 투표(익명/복수선택 옵션), 팀 일정 캘린더
- 마감 D-1/D-3 자동 알림(cron) + 웹 푸시 알림
- 이메일 인증 기반 회원가입/비밀번호 재설정
- FREE/PRO 플랜 구분 및 구독 페이월 UI

## 기술 스택

| 영역 | 스택 |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, MUI, Radix UI, TailwindCSS, React Router, Socket.io-client, react-dnd, recharts |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM, Socket.io, JWT, bcrypt, node-cron, web-push, nodemailer |
| Database | PostgreSQL |
| AI | OpenAI API (GPT-4o, GPT-4o-mini) |
| Storage | KT Cloud Object Storage (AWS S3 SDK 호환) |
| Infra | Docker, Docker Compose(dev/prod 분리), Nginx |

## 아키텍처

```
                        ┌────────────────────────┐
  브라우저  ──(80)──▶   │   Nginx (frontend 컨테이너)  │
                        │  ├─ /            → 정적 파일(React 빌드) │
                        │  ├─ /api/*       → 프록시 ─┐            │
                        │  └─ /socket.io/* → 프록시 ─┤            │
                        └─────────────────────────┼──────────────┘
                                                   ▼
                                     ┌────────────────────────┐
                                     │  Backend (Express + Socket.io) │
                                     │  ├─ REST API (/api/**)        │
                                     │  ├─ WebSocket (채팅/통화 시그널링) │
                                     │  ├─ Cron (마감 알림)            │
                                     │  └─ OpenAI / KT Cloud 연동      │
                                     └─────────────┬──────────────┘
                                                   ▼
                                          ┌─────────────────┐
                                          │  PostgreSQL (Prisma) │
                                          └─────────────────┘
```

개발 환경(`docker-compose.yml`)에서는 프론트(Vite dev server, 5173)와 백엔드(8080)가 각각 독립된 포트로 열려 있고, 운영 환경(`docker-compose.prod.yml`)에서는 프론트 컨테이너 안의 Nginx가 정적 파일 서빙과 API/WebSocket 프록시를 함께 담당해 단일 진입점으로 서비스합니다.

## 폴더 구조

```
teampl/
├── teampl/            # 프론트엔드 (React + Vite)
│   └── src/app/
│       ├── api/        # axios 기반 API 클라이언트
│       ├── components/ # 공통 컴포넌트 (ui/ 는 shadcn 스타일 프리미티브)
│       ├── context/     # Auth/Chat/Call/DarkMode 등 전역 상태
│       └── pages/       # 라우트 단위 페이지
├── teampl-back/        # 백엔드 (Express + Prisma)
│   ├── prisma/          # 스키마 및 시드 데이터
│   └── src/
│       ├── modules/     # 도메인별 controller/service (auth, tasks, ai, chat, drive, votes 등)
│       ├── middlewares/ # 인증, 유효성 검사, 에러 핸들링
│       └── main.ts      # Express 앱 & Socket.io 서버 엔트리포인트
├── docker-compose.yml       # 개발용
└── docker-compose.prod.yml  # 운영용
```

## 시작하기

### 요구 사항
- Docker & Docker Compose

### 개발 환경 실행

```bash
git clone <repo-url>
cd teampl
# teampl-back/.env 파일을 아래 "환경 변수" 표를 참고해 직접 생성
docker compose up --build
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8080
- 최초 실행 시 컨테이너 내부에서 `prisma generate → prisma db push → prisma db seed`가 자동 수행됩니다.

## 환경 변수

`teampl-back/.env` 기준 (docker-compose.yml 참고):

| 변수 | 설명 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `JWT_SECRET` | JWT 서명 키 |
| `FRONTEND_URL` | CORS 허용 프론트엔드 주소 |
| `OPENAI_API_KEY` | AI 태스크 분할/평가 기능용 |
| `MS_CLIENT_ID` / `MS_CLIENT_SECRET` / `MS_REDIRECT_URI` | MS OAuth 연동용 |
| `KT_CLOUD_ENDPOINT` / `KT_CLOUD_ACCESS_KEY` / `KT_CLOUD_SECRET_KEY` / `KT_CLOUD_BUCKET` / `KT_CLOUD_REGION` | 공유 드라이브 파일 스토리지 |
| `EMAIL_USER` / `EMAIL_PASS` | 회원가입/비밀번호 재설정 인증 메일 발송 |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | 웹 푸시 알림 |

## 배포

`docker-compose.prod.yml` + `Dockerfile.prod`를 사용해 프론트엔드는 Nginx로 정적 서빙, 백엔드는 Node 프로세스로 별도 컨테이너에서 구동됩니다.

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## 기여자

- [philip107-jo](https://github.com/philip107-jo) — 태스크/칸반 워크플로우, AI 기능, 기여도 분석 알고리즘, 채팅·화상통화, 공유 드라이브, UI/UX, Docker 인프라
- sunwoo427
- ssh09140-bot
