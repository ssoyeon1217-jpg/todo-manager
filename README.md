# 할일 관리 (todo-manager)

하루를 **시간대(일과전 · 일과중 · 이동중 · 일과후 · 언젠가)** 로 나눠 체크리스트를 관리하는 웹서비스입니다.
Claude 아티팩트로 만들어 쓰던 "오늘 할 일" 앱을 독립 프로젝트로 키우기 위한 저장소입니다.

## 개발 스택

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | React 18 + TypeScript | 체크 · 정렬 · 편집처럼 상태가 많은 UI에 적합하고, 타입으로 실수를 줄일 수 있음 |
| 빌드 도구 | Vite | 설정이 단순하고 빠름 |
| 테스트 | Vitest | Vite와 설정을 공유, 로직 단위 테스트 용도 |
| 아이콘 | lucide-react | 일관된 라인 아이콘 (이모지·글자 기호 대신) |
| 드래그 | sortablejs | 마우스·터치 모두 지원하는 가벼운 정렬 라이브러리 |
| 저장 | localStorage (`Storage` 인터페이스) | 서버 없이 바로 사용, 이후 DB로 교체 가능하도록 추상화 |
| 배포 | GitHub Pages (GitHub Actions) | 무료, 휴대폰 홈 화면 바로가기(PWA)로 사용 가능 |

## 시작하기

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run test       # 단위 테스트
npm run build      # 배포용 빌드 (dist/)
```

## 폴더 구조

```
todo-manager/
├─ docs/
│  ├─ PRODUCT.md        # 기능 정의와 개발 로드맵 (기존 아티팩트 기준)
│  └─ DESIGN.md         # 디자인 방향(Soft Warm), 토큰, 검증 기준
├─ public/              # 정적 파일 (아이콘, PWA manifest)
├─ src/
│  ├─ main.tsx          # 진입점
│  ├─ App.tsx           # 화면 (날짜 이동 · 입력 · 칸별 목록)
│  ├─ components/
│  │  ├─ SortableList.tsx  # 드래그 정렬 목록 (sortablejs)
│  │  ├─ MonthView.tsx     # 월간 달력
│  │  ├─ SubList.tsx / SubEditor.tsx / MarkIcon.tsx  # 세부 항목 (○ △ ✕)
│  │  └─ RoutinesView.tsx  # 루틴 · 설정 화면
│  ├─ constants.ts      # 칸(일과전/일과중…) 정의, 요일
│  ├─ types.ts          # Task · DayDoc · Routine · Storage 타입
│  ├─ styles.css
│  └─ lib/
│     ├─ date.ts        # 날짜 유틸 (달력 칸 계산 포함)
│     ├─ date.test.ts
│     ├─ tasks.ts       # 순수 로직 (정렬, 진행률 …)
│     ├─ tasks.test.ts
│     ├─ routines.ts    # 루틴을 하루에 넣는 로직
│     ├─ routines.test.ts
│     ├─ normalize.ts   # 저장된 설정·루틴 값 보정
│     └─ storage.ts     # localStorage 저장소
└─ .github/workflows/        # ci.yml(푸시마다 검사), deploy.yml(Pages 배포, 수동)
```

## 배포 (GitHub Pages)

Actions 탭에서 "Deploy to GitHub Pages"를 수동 실행하면 빌드·배포됩니다. (GitHub 무료 플랜은 public 저장소에서만 Pages를 쓸 수 있습니다.)
최초 1회, 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 설정해야 합니다.

## 로드맵

기능 목록과 단계별 계획은 [docs/PRODUCT.md](docs/PRODUCT.md), 디자인 방향과 토큰은 [docs/DESIGN.md](docs/DESIGN.md)를 참고하세요.
