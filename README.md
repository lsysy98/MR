# 영업 일일보고 Vercel 버전

이 버전은 Vercel에 화면을 올리고, Supabase에 데이터를 저장합니다.

## Supabase에서 할 일

1. Supabase 프로젝트를 엽니다.
2. SQL Editor에서 `schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 아래 값을 확인합니다.
   - Project URL
   - service_role key

## Vercel에서 할 일

Environment Variables에 아래 값을 넣습니다.

- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service_role key
- `ADMIN_KEY`: 관리자 확인용 비밀번호

`ADMIN_KEY`는 나중에 변경 기록이나 백업 파일을 확인할 때만 씁니다. 팀원에게 공유하지 마세요.

## 숨겨진 관리자 주소

일반 앱 화면에는 변경 기록이 보이지 않습니다.

- 변경 기록 확인: `/api/logs?key=ADMIN_KEY값`
- 전체 백업 다운로드: `/api/backup?key=ADMIN_KEY값`

예를 들어 Vercel 주소가 `https://mr1-lake.vercel.app`이고 관리자 키가 `1234`라면:

- `https://mr1-lake.vercel.app/api/logs?key=1234`
- `https://mr1-lake.vercel.app/api/backup?key=1234`

## 파일 구성

- `index.html`: 화면
- `app.js`: 화면 동작
- `api/reports.js`: 저장/조회/수정/삭제 API
- `api/logs.js`: 관리자용 변경 기록 API
- `api/backup.js`: 관리자용 백업 API
- `schema.sql`: Supabase 테이블 생성 SQL
