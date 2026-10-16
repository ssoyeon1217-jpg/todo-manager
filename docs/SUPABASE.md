# 로그인 · 서버 저장 설정 (Supabase + 구글 로그인)

키를 넣지 않으면 앱은 예전처럼 **이 기기에만** 저장합니다. 아래를 끝내면 구글 로그인과 서버 저장이 켜집니다.

1. https://supabase.com 에서 가입 → **New project** 생성
2. 왼쪽 **SQL Editor** → `supabase/schema.sql` 내용을 붙여 넣고 **Run** (본인 데이터만 읽고 쓰도록 잠금 설정 포함)
3. **Authentication → Sign In / Providers → Google** 켜기 (Google Cloud 콘솔에서 만든 OAuth 클라이언트 ID/Secret 입력. 안내 화면의 Callback URL 을 Google 쪽 "승인된 리디렉션 URI"에 등록)
4. **Authentication → URL Configuration**
   - Site URL: 배포 주소 (예: `https://ssoyeon1217-jpg.github.io/todo-manager/`)
   - Redirect URLs 에 위 주소와 `http://localhost:5173/` 추가
5. **Project Settings → API** 의 `Project URL` 과 `anon public` 키를 복사해 프로젝트 폴더에 `.env.local` 파일로 저장 (`.env.example` 참고)
6. GitHub Pages 배포에는 저장소 **Settings → Secrets and variables → Actions** 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 를 등록

처음 로그인할 때 서버가 비어 있으면, 이 기기에 있던 기록이 한 번 서버로 올라갑니다.
`anon` 키는 공개되어도 되는 키입니다. 데이터 보호는 2번의 잠금 설정이 맡습니다.
