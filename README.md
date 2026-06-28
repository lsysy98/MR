# 영업 일일보고 Vercel 버전

이 버전은 Vercel에 사이트를 올리고, Supabase에 데이터를 저장합니다.

중요: GitHub나 Vercel은 화면을 보여주는 역할입니다. 팀원들이 입력한 내용을 같이 보려면 Supabase 같은 공용 저장소가 필요합니다.

## 준비물

1. GitHub 계정
2. Vercel 계정
3. Supabase 계정

## Supabase에서 할 일

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor를 엽니다.
3. 이 폴더의 `schema.sql` 내용을 그대로 실행합니다.
4. Project Settings > API에서 아래 값을 확인합니다.
   - Project URL
   - service_role key

## Vercel에서 할 일

1. 이 폴더를 GitHub 저장소로 올립니다.
2. Vercel에서 그 GitHub 저장소를 Import 합니다.
3. Environment Variables에 아래 2개를 넣습니다.
   - `SUPABASE_URL`: Supabase의 Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase의 service_role key
4. Deploy 합니다.

## 파일 구성

- `index.html`: 모바일 입력/현황 화면
- `app.js`: 화면 동작
- `api/reports.js`: 저장/조회/수정/삭제 API
- `schema.sql`: Supabase 테이블 생성 SQL
