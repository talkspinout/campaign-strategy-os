# 캠페인 전략 설계 OS

포스트잇처럼 쌓고 → 하나로 승격하고 → 전략과 활동의 연결을 점검한 뒤 → 브리프 한 장으로 내보내는 캠페인 전략 설계 도구.

## 구조

- 정적 SPA — 서버·DB 없음. 저장은 브라우저(localStorage) + 프로젝트 JSON 파일.
- 외부 마케팅 프레임워크의 결과를 카드로 받아 목표·근거·전략·활동·성공 신호의 연결만 점검한다. 프레임워크 자체는 탑재하지 않는다.
- 활동 라이브러리는 역할과 실행 수단을 분리하고, 활동별 다음 행동과 성공 신호를 기록한다.
- 채워진 예시는 템플릿마다 1개씩 제공하는 학습용 가상 사례로, 대표안·대안·제외안(제외 이유 포함)을 함께 보여준다. 자유 보드만 예외.
- `src/App.jsx` — 앱 전체 (템플릿 정의, 보드, 문서 export 포함)
- `scripts/verify-project-data.mjs` — 템플릿·스냅샷·v2 마이그레이션·미상 섹션 복구 검증
- `AUTHOR_NAME` 상수(App.jsx 상단) — 작성자 브랜딩. 여기만 바꾸면 전체 반영.

## 실행

```bash
npm install
npm run dev      # 로컬 개발
npm run build    # dist/ 에 정적 빌드
npm run verify:data # 저장 데이터와 템플릿 회귀 검증
```

## 배포 (GitHub Pages)

이 저장소는 `hongseok-portfolio`와 분리된 독립 저장소로 운영한다. 최종 주소는
`https://talkspinout.github.io/campaign-strategy-os/` 이며, `vite.config.js`의
`base: "./"` 덕분에 경로가 달라져도 빌드가 깨지지 않는다.

**현재 상태: 비공개 테스트 단계.** 무료 플랜에서는 비공개 저장소에 Pages를 켤 수
없으므로 테스트는 로컬(`npm run dev`)에서 진행한다.

### 공개 전환 체크리스트

1. 실제 기획 작업 1건을 이 도구로 끝까지 통과시켜 보고 빈틈 보완
2. 저장소 Settings → General → **Change visibility → Public**
3. Settings → Pages → Source를 **GitHub Actions**로 설정
4. `.github/workflows/deploy.yml`의 `push` 트리거 주석 해제 (또는 Actions 탭에서 수동 실행)
5. `https://talkspinout.github.io/campaign-strategy-os/` 접속 확인 (OG 태그·GTM 동작 포함)
6. 포트폴리오 저장소에서 GNB 개편: "개인 프로젝트" → "마케팅 랩", 하위 메뉴에
   "캠페인 전략 설계 OS" 추가, `LAB_ITEMS`에 카드 추가, lab.html 문구 정리

## 관리 메모 (Claude / Codex 협업용)

- 템플릿 추가·수정: `src/App.jsx`의 `TEMPLATES` 객체. `section(id, 제목, 질문, 도움말, 역할, kind)` 형식.
- 데이터 스키마 변경 시 `SCHEMA_VERSION`을 올리고 `migrate` 로직 확인.
- 프로젝트 관리는 추후 Notion 등 외부 도구에서 진행 — 이 앱은 브리프 작성과 기획·실행의 논리 연결 점검까지가 경계.
- GTM은 포트폴리오와 같은 컨테이너(`GTM-NPBTB82`)를 index.html에서 직접 로드한다. ID 변경은 사용자 요청이 있을 때만.
- 예시 작성에 참고한 개인 자료·대응 기록은 공개 저장소에 올리지 않는다. 예시 라벨은 항상 "학습용 가상 사례"로 유지한다.
