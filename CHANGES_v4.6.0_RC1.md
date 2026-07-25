# 훈노트 v4.6.0 RC1 변경 사항

## PWA

- 매니페스트에 단일 실행 창을 선호하는 `launch_handler` 추가
- `standalone` 우선 표시와 `minimal-ui` 대체 표시 설정
- 서비스워커를 문서 네트워크 우선, 정적 자산 캐시 우선·백그라운드 갱신 구조로 정리
- 구버전 훈노트·솔로노트 캐시 자동 삭제 유지
- 업데이트 적용 지연 시 10초 후 사용자 안내 추가
- 앱 포커스·가시성 복귀·bfcache 복귀·30분 주기 업데이트 확인 추가

## 의존성

- Supabase JS CDN 주소를 이동 태그 `@2`에서 고정 버전 `2.110.8`로 변경

## 아이콘

- Maskable 192/512 아이콘의 배경을 완전한 풀블리드로 변경
- Apple Touch 아이콘과 Play Store 512 아이콘의 투명 모서리 제거
- 핵심 로고는 중앙 안전 영역 안에 유지

## Android·Google Play

- `targetSdkVersion 36`
- `versionName 1.0.0-rc1`, `versionCode 1`
- AAB·내부 테스트·Google Play App Signing 기준 문서 갱신
- 도메인 루트용 `.well-known/assetlinks.json` 템플릿과 GitHub Pages `_config.yml` 추가

## 버전

- 앱 버전: `v4.6.0 RC1`
- 백업 버전: `4.6.0-rc.1`
- 계정 삭제 클라이언트 버전: `4.6.0-rc.1`
- 자산 버전: `v=468`
