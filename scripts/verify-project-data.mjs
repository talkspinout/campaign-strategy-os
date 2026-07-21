import assert from "node:assert/strict";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  optimizeDeps: { noDiscovery: true },
  plugins: [react()],
  server: { middlewareMode: true },
});

try {
  const {
    ACTIVITY_METHODS,
    ACTIVITY_PURPOSES,
    EXAMPLES,
    SCHEMA_VERSION,
    TEMPLATES,
    buildLogicReview,
    createProject,
    normalizeImported,
    templateLabel,
  } = await server.ssrLoadModule("/src/App.jsx");

  assert.equal(templateLabel(TEMPLATES.quick), "홍석 Quick Brief");
  assert.equal(templateLabel(TEMPLATES.quick, "리뷰어"), "리뷰어 Quick Brief");
  assert.deepEqual(TEMPLATES.quick.sections.map(({ id }) => id), ["goal", "mechanism", "reference", "creative", "feasible"]);
  assert.equal(TEMPLATES.quick.sections[1].title, "캠페인 구조");
  assert.deepEqual(TEMPLATES.authorFlow.sections.map(({ id }) => id), ["situation", "meaning", "reference", "asset", "choice", "defense", "concept", "action"]);
  assert.equal(TEMPLATES.authorFlow.sections[4].title, "전략 구조 · 선택");
  assert.ok(ACTIVITY_PURPOSES.length >= 6);
  assert.ok(ACTIVITY_METHODS.some(({ id }) => id === "platform-partnership"));

  const fresh = createProject("quick", "검증 프로젝트", "리뷰어", "중견기업 마케팅 담당자");
  assert.equal(fresh.schemaVersion, SCHEMA_VERSION);
  assert.equal(fresh.target, "중견기업 마케팅 담당자");
  assert.equal(fresh.sections.length, 5);
  assert.notEqual(fresh.sections[0], TEMPLATES.quick.sections[0], "템플릿 섹션은 프로젝트에 복사되어야 합니다.");

  const orphanCard = {
    id: "orphan-card",
    sectionId: "removed-section",
    role: "unexpected-role",
    title: "유실되면 안 되는 카드",
    content: "알 수 없는 섹션에 속한 카드",
    status: "unexpected-status",
    links: [],
  };
  const recovered = normalizeImported({ ...fresh, cards: [orphanCard] });
  assert.equal(recovered.cards.length, 1);
  assert.equal(recovered.cards[0].role, "note");
  assert.equal(recovered.cards[0].status, "idea");
  assert.ok(recovered.sections.some(({ id }) => id === "removed-section"), "미상 sectionId용 복구 섹션이 필요합니다.");

  const legacy = normalizeImported({
    meta: { title: "v2 프로젝트", target: "기존 타깃" },
    frameworkKey: "quick",
    cards: [{ id: "legacy-card", zone: "ground", cardType: "support", title: "기존 카드", status: "selected" }],
  });
  assert.equal(legacy.schemaVersion, SCHEMA_VERSION);
  assert.equal(legacy.target, "기존 타깃");
  assert.equal(legacy.cards[0].sectionId, "ground");
  assert.equal(legacy.cards[0].role, "evidence");
  assert.equal(legacy.cards[0].includeInBrief, true);

  for (const example of EXAMPLES) {
    const template = TEMPLATES[example.templateId];
    assert.equal(example.typeId, template.typeId, `${example.id} 예시의 typeId가 템플릿(${example.templateId})의 실제 typeId(${template.typeId})와 다릅니다 — 라이브러리 화면의 작업 유형 탭에서 예시가 엉뚱한 곳에 표시됩니다.`);
    const sectionIds = new Set(template.sections.map(({ id }) => id));
    for (const [sectionId] of example.cards) {
      assert.ok(sectionIds.has(sectionId), `${example.id} 예시의 ${sectionId} 섹션이 템플릿에 없습니다.`);
    }
  }

  // EXAMPLES는 12개 템플릿 중 blank(자유 보드)만 예시가 구조적으로 불가능하다.
  // 나머지 11개는 모두 최소 1개 예시가 있어야 "예시 힌트" 버튼이 항상 노출된다.
  const templateIdsWithExample = new Set(EXAMPLES.map((example) => example.templateId));
  Object.keys(TEMPLATES).filter((id) => id !== "blank").forEach((id) => {
    assert.ok(templateIdsWithExample.has(id), `템플릿 ${id}에 대한 예시가 없어 "예시 힌트" 버튼이 뜨지 않습니다.`);
  });

  const reconstructedExamples = EXAMPLES.filter(({ basis }) => basis.includes("실제"));
  assert.ok(reconstructedExamples.length >= 7, "실제 제안 구조를 익명 재구성한 예시가 충분해야 합니다.");
  reconstructedExamples.forEach((example) => {
    assert.ok(example.anonymization, `${example.id} 예시에 익명화 기준이 필요합니다.`);
    assert.ok(example.reconstruction, `${example.id} 예시에 재구성 설명이 필요합니다.`);
    assert.ok(example.sourceMapId, `${example.id} 예시에 내부 출처 맵 ID가 필요합니다.`);
  });
  const serializedExamples = JSON.stringify(EXAMPLES);
  assert.equal(
    /(?:[A-Z]:\\|\.pdf\b|원본\s*파일)/i.test(serializedExamples),
    false,
    "공개 예시에 로컬 경로·PDF명 등 내부 출처 흔적이 남아 있습니다.",
  );

  const lifestyleExample = EXAMPLES.find(({ id }) => id === "proposal-lifestyle-app-launch");
  const lifestyleCreativeCards = lifestyleExample.cards.filter(([sectionId]) => sectionId === "creative");
  assert.ok(lifestyleCreativeCards.length >= 4, "생활형 앱 예시는 대표안·대안·제외안을 충분히 보여줘야 합니다.");
  assert.ok(lifestyleCreativeCards.some((card) => card[4] === "rejected" && card[5]), "제외안에는 제외 이유가 필요합니다.");

  const logicExample = createProject("authorFlow", "논리 점검 예시", "", "", EXAMPLES.find(({ id }) => id === "proposal-character-world"));
  const logicReview = buildLogicReview(logicExample);
  assert.ok(logicReview.checks.every(({ status }) => status === "connected"), "실제 제안서 기반 전략 예시는 모든 연결 점검을 통과해야 합니다.");
  assert.equal(logicReview.activityChains[0].card.activityPurpose, "relation");
  assert.ok(logicReview.activityChains[0].strategies.length > 0);

  ["proposal-retail-character-narrator", "proposal-fnb-social-renewal", "proposal-global-retail-social"].forEach((exampleId) => {
    const example = EXAMPLES.find(({ id }) => id === exampleId);
    const project = createProject(example.templateId, "논리 점검 예시", "", "", example);
    const review = buildLogicReview(project);
    assert.ok(review.checks.every(({ status }) => status === "connected"), `${exampleId} 예시는 모든 연결 점검을 통과해야 합니다.`);
    assert.ok(review.activityChains.every(({ card, strategies }) => card.nextAction && card.successSignal && strategies.length), `${exampleId}의 모든 활동은 전략·다음 행동·성공 신호와 연결되어야 합니다.`);
  });

  // 논리 연결 점검 3상태(연결됨/확인 필요/해당없음) — 템플릿이 활동·측정 단계를
  // 정의하지 않으면 카드가 없어도 "해당없음"이어야 하고, 정의하면(또는 사용자가
  // 직접 활동 카드를 추가하면) 실제 카드 기준으로 점검이 활성화되어야 한다.
  const checkStatus = (project, id) => buildLogicReview(project).checks.find((item) => item.id === id).status;

  ["quick", "ogilvy", "saatchi", "leo"].forEach((templateId) => {
    const blank = createProject(templateId, "빈 프로젝트", "", "");
    assert.equal(checkStatus(blank, "execution"), "not-applicable", `${templateId}는 활동 단계가 없어 전략-활동 연결이 해당없음이어야 합니다.`);
    assert.equal(checkStatus(blank, "journey"), "not-applicable", `${templateId}는 활동 단계가 없어 활동 점검이 해당없음이어야 합니다.`);
    assert.equal(checkStatus(blank, "measurement"), "not-applicable", `${templateId}는 측정 단계가 없어 성공 판단 근거가 해당없음이어야 합니다.`);
  });

  const jwtBlank = createProject("jwt", "빈 프로젝트", "", "");
  assert.equal(checkStatus(jwtBlank, "execution"), "not-applicable", "JWT는 활동 단계가 없어 전략-활동 연결이 해당없음이어야 합니다.");
  assert.notEqual(checkStatus(jwtBlank, "measurement"), "not-applicable", "JWT는 도달 여부(측정) 섹션이 있어 성공 판단 근거가 해당없음이면 안 됩니다.");

  const positioningBlank = createProject("positioning", "빈 프로젝트", "", "");
  assert.equal(checkStatus(positioningBlank, "execution"), "not-applicable", "포지셔닝은 기본 상태에서 활동 단계가 없어 해당없음이어야 합니다.");

  ["authorFlow", "campaignPlan"].forEach((templateId) => {
    const blank = createProject(templateId, "빈 프로젝트", "", "");
    assert.notEqual(checkStatus(blank, "execution"), "not-applicable", `${templateId}는 활동 단계가 정의되어 있어 전략-활동 연결 점검이 활성화되어야 합니다.`);
  });

  const activityCard = {
    id: "manual-activity", sectionId: "goal", role: "activity", title: "수동으로 추가한 활동", content: "",
    status: "candidate", links: [], activityPurpose: "", nextAction: "", successSignal: "",
  };
  const quickWithActivity = { ...createProject("quick", "활동 추가 프로젝트", "", ""), cards: [activityCard] };
  assert.notEqual(checkStatus(quickWithActivity, "execution"), "not-applicable", "활동 단계가 없는 템플릿도 활동 카드를 추가하면 전략-활동 점검이 활성화되어야 합니다.");
  assert.notEqual(checkStatus(quickWithActivity, "measurement"), "not-applicable", "활동 카드가 있으면 성공 판단 근거 점검도 함께 활성화되어야 합니다.");

  const quickWithArchivedActivity = { ...quickWithActivity, cards: [{ ...activityCard, status: "archived" }] };
  assert.equal(checkStatus(quickWithArchivedActivity, "execution"), "not-applicable", "활동 카드를 보관하면 활성 카드 기준으로 다시 해당없음이어야 합니다.");
  const quickWithRejectedActivity = { ...quickWithActivity, cards: [{ ...activityCard, status: "rejected" }] };
  assert.equal(checkStatus(quickWithRejectedActivity, "execution"), "not-applicable", "활동 카드를 제외하면 활성 카드 기준으로 다시 해당없음이어야 합니다.");

  console.log("데이터 검증 통과: 템플릿, 활동 구조, 예시 익명화·구체성, 논리 연결 3상태, v2 마이그레이션, 미상 섹션 카드 복구");
} finally {
  await server.close();
}
