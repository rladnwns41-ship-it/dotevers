# Dotverse

블록 코딩으로 도트 게임을 만들고 함께 플레이하는 웹앱. 정적 사이트 + Supabase.

## 1. Supabase 준비
1. SQL Editor 에 `schema.sql` 전체를 붙여 실행합니다. (여러 번 실행해도 안전)
2. Settings > API : Data API 활성화, Exposed schemas 에 `public` 포함.
3. Authentication > Providers > Email : **Confirm email 끄기**.
4. Authentication > Providers > Anonymous : **켜기** (로그인 없이 참여용).
5. Storage : `media` 버킷이 schema.sql 로 자동 생성됩니다 (public).

## 2. Render 배포
- New > Static Site > 이 저장소
- **Build Command**:
  ```
  printf 'window.__ENV={SUPABASE_URL:"%s",SUPABASE_PUBLISHABLE_KEY:"%s"};' "$SUPABASE_URL" "$SUPABASE_PUBLISHABLE_KEY" > env.js
  ```
- **Publish Directory**: `.`
- Environment Variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`

배포 후 `https<도메인>/env.js` 를 열어 값이 채워졌는지 확인하세요.
publishable(anon) 키는 브라우저 공개용이라 노출돼도 안전합니다. 보호는 RLS 가 합니다.

## 3. 파일
| 파일 | 역할 |
|---|---|
| index.html | 앱 전체 (랜딩·스튜디오·커뮤니티·프로필) |
| blocks-engine.js | 블록 정의 · 레이아웃 · 붙이기 · 실행 런타임 |
| supabase-client.js | DB 호출 (작품·블록·커뮤니티·채팅·알림·Storage) |
| seed.js | 도트 스프라이트, 게시판 정의, 약관 본문 등 고정 자원 |
| support.js | 렌더 런타임 |
| env.js | Supabase 접속 정보 (빌드 때 생성) |
| schema.sql | 테이블 · RLS · 트리거 · 함수 |

## 4. 데이터베이스에 저장되는 것
작품과 저장본, 블록 코드(오브젝트별), 맵 타일, 오브젝트 배치, 변수·리스트·함수·신호,
도트 모양, 올린 사진·소리(Storage 링크), 커뮤니티 글·댓글·답글·추천·투표,
채팅(실시간), 알림, 신고, 팔로우, 플레이 기록, 실시간 변수·테이블.
