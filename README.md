# 훈노트 v4.5.16

훈노트 v4.5.16은 새 기능을 추가하지 않고 중복 화면, 사용하지 않는 JavaScript 연결, 과거 UI 스타일과 배포 문서 누적을 정리한 내부 구조 안정화 버전입니다.

## 핵심 정리

- 사용하지 않던 별도 설정 화면 제거
- 설정 기능을 현재 메뉴 내부 설정 화면으로 단일화
- 웹 앱 설치 버튼을 메뉴 설정의 앱 정보 영역으로 이동
- 존재하지 않는 버튼을 찾던 JavaScript와 이벤트 제거
- 과거 카테고리 더보기·독립 작성 화면·옛 로고·옛 설정 메뉴 CSS 제거
- 사용되지 않는 CSS 선택자 79개와 완전 중복 규칙 2개 제거
- v4.5.14에서 실제 적용한 Supabase RLS 감사·보강 SQL을 프로젝트에 포함
- 과거 버전별 변경·검수 문서 누적을 제거하고 현재 버전 문서만 유지

## 배포

ZIP의 파일을 기존 GitHub Pages 저장소에 전체 덮어쓰기합니다.

```text
https://myunghoon3847-maker.github.io/solonote/?v=467
```

메뉴 하단에서 `v4.5.16`을 확인합니다.

## 주요 폴더

- `css/`: 현재 UI 스타일
- `js/`: 인증, 저장소, UI, 앱 동작, 오류 안내, PWA
- `supabase/sql/`: 계정 삭제, 카테고리, RLS 감사·보강·검증 SQL
- `supabase/functions/`: 계정 삭제 Edge Function
- `tests/`: 보안·핵심 기능·비밀번호 재설정·모바일 회귀 검사
- `legal/`, `support/`: 정책 및 고객지원 페이지
- `android/`: Google Play/TWA 준비 자료

## 검수 문서

- `CHANGES_v4.5.16.md`
- `CLEANUP_AUDIT_v4.5.16.md`
- `TEST_CHECKLIST_v4.5.16.md`
- `VALIDATION_REPORT_v4.5.16.md`
- `RELEASE_CHECKLIST_v4.5.16.md`
