# GitHub Pages 도메인 루트용 Digital Asset Links

훈노트는 프로젝트 페이지 `https://myunghoon3847-maker.github.io/solonote/`에서 실행되지만,
Trusted Web Activity 검증 파일은 도메인 루트의 아래 주소에 있어야 합니다.

`https://myunghoon3847-maker.github.io/.well-known/assetlinks.json`

## 적용 순서

1. Play Console의 **앱 무결성 → 앱 서명**에서 앱 서명 인증서 SHA-256을 복사합니다.
2. `.well-known/assetlinks.template.json`의 플레이스홀더를 실제 지문으로 교체합니다.
3. 파일 이름을 `assetlinks.json`으로 바꿉니다.
4. 사용자 사이트 저장소 `myunghoon3847-maker.github.io`의 `.well-known/` 폴더에 배포합니다.
5. `_config.yml`의 `include: [.well-known]` 설정도 함께 배포합니다.
6. 브라우저에서 루트 주소가 JSON으로 열리는지 확인합니다.

서명키 파일과 비밀번호는 저장소에 올리지 않습니다.
