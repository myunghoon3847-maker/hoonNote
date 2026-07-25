# v4.6.0 RC1 PWA·Android 감사

| 영역 | 결과 | 확인 내용 |
|---|---|---|
| Web App Manifest | PASS | id, name, short_name, start_url, scope, standalone, icons |
| 앱 실행 창 | PASS | launch_handler navigate-existing |
| 일반 아이콘 | PASS | 192×192, 512×512 |
| Maskable 아이콘 | PASS | 192×192, 512×512, 풀블리드 배경 |
| Monochrome 아이콘 | PASS | 512×512 |
| Apple Touch 아이콘 | PASS | 180×180, 투명 모서리 없음 |
| Play Store 아이콘 | PASS | 512×512, 1MB 이하 |
| 서비스워커 설치 | PASS | 핵심 자산 24개 사전 캐시 |
| 서비스워커 업데이트 | PASS | waiting worker → 사용자 선택 → SKIP_WAITING |
| 오프라인 앱 셸 | PASS | 네트워크 실패 시 캐시 문서 반환 단위 검사 |
| 구버전 캐시 정리 | PASS | hoonnote-/solonote- 접두사 캐시 정리 |
| Supabase JS 버전 | PASS | 2.110.8로 고정 |
| Android Package ID | PASS | com.hooncompany.hoonnote |
| Android Target SDK | PASS | 36 |
| Android 패키지 형식 | PASS | AAB |
| Digital Asset Links 템플릿 | PASS | 루트 저장소 배포 구조 포함 |
| 실제 앱 서명 SHA-256 | PENDING | Play App Signing 활성화 후 입력 필요 |
| TWA 주소창 제거 실기기 검사 | PENDING | 실제 AAB·assetlinks 배포 후 확인 필요 |

## 판정

웹 RC 패키지는 내부 테스트 준비 상태입니다. Android 정식 출시 통과 판정은 실제 Play 앱 서명 지문, 도메인 루트 Digital Asset Links와 내부 테스트 설치본 검증 후 가능합니다.
