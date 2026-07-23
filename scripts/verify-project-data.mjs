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

  // 예시는 "이 템플릿을 채우면 이렇게 된다"를 보여주는 템플릿 데모다.
  // blank(자유 보드)는 섹션을 사용자가 직접 정의하므로 예외이고,
  // 나머지 11개 템플릿은 정확히 1개씩 예시를 가져야 한다.
  const exampleCountByTemplate = new Map();
  EXAMPLES.forEach(({ templateId }) => exampleCountByTemplate.set(templateId, (exampleCountByTemplate.get(templateId) || 0) + 1));
  assert.ok(!exampleCountByTemplate.has("blank"), "자유 보드에는 예시를 두지 않습니다.");
  Object.keys(TEMPLATES).filter((id) => id !== "blank").forEach((id) => {
    assert.equal(exampleCountByTemplate.get(id), 1, `템플릿 ${id}의 예시는 정확히 1개여야 합니다 (현재 ${exampleCountByTemplate.get(id) || 0}개).`);
  });

  const serializedExamples = JSON.stringify(EXAMPLES);
  assert.equal(
    /(?:[A-Z]:\\|\.pdf\b|원본\s*파일|원\s*제안서|실제\s*제안서)/i.test(serializedExamples),
    false,
    "공개 예시에 로컬 경로·PDF명·원본 제안서 언급 등 출처 흔적이 남아 있습니다.",
  );

  // 예시는 대표안만 나열하는 폼이 아니라 선택의 근거를 보존하는 보드여야 한다:
  // 모든 예시에 제외 이유가 붙은 제외안이 최소 1장 있어야 한다.
  EXAMPLES.forEach((example) => {
    assert.ok(
      example.cards.some((card) => card[4] === "rejected" && card[5]),
      `${example.id} 예시에 제외 이유가 붙은 제외안이 없습니다.`,
    );
  });

  // 내장 예시는 논리 연결 점검에서 경고("확인 필요")가 하나도 나오면 안 된다.
  // 활동·측정 단계가 없는 템플릿은 해당 항목이 "해당 없음"으로 뜨는 것까지 허용.
  EXAMPLES.forEach((example) => {
    const project = createProject(example.templateId, "예시 점검", "", "", example);
    const review = buildLogicReview(project);
    const warned = review.checks.filter(({ status }) => status === "needs-review");
    assert.equal(warned.length, 0, `${example.id} 예시가 논리 점검 경고를 냅니다: ${warned.map(({ label }) => label).join(", ")}`);
  });

  const logicExample = createProject("authorFlow", "논리 점검 예시", "", "", EXAMPLES.find(({ id }) => id === "proposal-character-world"));
  const logicReview = buildLogicReview(logicExample);
  assert.ok(logicReview.checks.every(({ status }) => status === "connected"), "전략 전개형 예시는 모든 연결 점검을 통과해야 합니다.");
  assert.equal(logicReview.activityChains[0].card.activityPurpose, "relation");
  assert.ok(logicReview.activityChains[0].card.links.length > 0);

  ["proposal-fnb-social-renewal", "b2b-saas-trial-crm-roadmap", "proposal-office-brand-launch"].forEach((exampleId) => {
    const example = EXAMPLES.find(({ id }) => id === exampleId);
    const project = createProject(example.templateId, "논리 점검 예시", "", "", example);
    const review = buildLogicReview(project);
    assert.ok(review.checks.every(({ status }) => status === "connected"), `${exampleId} 예시는 모든 연결 점검을 통과해야 합니다.`);
    assert.ok(review.activityChains.every(({ card }) => card.nextAction && card.successSignal && card.links.length), `${exampleId}의 모든 활동은 논리 관계·다음 행동·성공 신호를 남겨야 합니다.`);
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

  // 캠페인 목표 필드 — 타깃과 목표가 프로젝트 레벨 필드로 저장되고, 옛 저장
  // 파일(goal 필드 없음)을 불러와도 빈 문자열로 안전하게 채워져야 한다.
  const goalExample = EXAMPLES.find(({ id }) => id === "proposal-software-launch");
  const projectWithGoal = createProject("quick", "목표 필드 테스트", "", "타깃 텍스트", goalExample);
  assert.equal(projectWithGoal.goal, goalExample.goal, "예시로 시작한 프로젝트는 예시의 goal 값을 그대로 가져와야 합니다.");
  const legacyWithoutGoal = normalizeImported({ ...projectWithGoal, goal: undefined });
  assert.equal(legacyWithoutGoal.goal, "", "goal 필드가 없는 옛 저장 파일도 빈 문자열로 정상 로드되어야 합니다.");

  // "타깃과 목표" 점검 — 판단 카드 존재가 아니라 타깃·목표 필드가 실제로
  // 채워졌는지만 본다. 카드가 하나도 없어도 두 필드만 채우면 통과해야 한다.
  const directionCheck = (project) => buildLogicReview(project).checks.find((item) => item.id === "direction");
  const noTargetNoGoal = createProject("quick", "방향 점검 테스트", "", "");
  assert.equal(directionCheck(noTargetNoGoal).status, "needs-review", "타깃·목표가 모두 비어 있으면 확인 필요여야 합니다.");
  const targetOnlyProject = { ...noTargetNoGoal, target: "타깃만 채움" };
  assert.equal(directionCheck(targetOnlyProject).status, "needs-review", "타깃만 있고 목표가 비어 있으면 여전히 확인 필요여야 합니다.");
  const targetAndGoalProject = { ...noTargetNoGoal, target: "타깃 채움", goal: "목표 채움" };
  assert.equal(directionCheck(targetAndGoalProject).status, "connected", "타깃과 목표를 모두 채우면 판단 카드 없이도 연결됨이어야 합니다.");

  // "활동 단계 작성" 점검 — 활동 카드가 판단 카드나 다른 활동 카드와 실제로
  // 연결됐는지는 더 이상 보지 않는다. 활동 역할 카드가 존재하기만 하면
  // 논리 관계(links) 유무와 무관하게 통과해야 한다.
  const activityWithoutRelation = { ...createProject("authorFlow", "활동 점검 테스트", "", ""), cards: [{ ...activityCard, links: [] }] };
  assert.equal(checkStatus(activityWithoutRelation, "execution"), "connected", "활동 카드에 논리 관계가 없어도 활동 카드가 존재하면 실행 단계 점검은 통과해야 합니다.");

  console.log("데이터 검증 통과: 템플릿, 활동 구조, 템플릿당 예시 1개(제외안 포함·점검 경고 없음), 논리 연결 3상태, v2 마이그레이션, 미상 섹션 카드 복구, 캠페인 목표 필드, 타깃·목표/활동 단계 점검 로직");
} finally {
  await server.close();
}
