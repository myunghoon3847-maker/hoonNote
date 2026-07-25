# v4.6.0 RC1 출시 전 남은 차단 항목

다음 항목은 코드만으로 완료할 수 없으며 Play Console 또는 실제 Android 기기가 필요합니다.

## 1. AAB 생성

- PWABuilder 또는 Bubblewrap로 Android 프로젝트 생성
- package ID `com.hooncompany.hoonnote`
- target SDK 36
- versionName `1.0.0-rc1`
- versionCode `1`

## 2. Play 내부 테스트 업로드

- Google Play App Signing 활성화
- AAB 내부 테스트 트랙 업로드
- 로그인 테스트 계정 제공
- 개인정보처리방침·계정 삭제 URL 등록

## 3. Digital Asset Links 완성

- Play 앱 서명 인증서 SHA-256 확인
- 템플릿의 플레이스홀더를 실지문으로 교체
- 사용자 사이트 도메인 루트의 `/.well-known/assetlinks.json`에 배포
- 프로젝트 경로 `/solonote/.well-known/`가 아니라 도메인 루트여야 함

## 4. 실제 기기 검사

- Play 내부 테스트본 설치
- 주소창 없이 Trusted Web Activity로 실행
- 로그인·메모·동기화·비밀번호 재설정·계정 삭제
- 오프라인 초안 보호와 네트워크 복구
- 웹 버전 교체 후 업데이트 안내와 버전 변경

위 네 항목이 끝나기 전에는 정식 출시본이 아니라 RC로 유지합니다.
