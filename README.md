# 훈노트 v4.6.0 RC1

훈노트 v4.6.0 RC1은 v4.5.16의 기능과 UI를 동결한 상태에서 PWA 설치·업데이트·오프라인 앱 셸과 Android Trusted Web Activity 출시 준비를 최종 점검한 내부 테스트용 출시 후보입니다.

## 이번 RC의 핵심

- 웹 리소스 버전 `v=468`
- 서비스워커 캐시 `hoonnote-v4-6-0-rc1-cache`
- Supabase JS 의존성을 `2.110.8`로 고정
- 정적 자산 캐시 우선·백그라운드 갱신 전략 적용
- 사용자가 업데이트를 선택했을 때만 새 서비스워커 활성화
- 30분 주기·앱 복귀 시 업데이트 확인
- Maskable·Apple Touch·Play Store 아이콘을 풀블리드로 보정
- Android 패키지 입력값을 `targetSdk 36`, `1.0.0-rc1`으로 정리
- GitHub Pages 도메인 루트용 Digital Asset Links 템플릿 포함

## 배포 확인 주소

`https://myunghoon3847-maker.github.io/solonote/?v=468`

메뉴 하단에서 `v4.6.0 RC1`을 확인합니다.

## 자동 검수

- 보안·정적 검사 9/9 통과
- 핵심 기능 연속 검사 17/17 통과
- 비밀번호 재설정 단일 흐름 통과
- 모바일 320~430px 검사 통과
- 서비스워커 단위 검사 5/5 통과
- PWA·Android 정적 감사 7 PASS / 1 WARN

WARN은 오류가 아니라 Play 앱 서명 SHA-256이 아직 확정되지 않아 실제 `assetlinks.json`을 완성할 수 없다는 의미입니다.

## RC1에서 아직 수동으로 해야 하는 작업

1. 웹 RC1 전체 배포
2. PWABuilder/Bubblewrap로 AAB 생성
3. Play 내부 테스트 업로드
4. Play 앱 서명 SHA-256 확인
5. 도메인 루트 `/.well-known/assetlinks.json` 배포
6. 실기기에서 주소창 없는 TWA 실행과 업데이트 검증

자세한 내용은 `RELEASE_BLOCKERS_v4.6.0_RC1.md`와 `android/RC_DEVICE_TEST_CHECKLIST.md`를 확인합니다.
