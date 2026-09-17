# 영업 일일보고 Vercel 버전

## 기존 원본에 알림 적용 (2026-09-18)

1. 원본 Supabase에서 `search-notifications.sql`을 한 번 실행합니다. 아래 초기 설치용 `schema.sql`이나 테스트 안정화 SQL을 다시 실행할 필요는 없습니다.
2. 이 ZIP을 원본 Vercel 프로젝트에 배포합니다. 기존 보고 처리와 영업계획서 연동 코드는 유지합니다.
3. 원본 프로젝트 Production에 아래 환경변수를 추가하고 재배포합니다. 기존 Supabase, ADMIN_KEY, 영업계획서 설정은 변경하지 않습니다.
4. 메뉴 > 알림 설정에서 본인 이름과 한국시간을 저장하고 시험 알림을 확인합니다. 관리자 키는 필요하지 않습니다.

| 변수 | 값 |
|---|---|
| PUSH_ENABLED | `true` (중지하려면 `false`) |
| PUSH_SITE_ORIGIN | 실제 원본 사이트의 HTTPS 주소. 경로 없이 입력 |
| VAPID_PUBLIC_KEY | 원본 설정 안내에서 생성한 공개키 |
| VAPID_PRIVATE_KEY | 같은 안내에서 생성한 비밀키, Secret으로 보관 |
| CRON_SECRET | 원본용 예약 실행 비밀키, Secret으로 보관 |

- 테스트와 원본은 별도 DB, 사이트 주소와 알림 키를 사용합니다. 이미 원본에 설정한 키가 있다면 재생성하지 않습니다.
- 거래처 정리 메뉴와 화면은 제거했습니다. 기존 정리 API 호출은 차단하며 실제 데이터를 삭제하지 않습니다. 향후 수입 시 CIMS 폐업·오스템 담당·기공소·지점 외 거래처 제외는 유지합니다.
- 알림의 빈도 표시만 제거했습니다. 원하는 시각부터 15분 동안 확인하며 기기별 당일 중복 발송은 계속 차단합니다. 휴일·연차·보고 완료는 제외합니다.
- 개인 시간을 저장하면 서버가 Supabase Cron과 Vault를 연결합니다. 매분 확인하므로 Vercel의 하루 한 번 Cron은 사용하지 않습니다.
- Android Chrome에서 알림을 허용하거나 iOS 16.4 이상에서 Safari로 홈 화면에 추가 후 설정합니다. 실제 수신은 기기 권한과 통신 상태에 영향을 받습니다.
- 로컬 검증은 가짜 DB·발송기로 수행했습니다. 실제 원본 배포, SQL 실행과 휴대폰 수신 확인은 별도입니다.

## 최초 설치 안내

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
