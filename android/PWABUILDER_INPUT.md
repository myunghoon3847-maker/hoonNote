# PWABuilder 입력값 — 훈노트 v4.6.0 RC1

## 웹 배포 선행 확인

- 앱: `https://myunghoon3847-maker.github.io/solonote/`
- Manifest: `https://myunghoon3847-maker.github.io/solonote/manifest.json`
- Service Worker: `https://myunghoon3847-maker.github.io/solonote/service-worker.js`
- 개인정보처리방침: `https://myunghoon3847-maker.github.io/solonote/legal/privacy.html`
- 계정 삭제 안내: `https://myunghoon3847-maker.github.io/solonote/support/delete-account.html`

## Android 패키지 입력값

- Package ID: `com.hooncompany.hoonnote`
- App name: `훈노트 - 1인 업무·아이디어 노트`
- Launcher name: `훈노트`
- Start URL: `https://myunghoon3847-maker.github.io/solonote/`
- Version name: `1.0.0-rc1`
- Version code: `1`
- Minimum SDK: `23`
- Target SDK: `36`
- Orientation: `portrait-primary`
- Theme color: `#2563EB`
- Background color: `#F8FAFC`
- Build format: `AAB`
- Release track: `Internal testing`
- Signing: `Google Play App Signing`

## 아이콘

- 일반 아이콘: `icons/icon-512.png`
- Maskable 아이콘: `icons/icon-maskable-512.png`
- Play Store 아이콘: `icons/play-store-icon-512.png`

## 생성 후 확인

- Android 프로젝트의 `applicationId`가 `com.hooncompany.hoonnote`인지 확인
- `targetSdk`가 36인지 확인
- AAB의 versionCode가 Play Console의 기존 값보다 큰지 확인
- Play 앱 서명 SHA-256을 사용해 도메인 루트 `/.well-known/assetlinks.json` 완성
- Play 내부 테스트 설치본에서 주소창 없이 실행되는지 확인

실제 서명키, 키 비밀번호, 심사용 계정 비밀번호는 프로젝트 파일에 기록하지 않습니다.
