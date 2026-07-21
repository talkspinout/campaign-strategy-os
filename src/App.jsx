import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Copy,
  FileText,
  FolderOpen,
  HelpCircle,
  Lightbulb,
  LayoutGrid,
  Link2,
  ListChecks,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

// 작성자 이름 — 사이트 소유자 브랜딩. 필요 시 여기만 바꾸면 전체에 반영됩니다.
const AUTHOR_NAME = "홍석";

const STORAGE_KEY = "campaign-strategy-os-v3";
const LEGACY_STORAGE_KEYS = ["campaign-strategy-os-v2"];
const SCHEMA_VERSION = 3;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const BACKUP_NUDGE_CARD_COUNT = 6;

const WORK_TYPES = [
  {
    id: "strategic-brief",
    number: "01",
    label: "전략 브리프",
    short: "핵심 선택을 한 장으로",
    desc: "타깃, 원하는 변화, 핵심 제안과 근거를 간결하게 정리합니다.",
    fit: "광고·브랜드 캠페인의 방향을 빠르게 합의할 때",
  },
  {
    id: "strategy-flow",
    number: "02",
    label: "전략 전개안",
    short: "관찰에서 전략과 실행까지",
    desc: "시장과 사용자의 관찰을 근거·해석·전략·실행으로 발전시킵니다.",
    fit: "생각의 과정과 제안 논리를 함께 정리할 때",
  },
  {
    id: "execution-plan",
    number: "03",
    label: "실행기획안",
    short: "전략을 실제 계획으로",
    desc: "정해진 전략을 활동, 채널, 일정, 예산과 KPI로 구체화합니다.",
    fit: "실행 팀과 활동의 역할·순서·측정 기준을 맞출 때",
  },
  {
    id: "blank",
    number: "04",
    label: "빈 보드",
    short: "나만의 방식으로",
    desc: "이미 자신의 방식이 있다면 섹션과 카드를 자유롭게 구성합니다.",
    fit: "정해진 프레임 없이 워크숍이나 초안을 시작할 때",
  },
];

const section = (id, title, prompt, desc, defaultRole = "note", kind = "thinking") => ({
  id,
  title,
  prompt,
  desc,
  defaultRole,
  kind,
});

const TEMPLATES = {
  quick: {
    id: "quick",
    typeId: "strategic-brief",
    label: `${AUTHOR_NAME} Quick Brief`,
    badge: "기본 추천",
    desc: "목표로 삼을 변화에서 캠페인 구조와 표현을 역산하는 다섯 질문입니다.",
    source: `${AUTHOR_NAME}의 실무 로직을 축약한 Campaign Strategy OS 기본형`,
    authorOriginal: true,
    sections: [
      section("goal", "목표 · 변화", "누가 무엇을 다르게 생각하거나 행동하면 성공인가요? 최종 결과와 선행 신호를 함께 적어보세요.", "타깃은 상단 캠페인 정보에 적습니다. 구매·가입 같은 결과지표와 브랜드 검색·상세페이지 방문·체험 신청 같은 선행지표를 구분하세요.", "decision"),
      section("mechanism", "캠페인 구조", "목표를 만들기 위해 사람을 어떤 흐름으로 움직여야 하나요?", "매체와 소재보다 먼저 작동 순서를 정합니다. 예: 가치 인지 → 근거 탐색 → 경험·비교 → 가입·구매.", "idea"),
      section("reference", "사례 · 근거", "같은 목표나 행동 흐름이 작동한 근거는 무엇인가요?", "사례 이름보다 타깃, 작동 원리, 확인된 결과, 우리에게 적용 가능한 조건을 기록합니다. 확인되지 않은 결과는 가설로 표시하세요.", "evidence"),
      section("creative", "크리에이티브", "이 구조를 타깃이 기억할 한 가지 생각과 경험으로 바꾸면 무엇인가요?", "핵심 약속 한 문장과 그것을 믿게 할 장면·콘텐츠를 연결합니다. 표현 후보는 브랜드 적합성, 타깃 맥락, 확인된 근거로 좁히세요.", "idea", "execution"),
      section("feasible", "실현 가능성", "전략의 핵심을 지키면서 현실에 맞게 무엇을 조정해야 하나요?", "반드시 유지할 것과 조정 가능한 목표·범위·일정·채널·제작 수준을 구분하고 예산·심의·측정 제약을 확인합니다.", "constraint"),
    ],
  },
  ogilvy: {
    id: "ogilvy",
    typeId: "strategic-brief",
    label: "오길비형 브리프",
    badge: "인식 변화",
    desc: "타깃의 생각·감정·행동과 브랜드 연결의 변화를 중심으로 봅니다.",
    source: "공개된 Ogilvy 계열 문항을 바탕으로 현대적으로 재구성",
    sections: [
      section("background", "기획 배경", "기획 배경은 무엇인가요?", "시장과 브랜드의 출발 상황을 적습니다.", "observation"),
      section("audience", "대화 상대", "우리는 누구에게 말할 것인가요?", "그들의 맥락과 현재 상태를 구체적으로 적습니다.", "observation"),
      section("effect", "원하는 영향", "생각·감정·행동·브랜드 연결에 어떤 영향을 주고자 하나요?", "현재와 원하는 상태를 대비합니다.", "decision"),
      section("thought", "핵심 사상", "반드시 남겨야 할 핵심 사상이나 인상은 무엇인가요?", "표현보다 먼저 남겨야 할 생각을 정합니다.", "decision"),
      section("belief", "믿을 이유", "그들은 왜 우리의 제안을 믿어야 하나요?", "제품 사실, 데이터, 사례를 적습니다.", "evidence"),
      section("other", "기타 중요사항", "그 밖에 반드시 고려해야 할 것은 무엇인가요?", "톤, 심의, 일정과 필수사항을 기록합니다.", "constraint"),
    ],
  },
  saatchi: {
    id: "saatchi",
    typeId: "strategic-brief",
    label: "사치&사치형 브리프",
    badge: "단일 제안",
    desc: "캠페인의 요구사항과 단일한 가치 제안을 선명하게 정리합니다.",
    source: "공개된 Saatchi & Saatchi 계열 항목을 바탕으로 현대적으로 재구성",
    sections: [
      section("requirement", "캠페인 요구", "캠페인이 반드시 달성하거나 해결해야 하는 것은 무엇인가요?", "비즈니스 요구와 커뮤니케이션 과제를 구분합니다.", "decision"),
      section("audience-current", "타깃의 현재", "타깃은 누구이며 현재 무엇을 생각하고 행동하나요?", "관찰된 현재 행동과 생각을 적습니다.", "observation"),
      section("single-proposition", "단일 제안", "절대 잊어서는 안 되는 단 하나의 제안은 무엇인가요?", "여러 장점을 하나의 가치로 좁힙니다.", "decision"),
      section("substantiation", "제안의 근거", "그 제안을 뒷받침하는 근거는 무엇인가요?", "제품 사실, 데이터, 고객 증언을 구분합니다.", "evidence"),
      section("mandatory", "필수 포함사항", "반드시 포함하거나 지켜야 할 사항은 무엇인가요?", "표기, 오퍼, 법무와 채널 규격을 적습니다.", "constraint"),
    ],
  },
  jwt: {
    id: "jwt",
    typeId: "strategic-brief",
    label: "JWT T-Plan형",
    badge: "전략 이동",
    desc: "현재 위치에서 목표 위치로 이동하는 전략 논리를 점검합니다.",
    source: "JWT T-Plan 대표 질문 구조를 바탕으로 현대적으로 재구성",
    sections: [
      section("where", "현재 위치", "우리는 현재 어디에 있나요?", "브랜드와 타깃의 현재 관계를 사실 중심으로 적습니다.", "observation"),
      section("why", "현재의 원인", "왜 현재 그 위치에 있나요?", "행동 장벽과 경쟁 상황의 원인을 적습니다.", "interpretation"),
      section("could", "가능한 위치", "우리는 어디에 위치할 수 있나요?", "현실적이면서 의미 있는 목표 상태를 적습니다.", "decision"),
      section("how", "이동 방법", "그곳에 어떻게 도달할 수 있나요?", "제안과 실행 원리를 연결합니다.", "idea", "execution"),
      section("arrival", "도달 여부", "우리가 그곳에 도달하고 있는지 어떻게 확인할까요?", "브랜드와 행동 지표를 함께 적습니다.", "measurement", "measurement"),
    ],
  },
  leo: {
    id: "leo",
    typeId: "strategic-brief",
    label: "레오버넷형 브리프",
    badge: "행동 변화",
    desc: "타깃의 현재 상태와 원하는 생각·행동의 변화를 중심으로 설계합니다.",
    source: "공개된 Leo Burnett 계열 문항을 바탕으로 현대적으로 재구성",
    sections: [
      section("why-ad", "새 캠페인의 이유", "왜 새로운 광고나 캠페인이 필요한가요?", "기존 커뮤니케이션으로 해결되지 않은 문제를 적습니다.", "observation"),
      section("target", "타깃", "우리의 핵심 타깃은 누구인가요?", "행동과 상황을 중심으로 한 사람처럼 묘사합니다.", "observation"),
      section("current", "현재 생각 · 행동", "타깃은 현재 무엇을 생각하고, 알고, 행동하나요?", "추측과 확인된 사실을 구분합니다.", "observation"),
      section("desired", "원하는 생각 · 행동", "그들이 어떻게 생각하고 행동하기를 바라나요?", "관찰 가능한 변화를 적습니다.", "decision"),
      section("change-driver", "변화의 동력", "무엇이 그 변화를 만들 가능성이 가장 높은가요?", "메시지, 경험, 증거 또는 아이디어를 적습니다.", "idea"),
    ],
  },
  authorFlow: {
    id: "authorFlow",
    typeId: "strategy-flow",
    label: `${AUTHOR_NAME} 전략 전개형 브리프`,
    badge: `${AUTHOR_NAME} 오리지널`,
    desc: "관찰 → 해석 → 검증 → 전략 구조 → 메시지 → 동선. 원칙: 한 카드 = 주장 한 줄 + 그것을 믿게 하는 근거.",
    source: "실제 기획 작업의 사고 흐름을 익명화·구조화한 오리지널 템플릿",
    authorOriginal: true,
    sections: [
      section("situation", "관찰 · 상황", "시장과 사용자에게 지금 어떤 일이 일어나고 있나요?", "주장보다 먼저 확인된 사실과 행동을 적고, 출처가 있는 정보와 아직 확인할 가정을 구분합니다.", "observation"),
      section("meaning", "해석 · 가설", "왜 이런 일이 벌어지며, 우리에게 어떤 기회가 생기나요?", "관찰을 '왜?'로 밀어붙여 전략적 의미를 뽑습니다. 사실을 반복하지 말고 우리가 검증할 해석을 한 문장으로 적으세요.", "interpretation"),
      section("reference", "사례 · 검증", "이 해석을 지지하거나 반박하는 사례와 근거는 무엇인가요?", "경쟁사를 따라가기보다 타깃, 작동 원리, 결과, 적용 조건을 비교해 가설을 검증합니다.", "evidence"),
      section("asset", "자산 · 가능성", "우리가 실제로 활용할 수 있고 말할 자격이 있는 자산은 무엇인가요?", "제품 사실, 브랜드 자산, 파트너, 공간, 콘텐츠처럼 전략을 현실화할 수 있는 것을 적습니다. 해당 사항이 없다면 억지로 채우지 않습니다.", "evidence"),
      section("choice", "전략 구조 · 선택", "목표를 이루기 위한 2~3개의 전략 축은 무엇이며, 각 축은 어떤 역할을 맡나요?", "전략 축과 역할을 정하고 무엇을 하지 않을지도 기록합니다. 활동이나 채널 이름만 나열하지 마세요.", "decision"),
      section("defense", "반론 · 검증", "이 전략은 정말 통하나요? 예상 반론과 현실적 장벽에 무엇으로 답하나요?", "스스로 가장 아픈 질문을 던지고 사례·데이터로 방어합니다. 인지도·예산 같은 외부 제약도 여기에 적습니다.", "evidence"),
      section("concept", "컨셉 · 메시지", "이 선택을 타깃이 기억할 한 줄의 말로 바꾸면 무엇인가요?", "키워드 → 핵심 메시지 → 슬로건 후보 순으로 좁힙니다.", "decision"),
      section("action", "실행 · 동선", "타깃의 여정 또는 시기 순서로 활동을 어떻게 배치하나요?", "활동 나열이 아니라 인지→행동, 초기→확장의 순서로 적습니다.", "activity", "execution"),
    ],
  },
  positioning: {
    id: "positioning",
    typeId: "strategy-flow",
    label: "브랜드 포지셔닝 전략 전개안",
    badge: "브랜드 전략",
    desc: "시장과 경쟁의 변화에서 브랜드가 차지할 고유한 위치를 찾습니다.",
    source: "[이름] 전략 전개형 브리프의 브랜드 포지셔닝 변형",
    sections: [
      section("market", "시장 변화", "고객의 선택 기준과 시장의 언어는 어떻게 변하고 있나요?", "변화의 방향을 관찰합니다.", "observation"),
      section("competition", "경쟁 구도", "경쟁자는 어떤 가치와 위치를 차지하고 있나요?", "제품 기능을 넘어 인식의 지도를 봅니다.", "evidence"),
      section("asset", "브랜드 자산", "우리만 말할 수 있는 사실과 자산은 무엇인가요?", "브랜드의 말할 자격을 찾습니다.", "evidence"),
      section("target", "타깃 · 긴장", "누구의 어떤 고민과 욕구를 해결할 수 있나요?", "타깃의 현실적인 긴장을 적습니다.", "interpretation"),
      section("position", "포지셔닝 선택", "어떤 기준점과 차별점으로 기억되고 싶나요?", "선택할 위치와 버릴 위치를 함께 적습니다.", "decision"),
      section("expression", "메시지 · 실행", "그 위치를 어떤 메시지와 경험으로 증명할까요?", "콘텐츠, 캠페인, 미디어로 연결합니다.", "idea", "execution"),
    ],
  },
  serviceGrowth: {
    id: "serviceGrowth",
    typeId: "strategy-flow",
    label: "서비스 성장 전략 전개안",
    badge: "사용자 성장",
    desc: "사용자 행동과 제품 기능을 연결해 활성화·리텐션 전략을 설계합니다.",
    source: "[이름] 전략 전개형 브리프의 서비스 성장 변형",
    sections: [
      section("opportunity", "시장 · 행동 기회", "기존 서비스가 채우지 못하는 사용자 행동은 무엇인가요?", "대체 행동과 빈틈을 관찰합니다.", "observation"),
      section("asset", "제품의 특화점", "사용자의 생활에 들어갈 수 있는 기능과 자산은 무엇인가요?", "기능을 사용 상황과 연결합니다.", "evidence"),
      section("cycle", "사용자 사이클", "사용자가 처음 들어와 반복 사용하기까지 어떤 행동을 하나요?", "활성화와 반복의 흐름을 그립니다.", "interpretation"),
      section("hypothesis", "성장 가설", "어떤 장치가 습관과 리텐션을 만들 것이라고 보나요?", "아직 확인하지 않은 가정을 명시합니다.", "hypothesis"),
      section("reference", "참고 사례", "유사한 행동을 만든 서비스는 무엇을 했나요?", "결과보다 작동 원리를 봅니다.", "evidence"),
      section("priority", "우선순위 선택", "이번 단계에서 먼저 검증할 한 가지는 무엇인가요?", "하지 않을 것까지 정합니다.", "decision"),
      section("growth-action", "활동 · 측정", "사용자를 움직일 활동과 성공 기준은 무엇인가요?", "마케팅 활동과 제품 지표를 연결합니다.", "activity", "execution"),
    ],
  },
  campaignPlan: {
    id: "campaignPlan",
    typeId: "execution-plan",
    label: "통합 캠페인 실행기획안",
    badge: "캠페인 운영",
    desc: "전략을 활동·채널·일정·예산·측정 계획으로 전환합니다.",
    source: "광고·마케팅 캠페인을 위한 범용 실행 구조",
    sections: [
      section("goal", "실행 목표", "이번 실행에서 반드시 달성해야 할 결과는 무엇인가요?", "전략과 연결된 실행 목표를 적습니다.", "decision"),
      section("message", "대표 전략 · 메시지", "모든 활동이 공유해야 할 중심 방향은 무엇인가요?", "실행이 흔들리지 않을 기준을 둡니다.", "decision"),
      section("activities", "핵심 활동", "어떤 활동이 어떤 역할을 맡나요?", "활동을 나열하기보다 역할을 적습니다.", "activity", "execution"),
      section("channel", "콘텐츠 · 채널", "어떤 소재를 어디에서 전달하나요?", "소재와 채널의 역할을 연결합니다.", "activity", "execution"),
      section("schedule", "일정 · 담당", "누가 언제 무엇을 완료해야 하나요?", "선행 작업과 승인 관계를 적습니다.", "activity", "execution"),
      section("budget", "예산 · 제약", "예산과 제작·심의의 한계는 무엇인가요?", "실행 가능한 범위를 확인합니다.", "constraint"),
      section("kpi", "KPI · 회고", "무엇을 측정하고 언제 판단할까요?", "성과와 학습 기준을 적습니다.", "measurement", "measurement"),
    ],
  },
  contentPlan: {
    id: "contentPlan",
    typeId: "execution-plan",
    label: "콘텐츠 · SNS 실행기획안",
    badge: "콘텐츠 운영",
    desc: "콘텐츠 목표, 주제, 포맷, 채널 역할과 발행 계획을 정리합니다.",
    source: "콘텐츠·소셜 운영을 위한 범용 실행 구조",
    sections: [
      section("objective", "콘텐츠 목표", "콘텐츠가 만들 반응과 행동은 무엇인가요?", "조회보다 목적을 먼저 정합니다.", "decision"),
      section("audience", "타깃 반응", "누가 어떤 상황에서 반응해야 하나요?", "콘텐츠 소비 맥락을 적습니다.", "observation"),
      section("theme", "주제 · 메시지", "반복해서 다룰 주제와 메시지는 무엇인가요?", "콘텐츠 축을 정합니다.", "idea"),
      section("format", "포맷 · 채널", "어떤 포맷을 어떤 채널에서 운영할까요?", "채널별 역할을 구분합니다.", "activity", "execution"),
      section("calendar", "발행 · 제작", "언제 누가 만들고 승인하나요?", "제작과 발행의 흐름을 적습니다.", "activity", "execution"),
      section("metric", "성과 · 테스트", "무엇을 비교하고 다음에 어떻게 개선할까요?", "성과지표와 테스트 후보를 둡니다.", "measurement", "measurement"),
    ],
  },
  crmPlan: {
    id: "crmPlan",
    typeId: "execution-plan",
    label: "CRM · 서비스 활성화 기획안",
    badge: "활성화·리텐션",
    desc: "목표 행동, 세그먼트, 메시지, 노출 시점과 리텐션 지표를 연결합니다.",
    source: "서비스 활성화와 CRM 운영을 위한 범용 실행 구조",
    sections: [
      section("behavior", "목표 행동", "사용자가 반복해야 할 핵심 행동은 무엇인가요?", "제품 가치와 연결된 행동을 정합니다.", "decision"),
      section("barrier", "사용자 장벽", "그 행동을 하지 않는 이유는 무엇인가요?", "행동·이해·신뢰의 장벽을 적습니다.", "observation"),
      section("trigger", "촉발 장치", "어떤 계기와 보상이 행동을 시작하게 하나요?", "메시지와 제품 장치를 함께 봅니다.", "hypothesis"),
      section("segment", "세그먼트 · 시점", "누구에게 언제 노출해야 하나요?", "사용 상태와 타이밍을 구분합니다.", "activity", "execution"),
      section("journey", "메시지 · 동선", "첫 행동부터 반복까지 어떤 메시지를 보내나요?", "단계별 경험을 연결합니다.", "activity", "execution"),
      section("retention", "전환 · 리텐션", "성공을 어떤 행동과 지표로 확인할까요?", "단기 전환과 장기 유지 지표를 함께 봅니다.", "measurement", "measurement"),
    ],
  },
  blank: {
    id: "blank",
    typeId: "blank",
    label: "자유 보드",
    badge: "완전 자유",
    desc: "하나의 빈 섹션에서 시작해 필요한 만큼 확장합니다.",
    source: "질문과 구조를 강제하지 않는 자유 형식",
    sections: [section("free", "자유 섹션", "", "섹션 이름과 질문을 직접 바꿀 수 있습니다.", "note")],
  },
};

const EXAMPLES = [
  {
    id: "proposal-software-launch",
    typeId: "strategic-brief",
    templateId: "quick",
    title: "B2B 설계 서비스 런칭 브리프 사례",
    target: "도입 비용과 학습 부담을 낮추려는 설계 실무자와 예비 사용자",
    basis: "실제 제안 구조 기반 · 익명 재구성",
    anonymization: "브랜드·제품명·파트너·고유 카피·수치를 재구성했으며 실제 성과는 포함하지 않았습니다.",
    reconstruction: "런칭 단계, 제품 이해 콘텐츠, 리뷰·검색의 역할만 유지하고 소재명과 표현은 새로 작성했습니다.",
    sourceMapId: "software-launch",
    desc: "제품 이해에서 사이트 탐색, 이벤트 참여, 가입·사용으로 이어지는 런칭 제안의 핵심 구조",
    cards: [
      ["goal", "decision", "인지에서 가입·사용까지 이어지는 초기 수요 신호 확보", "제품 인지만 따로 보지 않고 브랜드명 검색과 사이트 유입을 선행 신호로, 이벤트 참여와 가입·사용을 결과 신호로 구분한다.", "selected"],
      ["mechanism", "idea", "제품 이해 → 사이트 탐색 → 이벤트 참여 → 가입·사용", "튜토리얼과 핵심 효익 콘텐츠로 이해를 만들고, 사이트와 이벤트를 거쳐 실제 사용으로 이어지는 순서를 설계한다.", "selected"],
      ["reference", "evidence", "전문 사용자 리뷰가 도입 불안을 낮출 수 있다는 가설", "전문 커뮤니티의 실사용 리뷰를 참고 구조로 삼되, 실제 전환 효과는 집행 전 검증이 필요한 가설로 구분한다.", "candidate", "", { linksToSections: [{ sectionId: "goal", type: "supports" }] }],
      ["creative", "idea", "대표안 · 작업 전후를 한 화면에서 비교하는 실무 숏폼", "타깃 상황 · 새 도구의 학습 시간을 걱정하는 실무자\n시각 장치 · 같은 작업의 기존 과정과 단축된 과정을 좌우로 비교\n화자·톤 · 과장 없이 설명하는 동료 실무자\n포맷 · 20초 화면 녹화 + 저장용 체크리스트\n핵심 메시지 · 도구보다 달라지는 작업 과정을 먼저 확인하세요.\nCTA · 내 작업과 비슷한 예시 확인 → 체험 신청", "selected"],
      ["creative", "idea", "대안 · 기능명이 아닌 실무 질문으로 시작하는 카드 시리즈", "샘플 소재 · ‘수정 요청이 반복될 때 먼저 확인할 세 가지’\n시각 장치 · 질문–기존 방식–새 방식의 3단 카드\n역할 · 검색과 공유를 통해 상세 페이지로 이동시키는 검토용 콘텐츠", "candidate"],
      ["creative", "idea", "제외안 · 유명 인물 중심의 대형 바이럴", "초기 제품 이해와 사용 증명보다 인물 화제성이 앞설 가능성이 높다. 제한된 예산에서 학습 장벽을 낮춘다는 목표와 직접 연결되기 어렵다.", "rejected", "전략 방향과 불일치"],
      ["feasible", "constraint", "제품 화면·전문가 섭외·이벤트 랜딩이 선행 조건", "핵심 구조는 유지하되 제작 물량과 매체 범위를 조정한다. 제품 자료 확정, 리뷰 일정, 랜딩 제작과 심의 의존 관계를 먼저 확인한다.", "selected"],
    ],
  },
  {
    id: "proposal-lifestyle-app-launch",
    typeId: "strategic-brief",
    templateId: "quick",
    title: "생활형 앱 런칭 브리프 사례",
    target: "필요할 때마다 여러 채널을 오가며 생활 정보를 찾는 모바일 사용자",
    basis: "복수 실제 제안 구조 기반 · 익명 재구성",
    anonymization: "앱·기업·크리에이터 이름, 원문 제목, 해시태그와 목표 수치를 모두 일반화했습니다.",
    reconstruction: "사전–런칭–활성화 단계와 기능·사용 장면·후기의 콘텐츠 역할을 조합하고 크리에이티브는 새로 작성했습니다.",
    sourceMapId: "lifestyle-app-launch",
    desc: "기능 소개를 실제 생활 장면과 사용 증명으로 바꿔 설치와 첫 사용까지 연결한 런칭 구조",
    cards: [
      ["goal", "decision", "앱을 아는 것에서 첫 저장·첫 사용까지 이동", "도달과 설치만으로 끝내지 않는다. 기능 이해와 상세 페이지 탐색을 선행 신호로, 설치 후 첫 저장 또는 첫 실행을 결과 신호로 본다.", "selected"],
      ["mechanism", "idea", "생활 문제 발견 → 해결 장면 확인 → 앱 탐색 → 첫 행동", "익숙한 불편을 먼저 보여주고, 실제 화면으로 해결 과정을 증명한 뒤, 저장해 둔 정보를 앱에서 바로 써보게 한다.", "selected"],
      ["reference", "evidence", "사용 장면이 분명한 후기와 검색형 가이드를 함께 검증", "후기 자체의 화제성보다 어떤 문제를 어떤 기능으로 해결했는지, 검색 이후 앱 탐색과 첫 행동으로 이어졌는지를 확인한다.", "candidate", "", { linksToSections: [{ sectionId: "goal", type: "supports" }] }],
      ["creative", "idea", "대표안 · 냉장고 속 세 가지에서 시작하는 저장형 가이드", "타깃 상황 · 재료는 있지만 무엇을 할지 결정하기 어려운 저녁\n시각 장치 · 재료 아이콘 세 개가 앱 화면의 선택지로 바뀌는 과정\n화자·톤 · 빠르게 판단 기준을 주는 생활 에디터\n포맷 · 카드 6장 + 실제 화면 짧은 영상\n샘플 제목 · ‘오늘 가진 것으로 고르는 저녁 기준’\nCTA · 가이드 저장 → 앱에서 내 조건으로 다시 찾기", "selected"],
      ["creative", "idea", "대안 · 검색부터 목록 저장까지 한 번에 보여주는 화면 숏폼", "첫 3초에 검색 피로를 보여주고 실제 화면에서 조건 선택, 결과 비교, 목록 저장까지 끊김 없이 시연한다. 기능 설명 자막은 행동마다 한 문장만 사용한다.", "candidate"],
      ["creative", "idea", "대안 · 주말 한 끼 기록 챌린지", "사용자가 자신만의 선택 기준과 결과를 짧게 기록하도록 하고, 앱 안의 동일한 기능을 체험 진입점으로 연결한다. 참여 수보다 설치 후 첫 행동을 함께 확인한다.", "candidate"],
      ["creative", "idea", "제외안 · 혜택만 강조하는 대규모 설치 이벤트", "혜택 종료 후 사용 이유가 남지 않고 기능 이해를 증명하지 못한다. 프로모션은 첫 행동을 보조하는 범위에서만 사용한다.", "rejected", "전략 방향과 불일치"],
      ["feasible", "constraint", "실제 화면·검색 시나리오·후기 검수 범위를 먼저 확정", "촬영 전에 공개 가능한 기능과 데이터 상태를 확인한다. 크리에이터 수보다 대표 사용 장면의 완성도를 우선하고, 운영 여건에 따라 대안 소재 수를 조정한다.", "selected"],
    ],
  },
  {
    id: "proposal-character-world",
    typeId: "strategy-flow",
    templateId: "authorFlow",
    title: "캐릭터 세계관 강화 전략 사례",
    target: "캐릭터의 설정을 해석하고 현실 경험으로 확장하는 Z·알파세대 팬",
    basis: "복수 실제 제안 구조 기반 · 익명 재구성",
    anonymization: "캐릭터·아티스트·공간·캠페인명과 고유 세계관 설정을 제거하고 역할 구조만 남겼습니다.",
    reconstruction: "세계관 소비 행동과 캐릭터 운영 사례를 합성했으며 콘텐츠 제목과 참여 장치는 새로 작성했습니다.",
    sourceMapId: "character-world",
    desc: "디지털 세대의 세계관 소비 행동을 세 단계 콘텐츠·경험 구조로 발전시킨 제안",
    cards: [
      ["situation", "observation", "팬은 세계관을 분석하고 몰입하며 현실에 적용한다", "설정과 서사를 해석하는 데서 끝나지 않고 캐릭터의 행동과 공간을 현실 경험으로 옮기며 관계를 강화한다.", "selected"],
      ["meaning", "interpretation", "설명보다 몰입의 다음 행동을 설계해야 한다", "성격과 서사를 이해시키고, 현실에서 만나게 하고, 직접 소통하게 해야 세계관이 지속적인 팬 관계로 확장될 수 있다는 가설이다.", "selected"],
      ["reference", "evidence", "유사 IP의 현실 확장 사례는 추가 검증이 필요", "원 제안서는 타깃 행동 해석이 중심이며 경쟁 사례와 성과 근거는 제한적이다. 비교 사례를 보강할 때는 화제성보다 참여와 관계 지속 여부를 확인한다.", "candidate", "", { linksToSections: [{ sectionId: "choice", type: "supports" }] }],
      ["asset", "evidence", "아티스트·음악·공간·일상을 연결할 수 있는 실제 자산", "보유한 문화 자산과 캐릭터의 장소·취향·일상 설정을 콘텐츠와 오프라인 경험으로 확장할 수 있다.", "selected"],
      ["choice", "decision", "서사 이해 · 현실 체험 · 관계 강화의 세 축", "각 축은 캐릭터의 매력 이해, 현실에서의 경험, 소통과 보상이라는 다른 역할을 맡는다. 채널보다 역할 구조를 먼저 정한다.", "selected", "", { linksToSections: [{ sectionId: "action", type: "executes" }] }],
      ["defense", "evidence", "일회성 화제에 그치지 않도록 관계 장치를 남긴다", "현장 경험 이후 질문·기록·보상으로 이어지는 접점을 두고, 조회보다 참여와 재방문 신호를 확인해야 한다.", "candidate"],
      ["concept", "decision", "캐릭터의 세계가 현실의 일상으로 들어온다", "서사를 설명하는 데서 끝내지 않고 팬이 직접 발견하고 만나고 대화하는 경험으로 핵심 메시지를 증명한다.", "selected"],
      ["action", "activity", "대표 실행 · 캐릭터의 선택을 따라가는 월간 에피소드", "상황 · 캐릭터가 매달 하나의 현실 고민을 선택한다.\n표현 · 짧은 서사 영상 뒤 선택 투표와 후속 기록을 연결한다.\n샘플 소재 · ‘이번 달, 이 캐릭터가 먼저 포기할 것은?’", "selected", "", { activityPurpose: "relation", activityMethod: "owned-content", nextAction: "에피소드 시청 후 선택 투표와 후속 이야기 확인으로 이동", successSignal: "후속 편 재방문과 선택 이유 댓글이 이어짐", linksToSections: [{ sectionId: "choice", type: "executes" }] }],
      ["action", "activity", "대안 실행 · 현실 공간에서 발견하는 캐릭터의 흔적", "캐릭터가 좋아할 법한 장소와 물건을 실제 촬영으로 기록하고, 팬이 같은 장소에서 자신의 버전을 남기게 한다. 세계관 설명보다 발견과 재해석을 유도한다.", "candidate", "", { activityPurpose: "experience", activityMethod: "experience-event", nextAction: "콘텐츠에서 장소 정보 확인 후 방문·기록 참여로 이동", successSignal: "현장 기록과 자발적 위치 공유가 후속 콘텐츠로 이어짐", linksToSections: [{ sectionId: "choice", type: "executes" }] }],
      ["action", "activity", "대안 실행 · 팬이 고르는 디지털 소품 오디션", "여러 소품 후보를 보여주고 팬이 캐릭터에게 어울리는 안을 선택한다. 선정 결과는 배경화면이나 프로필 장식처럼 바로 사용할 수 있는 보상으로 돌려준다.", "candidate", "", { activityPurpose: "relation", activityMethod: "crm-community", nextAction: "투표 후 결과 공개와 디지털 보상 수령으로 이동", successSignal: "결과 확인 재방문과 보상 사용·공유가 발생", linksToSections: [{ sectionId: "choice", type: "executes" }] }],
      ["action", "idea", "제외안 · 설정을 한 번에 설명하는 장편 세계관 영상", "초기 이해에는 도움이 될 수 있지만 팬의 선택과 재방문 행동을 만들기 어렵다. 핵심 설정은 에피소드와 참여 과정에서 단계적으로 공개한다.", "rejected", "전략 방향과 불일치"],
    ],
  },
  {
    id: "proposal-retail-character-narrator",
    typeId: "strategy-flow",
    templateId: "authorFlow",
    title: "유통 브랜드 캐릭터 화자 전략 사례",
    target: "상품 정보는 빠르게 보고 싶지만 브랜드 채널의 일방적인 홍보에는 반응하지 않는 생활 소비자",
    basis: "복수 실제 제안 구조 기반 · 익명 재구성",
    anonymization: "유통사·캐릭터·작가·모델·상품명과 원문 말투를 모두 일반화했습니다.",
    reconstruction: "브랜드 에디터와 마스코트의 역할 분담, 반복 시리즈와 참여 형식을 조합해 새 사례로 구성했습니다.",
    sourceMapId: "retail-character-narrator",
    desc: "정보형 화자와 관계형 마스코트가 서로 다른 일을 맡아 채널의 일관성과 친밀도를 만드는 구조",
    cards: [
      ["situation", "observation", "공식 계정의 상품 정보는 필요하지만 말투는 쉽게 광고처럼 보인다", "혜택과 상품 정보만 반복하면 접근성은 높아도 계정을 계속 볼 이유가 약하다. 반대로 캐릭터만 강조하면 구매 판단에 필요한 정보가 사라질 수 있다.", "selected"],
      ["meaning", "interpretation", "하나의 캐릭터에게 모든 역할을 맡기지 않는다", "전문 정보와 생활 공감은 서로 다른 신뢰를 요구한다. 역할이 다른 두 화자를 두되 같은 세계관 규칙과 시각 체계로 묶는 편이 지속 가능하다는 가설이다.", "selected"],
      ["reference", "evidence", "캐릭터 운영 방식은 제작 지속성과 참여 깊이로 비교", "유명도나 단기 반응보다 월별 제작 가능성, 소재 확장성, 팬이 선택에 개입할 여지가 있는지를 기준으로 검토한다.", "candidate", "", { linksToSections: [{ sectionId: "choice", type: "supports" }] }],
      ["asset", "evidence", "상품 지식·매장 공간·직원 경험·시즌 이슈", "브랜드가 이미 가진 정보와 장소를 캐릭터의 관찰 대상과 행동 무대로 바꿀 수 있다. 새 세계관을 만들기 전에 반복 활용 가능한 자산을 확인한다.", "selected"],
      ["choice", "decision", "정보를 정리하는 에디터와 관계를 만드는 마스코트", "에디터는 선택 기준과 혜택을 간결하게 설명하고, 마스코트는 일상 공감·장소 탐험·질문과 투표를 맡는다. 두 역할이 같은 게시물에서 경쟁하지 않게 한다.", "selected"],
      ["defense", "evidence", "캐릭터가 상품 정보를 가리는 위험을 운영 원칙으로 제어", "게시 전 ‘이 콘텐츠의 주인공이 정보인지 관계인지’를 하나만 선택한다. 정보 카드에는 판단 기준을, 관계 카드에는 참여 행동을 반드시 남긴다.", "selected"],
      ["concept", "decision", "필요한 정보는 또렷하게, 다시 찾을 이유는 친근하게", "브랜드를 사람처럼 꾸미는 것이 아니라 소비자가 정보를 이해하고 관계를 이어가는 두 가지 이유를 분리해 설계한다.", "selected"],
      ["action", "activity", "대표 실행 · 살까 말까를 함께 정리하는 선택 투표", "에디터가 장점·적합한 상황·주의점을 정리하고 마스코트가 마지막 질문을 던진다. 찬반 투표 뒤 결과와 선택 기준을 후속 카드로 공개한다.", "selected", "", { activityPurpose: "understand", activityMethod: "owned-content", nextAction: "투표 후 자신의 선택 기준을 댓글로 남기고 후속 결과를 확인", successSignal: "저장·투표뿐 아니라 선택 이유 댓글과 후속 편 재방문이 발생", linksToSections: [{ sectionId: "choice", type: "executes" }] }],
      ["action", "activity", "대안 실행 · 캐릭터의 매장 밖 하루 기록", "실물 소품이나 합성 이미지를 활용해 계절·지역·생활 장면을 탐험하고, 팬이 다음 장소를 제안하게 한다.", "candidate", "", { activityPurpose: "relation", activityMethod: "owned-content", nextAction: "장소 제안과 다음 편 확인으로 이동", successSignal: "연속 에피소드 재방문과 자발적 장소 제안이 이어짐", linksToSections: [{ sectionId: "choice", type: "executes" }] }],
      ["action", "activity", "대안 실행 · 팬이 완성하는 프로필 장식", "색상·표정·소품을 선택해 자신만의 버전을 만들고 결과를 공유한다. 선정안을 실제 공식 프로필 장식으로 한시 적용한다.", "candidate", "", { activityPurpose: "experience", activityMethod: "promotion-offer", nextAction: "조합 만들기 후 결과 공유와 선정안 확인으로 이동", successSignal: "완성본 공유와 결과 발표 재방문이 함께 발생", linksToSections: [{ sectionId: "choice", type: "executes" }] }],
    ],
  },
  {
    id: "anonymous-service-growth",
    typeId: "strategy-flow",
    templateId: "serviceGrowth",
    title: "생활 서비스 성장 · 반복 사용 전략 사례",
    basis: "학습용 가상 사례",
    desc: "제품 기능을 사용자 습관과 리텐션 가설로 연결하는 작성 형식 예시",
    cards: [
      ["opportunity", "observation", "기본 메신저만으로 채워지지 않는 생활 동선", "사용자는 콘텐츠 공유, 자료 보관, 관심사 모임을 위해 여러 서비스를 함께 쓴다는 관찰에서 시작한다.", "selected"],
      ["asset", "evidence", "알림·앨범·일정을 연결할 수 있는 기능", "단일 기능보다 일상 속 반복 접점을 만들 수 있는 제품 자산이 있다는 가정이다.", "selected"],
      ["cycle", "interpretation", "첫 가입보다 반복 행동의 이유가 중요", "사용자가 처음 들어온 뒤 다시 돌아오는 계기를 행동 단계로 구분한다.", "selected"],
      ["hypothesis", "hypothesis", "작은 보상이 반복 사용을 촉발할 수 있다", "아직 확인되지 않은 가설이며 활성화율과 반복 행동률로 검증해야 한다.", "candidate"],
      ["reference", "evidence", "유사 행동을 만든 서비스의 작동 원리 확인", "혜택의 크기보다 진입 계기와 반복 사용 이유가 어떻게 연결됐는지 공개 자료로 확인한다.", "candidate", "", { linksToSections: [{ sectionId: "priority", type: "supports" }] }],
      ["priority", "decision", "첫 단계에서는 하나의 반복 행동만 검증", "모든 기능을 동시에 알리기보다 알림 이후 핵심 행동 하나를 우선 확인한다.", "selected", "", { linksToSections: [{ sectionId: "growth-action", type: "executes" }] }],
      ["growth-action", "activity", "초기 진입 → 첫 행동 → 반복 사용 촉진", "모집, 제품 내 안내, CRM의 역할을 나누고 다음 행동과 성공 신호를 붙인다.", "candidate", "", { activityPurpose: "relation", activityMethod: "crm-community", nextAction: "첫 행동을 완료한 사용자가 정해진 기간 안에 다시 방문", successSignal: "첫 행동 완료율과 반복 행동률이 함께 개선됨" }],
    ],
  },
  {
    id: "proposal-office-brand-launch",
    typeId: "execution-plan",
    templateId: "campaignPlan",
    title: "오피스 가구 브랜드 런칭 실행 사례",
    target: "업무 공간을 새로 구성하며 브랜드와 제품 정보를 함께 탐색하는 구매자",
    basis: "실제 제안 구조 기반 · 익명 재구성",
    anonymization: "브랜드·제품군·매체사·파트너·예산·성과 수치를 재구성했습니다.",
    reconstruction: "구매 여정과 채널 역할 구조만 유지하고 메시지 및 실행 예시는 새로 작성했습니다.",
    sourceMapId: "office-brand-launch",
    desc: "인지 도달, 리뷰·검색, 비교·구매 역할을 매체와 콘텐츠로 나눈 런칭 제안",
    cards: [
      ["goal", "decision", "브랜드 인지와 제품 장점 이해를 함께 만든다", "노출만 확보하지 않고 브랜드 검색, 제품 정보 탐색과 구매 검토로 이어지는 선행 행동을 확인한다.", "selected"],
      ["message", "decision", "제품 장점을 한눈에 이해시키는 런칭 메시지", "인지용 영상과 탐색용 리뷰가 같은 핵심 효익을 서로 다른 깊이로 설명하도록 기준을 맞춘다.", "selected", "", { evidence: "원 제안서의 구매 경로 분석과 경쟁 브랜드 활동 단계 비교", linksToSections: [{ sectionId: "activities", type: "executes" }, { sectionId: "channel", type: "executes" }] }],
      ["activities", "activity", "인지 도달 → 리뷰·검색 → 비교·구매 검토", "영상 매체는 빠른 발견, 크리에이터와 리뷰는 신뢰·검색, 플랫폼 협업과 비교 정보는 구매 검토 역할을 맡는다.", "selected", "", { activityPurpose: "understand", activityMethod: "search-review", nextAction: "브랜드를 본 사용자가 제품명 검색과 상세 정보 확인으로 이동", successSignal: "브랜드 검색·리뷰 유입·제품 상세페이지 행동이 함께 증가" }],
      ["channel", "activity", "영상·크리에이터·플랫폼을 고객 질문에 맞춰 배치", "모든 채널에 같은 소재를 복제하지 않고 발견, 이해, 비교 단계의 질문에 맞는 정보를 제공한다.", "candidate", "", { activityPurpose: "discover", activityMethod: "paid-media", nextAction: "인지 영상에서 검색·리뷰·제품 정보로 이동", successSignal: "영상 도달 이후 브랜드 탐색 행동이 확인됨" }],
      ["schedule", "activity", "소재와 검색 근거를 먼저 준비한 뒤 도달을 확대", "원 제안서에는 세부 운영 일정이 충분하지 않으므로 제작·검수·플랫폼 협의의 선행 관계를 별도로 확정해야 한다.", "candidate"],
      ["budget", "constraint", "도달·리뷰·플랫폼 역할별 예산 구분", "총액만 정하지 않고 각 전략 축이 작동하는 데 필요한 최소 제작비와 매체비를 구분한다.", "selected"],
      ["kpi", "measurement", "인지 지표와 탐색·구매 신호를 함께 본다", "도달과 조회는 진단지표, 브랜드 검색과 제품 정보 행동은 선행지표, 구매·문의는 결과지표로 구분한다.", "selected"],
    ],
  },
  {
    id: "proposal-fnb-social-renewal",
    typeId: "execution-plan",
    templateId: "contentPlan",
    title: "F&B 브랜드 SNS 재정비 사례",
    target: "익숙한 메뉴를 소비하지만 브랜드 채널을 계속 볼 이유는 아직 약한 모바일 사용자",
    basis: "복수 실제 제안 구조 기반 · 익명 재구성",
    anonymization: "브랜드·메뉴·페르소나·캠페인명·해시태그·운영 수치와 원문 소재명을 제거했습니다.",
    reconstruction: "브랜드 정체성 진단, 시각 장치·화자·포맷, 콘텐츠 축과 채널 변환 원리를 조합했습니다.",
    sourceMapId: "fnb-social-renewal",
    desc: "콘텐츠 물량보다 브랜드다운 시각·이야기·포맷을 먼저 정하고 저장·참여·구매 검토로 연결한 운영안",
    cards: [
      ["objective", "decision", "많이 발행하는 채널에서 기억할 이유가 있는 채널로 전환", "도달량만 늘리지 않고 브랜드를 떠올리게 하는 시각 신호, 반복해서 기대할 시리즈, 메뉴 탐색 행동을 함께 만든다.", "selected"],
      ["audience", "observation", "짧은 영상으로 발견하고 저장한 정보로 나중에 선택한다", "재미있는 콘텐츠에 반응해도 브랜드와 연결되지 않으면 기억이 남지 않는다. 발견용 포맷과 선택을 돕는 정보형 포맷의 역할을 분리한다.", "selected", "", { evidence: "실제 제안서의 타깃 미디어 이용 관찰과 콘텐츠 반응 진단을 익명 재구성", linksToSections: [{ sectionId: "objective", type: "supports" }] }],
      ["theme", "decision", "브랜드 장면 · 메뉴 선택 · 생활 공감 · 참여의 네 축", "브랜드 장면은 정체성, 메뉴 선택은 제품 이해, 생활 공감은 공유, 참여는 관계 형성을 맡는다. 모든 축에 같은 비중을 강제하지 않는다.", "selected"],
      ["format", "activity", "대표안 · 한 잔이 완성되는 과정을 따라가는 미니 V-log", "타깃 순간 · 메뉴를 고르기 전 재료와 만드는 과정을 궁금해하는 때\n시각 장치 · 손의 움직임과 재료 색을 반복 모티프로 사용\n화자·톤 · 설명보다 관찰을 돕는 담백한 1인칭\n포맷 · 짧은 세로 영상 + 저장용 메뉴 카드\n샘플 제목 · ‘오늘 고른 한 잔이 만들어지는 순서’", "selected", "", { activityPurpose: "understand", activityMethod: "owned-content", nextAction: "영상 시청 후 메뉴 카드 저장과 상세 정보 확인으로 이동", successSignal: "완주율과 저장이 메뉴 상세 탐색으로 이어짐", linksToSections: [{ sectionId: "objective", type: "executes" }] }],
      ["format", "activity", "대안 · 브랜드 색과 오브젝트를 활용한 월간 메뉴 큐레이션", "같은 촬영 장치 안에서 계절 상황별 선택 기준을 보여준다. 한 채널의 영상을 카드·검색형 글·짧은 모션으로 다시 편집하되 메시지는 유지한다.", "candidate", "", { activityPurpose: "discover", activityMethod: "owned-content", nextAction: "발견 콘텐츠에서 상황별 메뉴 비교로 이동", successSignal: "브랜드 연상 댓글과 저장·검색 행동이 함께 나타남", linksToSections: [{ sectionId: "objective", type: "executes" }] }],
      ["format", "activity", "대안 · 나의 선택 기준을 보여주는 짧은 참여 포맷", "필터나 템플릿을 이용해 사용자가 맛·시간·기분 중 자신의 기준을 고르고 결과를 공유한다. 보상은 참여의 이유를 보조하는 수준으로 둔다.", "candidate", "", { activityPurpose: "experience", activityMethod: "promotion-offer", nextAction: "선택 결과 공유 후 같은 기준의 메뉴 확인으로 이동", successSignal: "템플릿 사용과 결과 공유가 메뉴 탐색으로 연결됨", linksToSections: [{ sectionId: "objective", type: "executes" }] }],
      ["format", "idea", "제외안 · 유행 밈을 브랜드 연결 없이 반복", "단기 반응은 만들 수 있지만 브랜드 시각과 제품 선택 이유가 남지 않는다. 유행 포맷은 브랜드 장면이나 메뉴 정보 중 하나를 강화할 때만 사용한다.", "rejected", "전략 방향과 불일치"],
      ["calendar", "constraint", "발행 횟수는 제작 여건과 축별 소재 확보 후 결정", "정해진 물량을 먼저 채우지 않는다. 네 개 콘텐츠 축 중 지속 제작 가능한 범위와 한 소스를 채널별로 변환할 수 있는 범위를 확인한 뒤 운영 리듬을 정한다.", "selected"],
      ["metric", "measurement", "도달보다 브랜드 기억·저장·메뉴 탐색의 연결을 본다", "발견 콘텐츠는 완주와 브랜드 연상, 정보 콘텐츠는 저장과 상세 탐색, 참여 콘텐츠는 생성과 재방문으로 역할별 성공 신호를 구분한다.", "selected"],
    ],
  },
  {
    id: "proposal-global-retail-social",
    typeId: "execution-plan",
    templateId: "contentPlan",
    title: "글로벌 리테일 SNS 운영 사례",
    target: "여행과 쇼핑 정보를 시각적으로 탐색하고 자신의 언어와 상황에 맞는 선택 근거를 원하는 사용자",
    basis: "복수 실제 제안 구조 기반 · 익명 재구성",
    anonymization: "기업·매장·지역·모델·상품·캠페인명과 과거 플랫폼 통계 및 운영 수치를 사용하지 않았습니다.",
    reconstruction: "채널별 Push/Pull 역할, 매거진형 시리즈, 글로벌·로컬 변환과 카테고리 균형만 재구성했습니다.",
    sourceMapId: "global-retail-social",
    desc: "채널마다 같은 콘텐츠를 복제하지 않고 발견, 정보 확인, 참여의 일을 나눠 지역별 맥락으로 변환한 운영안",
    cards: [
      ["objective", "decision", "정보를 미는 채널과 찾아보게 하는 채널의 역할을 분리", "공지와 혜택은 빠르게 전달하고, 시각 콘텐츠는 사용자가 취향과 상황에 맞는 정보를 탐색하고 저장하도록 설계한다.", "selected"],
      ["audience", "observation", "글로벌 사용자는 번역보다 자신의 상황에 맞는 맥락을 원한다", "같은 상품도 출발 전, 현지 방문 중, 귀국 전의 질문이 다르다. 문장만 번역하지 않고 사용 순간과 CTA를 지역별로 조정한다.", "selected", "", { evidence: "실제 제안서의 채널 역할 및 글로벌·로컬 운영 구조를 익명 재구성", linksToSections: [{ sectionId: "objective", type: "supports" }] }],
      ["theme", "decision", "브랜드 장면 · 선택 가이드 · 공간 정보 · 참여 미션", "브랜드 장면은 기대감, 선택 가이드는 저장, 공간 정보는 방문 준비, 참여 미션은 관계 형성을 맡는다.", "selected"],
      ["format", "activity", "대표안 · 한 달의 선택 기준을 모은 디지털 매거진", "시각 장치 · 한 가지 색과 오브젝트로 월간 표지를 통일\n화자·톤 · 여행을 준비하는 친구처럼 간결하게 안내\n포맷 · 3장 연결 피드 + 저장용 요약 + 짧은 영상\n샘플 제목 · ‘이번 이동에서 놓치지 않을 세 가지 기준’", "selected", "", { activityPurpose: "understand", activityMethod: "owned-content", nextAction: "매거진 저장 후 지역별 상세 가이드와 공간 정보 확인", successSignal: "저장과 프로필 탐색이 지역별 상세 콘텐츠로 이어짐", linksToSections: [{ sectionId: "objective", type: "executes" }] }],
      ["format", "activity", "대안 · 출발 전과 현지에서 달라지는 짧은 선택 가이드", "하나의 원본 정보에서 출발 전에는 준비 기준, 현지에서는 위치와 즉시 행동, 귀국 전에는 놓친 항목 점검으로 CTA를 바꾼다.", "candidate", "", { activityPurpose: "convert", activityMethod: "owned-content", nextAction: "현재 여행 단계에 맞는 공간·상품 정보 확인으로 이동", successSignal: "지역·단계별 상세 정보 클릭과 저장이 구분되어 나타남", linksToSections: [{ sectionId: "objective", type: "executes" }] }],
      ["format", "activity", "대안 · 색이나 테마를 따라 완성하는 방문 미션", "사용자가 여러 공간에서 테마에 맞는 장면을 찾고 자신의 기록을 남기게 한다. 참여 자체보다 다음 장소 탐색과 기록 완성을 중심에 둔다.", "candidate", "", { activityPurpose: "experience", activityMethod: "experience-event", nextAction: "첫 장면 발견 후 다음 장소 탐색과 기록 완성으로 이동", successSignal: "단일 참여보다 연속 장소 탐색과 완성 기록이 발생", linksToSections: [{ sectionId: "objective", type: "executes" }] }],
      ["calendar", "constraint", "글로벌 원본과 지역별 변환 범위를 먼저 합의", "모든 지역에 같은 물량을 강제하지 않는다. 변하지 않는 사실과 현지에서 바꿀 표현·사용 순간·CTA를 구분한 뒤 제작 가능 범위를 정한다.", "selected"],
      ["metric", "measurement", "채널 역할별 저장·탐색·방문 준비 행동을 구분", "공지형 채널은 정보 확인, 시각 채널은 저장과 탐색, 참여 콘텐츠는 연속 행동을 본다. 과거 제안서의 수치나 플랫폼 일반론은 현재 근거로 사용하지 않는다.", "selected"],
    ],
  },
  {
    id: "generic-content-operation",
    typeId: "execution-plan",
    templateId: "contentPlan",
    title: "전문 서비스 SNS 운영 예시",
    basis: "학습용 가상 사례",
    desc: "전문성을 어렵지 않게 전달하고 상담 행동까지 연결하는 작성 형식 예시",
    cards: [
      ["objective", "decision", "정보 소비를 상담 전 신뢰로 전환", "조회수보다 저장, 재방문과 상담 페이지 이동을 주요 행동으로 본다는 가정이다.", "selected"],
      ["audience", "observation", "문제를 느끼지만 전문가 상담은 아직 부담스러운 사람", "용어보다 자신의 상황을 판단할 수 있는 기준을 원한다는 타깃 가설을 확인한다.", "candidate"],
      ["theme", "idea", "상황 진단 · 오해 바로잡기 · 실제 해결 과정", "세 가지 콘텐츠 축이 발견에서 신뢰까지 서로 다른 역할을 맡는다.", "selected"],
      ["format", "activity", "짧은 진단 영상과 저장용 체크리스트", "발견용 숏폼과 검토용 카드 콘텐츠의 역할을 나눈다.", "candidate", "", { activityPurpose: "understand", activityMethod: "owned-content", nextAction: "콘텐츠 저장·재방문 이후 상담 기준 확인으로 이동", successSignal: "저장과 재방문이 상담 페이지 유입으로 이어짐" }],
      ["calendar", "activity", "지속 가능한 발행 리듬을 먼저 검증", "주당 발행 횟수는 제작 여건과 반응 데이터를 확인한 뒤 확정한다.", "candidate"],
      ["metric", "measurement", "저장률 · 재방문 · 상담 전환", "콘텐츠 반응과 비즈니스 행동을 단계별로 연결해 본다.", "selected"],
    ],
  },
];

const CARD_DECKS = {
  note: [["핵심 메모", "note"], ["확인할 질문", "note"], ["결정할 사항", "decision"]],
  observation: [["확인된 변화", "observation"], ["사용자 행동", "observation"], ["현재 문제", "observation"]],
  evidence: [["제품·브랜드 사실", "evidence"], ["데이터·출처", "evidence"], ["비교·참고 사례", "evidence"]],
  interpretation: [["이 사실의 의미", "interpretation"], ["발견한 기회", "interpretation"], ["긴장·모순", "interpretation"]],
  hypothesis: [["핵심 가설", "hypothesis"], ["예상되는 행동", "hypothesis"], ["가설 검증 기준", "measurement"]],
  decision: [["선택할 것", "decision"], ["하지 않을 것", "decision"], ["핵심 약속", "decision"]],
  idea: [["핵심 아이디어", "idea"], ["표현 장치", "idea"], ["사용자 접점", "activity"]],
  activity: [["핵심 활동", "activity"], ["채널의 역할", "activity"], ["다음 행동 · 성공 신호", "activity"]],
  constraint: [["현실적인 장벽", "constraint"], ["반드시 지킬 조건", "constraint"], ["실행 리스크", "constraint"]],
  measurement: [["성공 지표", "measurement"], ["측정 방법", "measurement"], ["판단 시점", "measurement"]],
};

const CARD_ROLES = {
  note: "메모",
  observation: "관찰",
  evidence: "근거",
  interpretation: "해석",
  hypothesis: "가설",
  decision: "전략 선택",
  idea: "아이디어",
  activity: "활동",
  constraint: "장벽 · 제약",
  measurement: "측정",
};

const STATUSES = {
  idea: { label: "아이디어", badge: "bg-white text-neutral-500 border-neutral-200", card: "bg-white border-neutral-200" },
  candidate: { label: "후보", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", card: "bg-indigo-50 border-indigo-200" },
  selected: { label: "대표안", badge: "bg-amber-100 text-amber-800 border-amber-300", card: "bg-amber-100 border-amber-300" },
  hold: { label: "보류", badge: "bg-stone-200 text-stone-600 border-stone-300", card: "bg-stone-100 border-stone-300" },
  rejected: { label: "탈락", badge: "bg-rose-50 text-rose-700 border-rose-200", card: "bg-rose-50 border-rose-200" },
  archived: { label: "보관", badge: "bg-neutral-100 text-neutral-400 border-neutral-200", card: "bg-neutral-100 border-neutral-200 opacity-70" },
};

/* 논리 연결 점검 카드의 3가지 상태. not-applicable은 실패가 아니라 이 템플릿·
   프로젝트에는 해당 단계 자체가 없다는 뜻이라 경고색을 쓰지 않는다. */
const LOGIC_CHECK_STYLES = {
  connected: { card: "bg-white border-teal-200", icon: "bg-teal-800 text-white", badge: "bg-teal-50 text-teal-800", label: "연결됨" },
  "needs-review": { card: "bg-amber-50 border-amber-200", icon: "bg-amber-200 text-amber-900", badge: "bg-white/80 text-amber-800", label: "확인 필요" },
  "not-applicable": { card: "bg-stone-100 border-neutral-200", icon: "bg-neutral-200 text-neutral-500", badge: "bg-white/80 text-neutral-500", label: "해당 없음" },
};

const LINK_TYPES = {
  because: "왜냐하면",
  therefore: "따라서",
  however: "하지만",
  example: "예를 들어",
  supports: "뒷받침한다",
  executes: "실행한다",
  verify: "검증해야 한다",
};

const REJECTION_REASONS = ["근거 부족", "타깃 부적합", "전략 방향과 불일치", "예산 초과", "일정상 불가능", "중복", "법무·심의 문제", "직접 입력"];

const ACTIVITY_PURPOSES = [
  { id: "discover", label: "발견 · 도달", desc: "브랜드나 문제를 처음 발견하게 합니다." },
  { id: "understand", label: "이해 · 탐색", desc: "관심을 근거 확인과 정보 탐색으로 이어갑니다." },
  { id: "experience", label: "경험 · 참여", desc: "직접 보고 해보고 참여하게 합니다." },
  { id: "convert", label: "전환 · 가입·구매", desc: "검토 중인 사람이 다음 결정을 내리게 합니다." },
  { id: "relation", label: "관계 · 재방문·팬덤", desc: "한 번의 행동을 반복과 관계로 이어갑니다." },
  { id: "learn", label: "검증 · 학습", desc: "가설을 확인하고 다음 판단 근거를 남깁니다." },
];

const ACTIVITY_METHODS = [
  { id: "paid-media", label: "광고 · 미디어", purposes: ["discover", "understand", "convert"], examples: "검색광고, 영상·디스플레이, 소셜 광고, 리타기팅" },
  { id: "pr-creator", label: "PR · 크리에이터 · PPL", purposes: ["discover", "understand"], examples: "언론, 크리에이터 협업, PPL, 시딩" },
  { id: "owned-content", label: "콘텐츠 · 온드미디어", purposes: ["discover", "understand", "relation"], examples: "영상, 아티클, 사례집, 랜딩페이지, 브랜드 채널" },
  { id: "search-review", label: "검색 · 리뷰 · SEO", purposes: ["understand", "convert"], examples: "검색 콘텐츠, 전문가·사용자 리뷰, 비교 정보, SEO·GEO" },
  { id: "experience-event", label: "이벤트 · 공간 · 브랜드 경험", purposes: ["experience", "convert", "relation"], examples: "체험, 팝업, 전시, 오프라인 이벤트, 샘플링" },
  { id: "platform-partnership", label: "플랫폼 · 파트너십", purposes: ["discover", "experience", "convert"], examples: "플랫폼 입점·기획전, 브랜드 제휴, 아티스트·IP 협업" },
  { id: "promotion-offer", label: "전환 장치 · 프로모션", purposes: ["experience", "convert", "relation"], examples: "체험 신청, 쿠폰, 한정 혜택, 추천·보상" },
  { id: "commerce-sales", label: "커머스 · 세일즈", purposes: ["understand", "convert"], examples: "상품페이지, 라이브커머스, 상담, 영업자료, 리드 전달" },
  { id: "crm-community", label: "CRM · 커뮤니티", purposes: ["convert", "relation"], examples: "이메일·메시지, 리드 너처링, 멤버십, 팬·사용자 커뮤니티" },
  { id: "measurement-experiment", label: "측정 · 실험", purposes: ["learn"], examples: "이벤트 설계, 대시보드, 브랜드 리프트, A/B 테스트, 회고" },
];

const activityPurposeLabel = (id) => ACTIVITY_PURPOSES.find((item) => item.id === id)?.label || "역할 미정";
const activityMethodLabel = (id) => ACTIVITY_METHODS.find((item) => item.id === id)?.label || "수단 미정";

const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const templateLabel = (template, author = "") => {
  if (!template.authorOriginal) return template.label;
  const owner = author.trim() || AUTHOR_NAME;
  return template.id === "quick" ? `${owner} Quick Brief` : `${owner} 전략 전개형 브리프`;
};

const isBriefIncluded = (card) => card.includeInBrief ?? card.status === "selected";

const makeCard = (sectionId, role = "note", title = "", content = "", status = "idea", rejectionReason = "", includeInBrief = false, meta = {}) => ({
  id: uid(),
  sectionId,
  role,
  title,
  content,
  evidence: asText(meta.evidence),
  status,
  includeInBrief,
  decisionReason: "",
  rejectionReason,
  funnel: asText(meta.funnel),
  activityPurpose: asText(meta.activityPurpose),
  activityMethod: asText(meta.activityMethod),
  nextAction: asText(meta.nextAction),
  successSignal: asText(meta.successSignal),
  links: Array.isArray(meta.links) ? meta.links : [],
});

const createProject = (templateId, title = "", author = "", target = "", example = null) => {
  const template = TEMPLATES[templateId] || TEMPLATES.blank;
  const now = new Date().toISOString();
  const project = {
    schemaVersion: SCHEMA_VERSION,
    id: uid(),
    title: title.trim() || `새 ${templateLabel(template, author)}`,
    author: author.trim(),
    target: (example?.target || target).trim(),
    typeId: template.typeId,
    templateId: template.id,
    templateName: templateLabel(template, author),
    templateSource: template.source,
    createdAt: now,
    updatedAt: now,
    lastFileSavedAt: null,
    sections: template.sections.map((item) => ({ ...item })),
    cards: [],
    drafts: {},
  };
  if (example) {
    project.title = example.title;
    project.cards = example.cards.map(([sectionId, role, cardTitle, content, status, reason, meta]) => makeCard(sectionId, role, cardTitle, content, status, reason || "", status === "selected", meta));
    example.cards.forEach((exampleCard, index) => {
      const meta = exampleCard[6];
      if (!Array.isArray(meta?.linksToSections)) return;
      project.cards[index].links = meta.linksToSections.flatMap((link) => {
        const target = project.cards.find((card) => card.sectionId === link.sectionId && card.id !== project.cards[index].id);
        return target ? [{ targetId: target.id, type: LINK_TYPES[link.type] ? link.type : "supports" }] : [];
      });
    });
  }
  return project;
};

const asText = (value, fallback = "") => typeof value === "string" ? value : fallback;

const normalizeCurrentProject = (data) => {
  if (!data || data.schemaVersion !== SCHEMA_VERSION || !Array.isArray(data.sections) || !Array.isArray(data.cards)) {
    throw new Error("지원하지 않는 프로젝트 파일입니다.");
  }

  const sectionIds = new Set();
  const sections = data.sections.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const id = asText(item.id).trim() || `section-${index + 1}`;
    if (sectionIds.has(id)) return [];
    sectionIds.add(id);
    return [{
      id,
      title: asText(item.title, `섹션 ${index + 1}`),
      prompt: asText(item.prompt),
      desc: asText(item.desc),
      defaultRole: CARD_ROLES[item.defaultRole] ? item.defaultRole : "note",
      kind: asText(item.kind, "thinking"),
    }];
  });

  const cardIds = new Set();
  const cards = data.cards.flatMap((card) => {
    if (!card || typeof card !== "object") return [];
    let id = asText(card.id).trim() || uid();
    while (cardIds.has(id)) id = uid();
    cardIds.add(id);
    const sectionId = asText(card.sectionId).trim() || "recovered";
    return [{
      id,
      sectionId,
      role: CARD_ROLES[card.role] ? card.role : "note",
      title: asText(card.title, "제목 없음"),
      content: asText(card.content),
      evidence: asText(card.evidence),
      status: STATUSES[card.status] ? card.status : "idea",
      includeInBrief: typeof card.includeInBrief === "boolean" ? card.includeInBrief : card.status === "selected",
      decisionReason: asText(card.decisionReason),
      rejectionReason: asText(card.rejectionReason),
      funnel: asText(card.funnel),
      activityPurpose: ACTIVITY_PURPOSES.some((item) => item.id === card.activityPurpose) ? card.activityPurpose : "",
      activityMethod: ACTIVITY_METHODS.some((item) => item.id === card.activityMethod) ? card.activityMethod : "",
      nextAction: asText(card.nextAction),
      successSignal: asText(card.successSignal),
      links: Array.isArray(card.links) ? card.links.flatMap((link) => {
        if (!link || typeof link !== "object" || !asText(link.targetId).trim()) return [];
        return [{ targetId: asText(link.targetId), type: LINK_TYPES[link.type] ? link.type : "supports" }];
      }) : [],
    }];
  });

  [...new Set(cards.map((card) => card.sectionId).filter((id) => !sectionIds.has(id)))].forEach((id) => {
    sectionIds.add(id);
    sections.push(section(
      id,
      id === "recovered" ? "복구된 카드" : `복구된 섹션 · ${id}`,
      "",
      "저장 데이터에서 원래 섹션을 찾지 못해 자동으로 복구했습니다.",
      "note",
    ));
  });

  const drafts = data.drafts && typeof data.drafts === "object" && !Array.isArray(data.drafts)
    ? Object.fromEntries(Object.entries(data.drafts).filter(([, value]) => typeof value === "string"))
    : {};
  const template = TEMPLATES[data.templateId] || TEMPLATES.blank;
  const now = new Date().toISOString();

  return {
    schemaVersion: SCHEMA_VERSION,
    id: asText(data.id).trim() || uid(),
    title: asText(data.title, "가져온 프로젝트"),
    author: asText(data.author),
    target: asText(data.target),
    typeId: asText(data.typeId, template.typeId),
    templateId: asText(data.templateId, template.id),
    templateName: asText(data.templateName, templateLabel(template, asText(data.author))),
    templateSource: asText(data.templateSource, template.source),
    createdAt: asText(data.createdAt, now),
    updatedAt: asText(data.updatedAt, now),
    lastFileSavedAt: typeof data.lastFileSavedAt === "string" ? data.lastFileSavedAt : null,
    sections,
    cards,
    drafts,
  };
};

const loadAutosave = () => {
  if (typeof window === "undefined") return null;
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      return normalizeImported(JSON.parse(raw));
    } catch {
      // Try the next known storage key. Invalid data should not block app startup.
    }
  }
  return null;
};

const normalizeImported = (data) => {
  if (data?.schemaVersion === SCHEMA_VERSION) return normalizeCurrentProject(data);
  if (Array.isArray(data?.cards) && data?.meta) {
    const legacySections = [
      section("ground", "배경 · 타깃", "", "이전 버전에서 가져온 섹션", "observation"),
      section("focus", "목표 · 변화", "", "이전 버전에서 가져온 섹션", "decision"),
      section("leap", "인사이트 · 제안", "", "이전 버전에서 가져온 섹션", "interpretation"),
      section("build", "크리에이티브 · 실행", "", "이전 버전에서 가져온 섹션", "idea", "execution"),
      section("prove", "근거 · 제약 · 측정", "", "이전 버전에서 가져온 섹션", "evidence", "measurement"),
    ];
    return normalizeCurrentProject({
      schemaVersion: SCHEMA_VERSION,
      id: uid(),
      title: data.meta.title || "가져온 프로젝트",
      author: "",
      target: data.meta.target || "",
      typeId: "strategic-brief",
      templateId: data.frameworkKey || "quick",
      templateName: "이전 버전에서 가져온 브리프",
      templateSource: "Campaign Strategy OS 이전 버전",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastFileSavedAt: null,
      sections: legacySections,
      drafts: {},
      cards: data.cards.map((card) => ({
        id: card.id || uid(),
        sectionId: card.zone || card.col || "ground",
        role: card.cardType === "support" ? "evidence" : card.cardType === "activity" ? "activity" : "note",
        title: card.title || "제목 없음",
        content: card.body || card.memo || "",
        evidence: card.evidence || "",
        status: card.status || (card.starred ? "selected" : "idea"),
        includeInBrief: card.includeInBrief ?? card.starred ?? card.status === "selected",
        decisionReason: card.decisionReason || "",
        rejectionReason: card.rejectionReason || "",
        funnel: card.funnel || "",
        activityPurpose: card.activityPurpose || "",
        activityMethod: card.activityMethod || "",
        nextAction: card.nextAction || "",
        successSignal: card.successSignal || "",
        links: card.links || [],
      })),
    });
  }
  throw new Error("지원하지 않는 프로젝트 파일입니다.");
};

const buildLogicReview = (project) => {
  const activeCards = (project?.cards || []).filter((card) => !["archived", "rejected"].includes(card.status));
  const cardIds = new Set(activeCards.map((card) => card.id));
  const meaningful = (card) => Boolean(asText(card.title).trim() || asText(card.content).trim());
  const decisions = activeCards.filter((card) => ["decision", "hypothesis"].includes(card.role) && meaningful(card));
  const evidenceCards = activeCards.filter((card) => card.role === "evidence" || asText(card.evidence).trim());
  const activityCards = activeCards.filter((card) => card.role === "activity" && meaningful(card));
  const measurementCards = activeCards.filter((card) => card.role === "measurement" && meaningful(card));
  const validLinks = activeCards.flatMap((card) => (card.links || [])
    .filter((link) => cardIds.has(link.targetId))
    .map((link) => ({ sourceId: card.id, targetId: link.targetId, type: link.type })));
  const connected = (firstId, secondId) => validLinks.some((link) => (
    (link.sourceId === firstId && link.targetId === secondId)
    || (link.sourceId === secondId && link.targetId === firstId)
  ));
  const relatedStrategies = (activity) => decisions.filter((card) => connected(activity.id, card.id));
  const emptySections = (project?.sections || []).filter((item) => item.prompt && !activeCards.some((card) => card.sectionId === item.id && meaningful(card)));
  const activitiesWithoutStrategy = activityCards.filter((card) => relatedStrategies(card).length === 0);
  const incompleteActivities = activityCards.filter((card) => (
    !asText(card.activityPurpose).trim()
    || !asText(card.nextAction).trim()
    || !asText(card.successSignal).trim()
  ));
  const evidenceConnected = evidenceCards.some((evidence) => decisions.some((decision) => evidence.id === decision.id || connected(evidence.id, decision.id)));
  const everyActivityMeasured = activityCards.length > 0 && activityCards.every((card) => asText(card.successSignal).trim());

  /* 템플릿이 활동·측정 단계를 애초에 정의하지 않았다면(예: 전략 브리프 계열은
     defaultRole "activity" 섹션이 없음) 활동 카드가 없다고 해서 "확인 필요"로
     경고하지 않는다 — "해당 없음"으로 표시한다. 반대로 사용자가 그런 템플릿에
     직접 활동·측정 카드를 추가했다면 그 순간부터 점검을 활성화한다. typeId로
     하드코딩하지 않고 프로젝트의 실제 sections·cards를 기준으로 판단해 가져온
     구버전 프로젝트나 구조를 바꾼 보드에도 그대로 대응한다. */
  const expectsActivity = (project?.sections || []).some((section) => section.defaultRole === "activity");
  const expectsMeasurement = (project?.sections || []).some((section) => section.defaultRole === "measurement" || section.kind === "measurement");
  const activityRelevant = expectsActivity || activityCards.length > 0;
  const measurementRelevant = expectsMeasurement || measurementCards.length > 0 || activityCards.length > 0;
  const checkStatus = (relevant, ok) => (!relevant ? "not-applicable" : ok ? "connected" : "needs-review");

  return {
    checks: [
      {
        id: "direction",
        label: "타깃과 목표 변화",
        status: checkStatus(true, Boolean(asText(project?.target).trim()) && decisions.length > 0),
        detail: !asText(project?.target).trim()
          ? "타깃이 비어 있습니다. 누구의 변화를 만들지 먼저 적어주세요."
          : decisions.length === 0
            ? "타깃은 있으나 선택한 목표·전략 카드가 없습니다."
            : "타깃과 목표·전략 선택이 작성되어 있습니다.",
      },
      {
        id: "coverage",
        label: "핵심 단계 작성",
        status: checkStatus(true, emptySections.length === 0),
        detail: emptySections.length
          ? `아직 카드가 없는 단계: ${emptySections.map((item) => item.title).join(", ")}`
          : "질문이 있는 모든 단계에 판단 재료가 있습니다.",
      },
      {
        id: "evidence",
        label: "근거와 전략의 연결",
        status: checkStatus(true, decisions.length > 0 && evidenceCards.length > 0 && evidenceConnected),
        detail: evidenceCards.length === 0
          ? "전략을 지지하거나 반박할 근거 카드·출처가 없습니다."
          : !evidenceConnected
            ? "근거는 있지만 어떤 전략을 뒷받침하는지 논리 관계가 연결되지 않았습니다."
            : "별도 근거 카드 또는 카드 내부 근거가 전략 선택과 연결되어 있습니다.",
      },
      {
        id: "execution",
        label: "전략과 활동의 연결",
        status: checkStatus(activityRelevant, activityCards.length > 0 && activitiesWithoutStrategy.length === 0),
        detail: !activityRelevant
          ? "이 템플릿은 별도의 실행 활동 단계를 포함하지 않습니다. 활동 카드를 추가하면 이 점검이 활성화됩니다."
          : activityCards.length === 0
            ? "실행 역할을 가진 활동 카드가 아직 없습니다."
            : activitiesWithoutStrategy.length
              ? `전략과 연결되지 않은 활동: ${activitiesWithoutStrategy.map((card) => card.title || "제목 없음").join(", ")}`
              : "모든 활동이 전략 선택과 연결되어 있습니다.",
      },
      {
        id: "journey",
        label: "활동의 역할과 다음 행동",
        status: checkStatus(activityRelevant, activityCards.length > 0 && incompleteActivities.length === 0),
        detail: !activityRelevant
          ? "이 템플릿은 별도의 실행 활동 단계를 포함하지 않습니다."
          : incompleteActivities.length
            ? `역할·다음 행동·성공 신호를 보완할 활동: ${incompleteActivities.map((card) => card.title || "제목 없음").join(", ")}`
            : activityCards.length
              ? "모든 활동에 역할, 다음 행동, 성공 신호가 있습니다."
              : "점검할 활동 카드가 없습니다.",
      },
      {
        id: "measurement",
        label: "성공 판단 근거",
        status: checkStatus(measurementRelevant, everyActivityMeasured || measurementCards.length > 0),
        detail: !measurementRelevant
          ? "이 템플릿은 별도의 측정 단계를 포함하지 않습니다."
          : everyActivityMeasured
            ? "각 활동의 성공 신호로 실행 후 판단할 수 있습니다."
            : measurementCards.length
              ? "별도의 측정 카드가 있습니다. 활동별 성공 신호와 함께 확인하세요."
              : "활동별 성공 신호나 별도의 측정 카드가 필요합니다.",
      },
    ],
    activityChains: activityCards.map((card) => ({
      card,
      strategies: relatedStrategies(card),
    })),
  };
};

export default function CampaignStrategyOS() {
  const [boot, setBoot] = useState(() => loadAutosave());
  const [screen, setScreen] = useState("library");
  const [selectedType, setSelectedType] = useState("strategic-brief");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAuthor, setDraftAuthor] = useState("");
  const [draftTarget, setDraftTarget] = useState("");
  const [project, setProject] = useState(null);
  const [view, setView] = useState("board");
  const [editingCard, setEditingCard] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [previewExample, setPreviewExample] = useState(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const [showExampleHints, setShowExampleHints] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityPurpose, setActivityPurpose] = useState("discover");
  const [activityTargetSectionId, setActivityTargetSectionId] = useState("");
  const [dragCardId, setDragCardId] = useState(null);
  const [linkDraft, setLinkDraft] = useState({ type: "therefore", targetId: "" });
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [dirty, setDirty] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const noticeTimerRef = useRef(null);

  const templatesForType = useMemo(() => Object.values(TEMPLATES).filter((item) => item.typeId === selectedType), [selectedType]);
  const examplesForType = useMemo(() => EXAMPLES.filter((item) => item.typeId === selectedType), [selectedType]);
  const recoverable = project || boot;

  useEffect(() => {
    if (!project || screen !== "workspace") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setAutoSavedAt(new Date().toISOString());
      setStorageWarning("");
    } catch {
      setStorageWarning("브라우저 임시저장을 사용할 수 없습니다. 작업 내용을 잃지 않도록 프로젝트 파일을 수시로 저장해 주세요.");
    }
  }, [project, screen]);

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  const showNotice = (message) => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    setNotice(message);
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 2400);
  };

  const updateProject = (updater) => {
    setProject((prev) => {
      if (!prev) return prev;
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return { ...next, updatedAt: new Date().toISOString() };
    });
    setDirty(true);
  };

  const startTemplate = (templateId) => {
    setProject(createProject(templateId, draftTitle, draftAuthor, draftTarget));
    setScreen("workspace");
    setView("board");
    setDirty(true);
    setEditingCard(null);
  };

  const startExample = (example) => {
    setProject(createProject(example.templateId, example.title, draftAuthor, draftTarget, example));
    setScreen("workspace");
    setView("board");
    setDirty(true);
    setPreviewExample(null);
    setShowExampleHints(false);
  };

  const resumeAutosave = () => {
    if (!recoverable) return;
    setProject(recoverable);
    setDraftAuthor(recoverable.author || "");
    setDraftTarget(recoverable.target || "");
    setScreen("workspace");
    setView("board");
    setDirty(project ? dirty : !recoverable.lastFileSavedAt || recoverable.updatedAt !== recoverable.lastFileSavedAt);
  };

  const clearSavedProject = () => {
    if (!recoverable) return;
    if (!window.confirm(`“${recoverable.title}” 작업을 이 브라우저에서 지울까요? 저장한 프로젝트 파일은 삭제되지 않습니다.`)) return;
    try {
      [STORAGE_KEY, ...LEGACY_STORAGE_KEYS].forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // The in-memory project can still be cleared when browser storage is unavailable.
    }
    setProject(null);
    setBoot(null);
    setDirty(false);
    setAutoSavedAt(null);
    setScreen("library");
  };

  const goLibrary = () => {
    setScreen("library");
    setEditingCard(null);
    setActivityOpen(false);
  };

  const saveProjectFile = () => {
    if (!project) return;
    const savedAt = new Date().toISOString();
    const snapshot = { ...project, lastFileSavedAt: savedAt, updatedAt: savedAt };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTitle = (project.title || "strategy-board").replace(/[^a-zA-Z0-9가-힣_-]+/g, "-");
    anchor.href = url;
    anchor.download = `${safeTitle}.strategy-board.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    setProject(snapshot);
    setDirty(false);
    showNotice("편집 가능한 프로젝트 파일을 저장했습니다.");
  };

  const importProject = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("프로젝트 파일은 5MB 이하만 불러올 수 있습니다.");
      const imported = normalizeImported(JSON.parse(await file.text()));
      setProject({ ...imported, updatedAt: new Date().toISOString() });
      setDraftAuthor(imported.author || "");
      setDraftTarget(imported.target || "");
      setScreen("workspace");
      setView("board");
      setDirty(false);
      showNotice("프로젝트를 불러왔습니다.");
    } catch (error) {
      showNotice(error?.message || "올바른 프로젝트 파일이 아닙니다.");
    } finally {
      event.target.value = "";
    }
  };

  const patchCard = (id, patch) => updateProject((prev) => ({ ...prev, cards: prev.cards.map((card) => card.id === id ? { ...card, ...patch } : card) }));

  const addCard = (sectionId, role = null) => {
    const currentSection = project.sections.find((item) => item.id === sectionId);
    const card = makeCard(sectionId, role || currentSection?.defaultRole || "note");
    updateProject((prev) => ({ ...prev, cards: [...prev.cards, card] }));
    setEditingCard(card.id);
  };

  const addRecommendedCard = (sectionId, title, role) => {
    const card = makeCard(sectionId, role, title);
    updateProject((prev) => ({ ...prev, cards: [...prev.cards, card] }));
    setEditingCard(card.id);
  };

  const copyExampleCard = (exampleCard) => {
    const [sectionId, role, title, content, , , meta] = exampleCard;
    const card = makeCard(sectionId, role, title, content, "idea", "", false, meta);
    updateProject((prev) => ({ ...prev, cards: [...prev.cards, card] }));
    showNotice("예시를 내 카드로 복사했습니다.");
  };

  const addPromptCard = (currentSection) => {
    const text = (project.drafts?.[currentSection.id] || "").trim();
    if (!text) return showNotice("답변을 입력해 주세요.");
    const firstLine = text.split(/\n|[.!?]\s/)[0];
    const card = makeCard(currentSection.id, currentSection.defaultRole, firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine, text);
    updateProject((prev) => ({ ...prev, cards: [...prev.cards, card], drafts: { ...prev.drafts, [currentSection.id]: "" } }));
  };

  const removeCard = (id) => updateProject((prev) => ({
    ...prev,
    cards: prev.cards.filter((card) => card.id !== id).map((card) => ({ ...card, links: (card.links || []).filter((link) => link.targetId !== id) })),
  }));

  const moveCardWithin = (id, direction) => updateProject((prev) => {
    const cards = [...prev.cards];
    const index = cards.findIndex((card) => card.id === id);
    if (index < 0) return prev;
    const card = cards[index];
    const sameSection = cards.map((item, idx) => ({ item, idx })).filter(({ item }) => item.sectionId === card.sectionId);
    const localIndex = sameSection.findIndex(({ item }) => item.id === id);
    const target = sameSection[localIndex + direction];
    if (!target) return prev;
    [cards[index], cards[target.idx]] = [cards[target.idx], cards[index]];
    return { ...prev, cards };
  });

  const moveSection = (id, direction) => updateProject((prev) => {
    const sections = [...prev.sections];
    const index = sections.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return prev;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    return { ...prev, sections };
  });

  const addSection = () => {
    const id = uid();
    updateProject((prev) => ({ ...prev, sections: [...prev.sections, section(id, "새 섹션", "", "섹션 제목과 질문을 바꿔보세요.", "note")] }));
    setEditingSection(id);
  };

  const patchSection = (id, patch) => updateProject((prev) => ({ ...prev, sections: prev.sections.map((item) => item.id === id ? { ...item, ...patch } : item) }));

  const removeSection = (id) => {
    const count = project.cards.filter((card) => card.sectionId === id).length;
    if (count && !window.confirm(`이 섹션의 카드 ${count}장도 함께 삭제됩니다. 계속할까요?`)) return;
    updateProject((prev) => ({ ...prev, sections: prev.sections.filter((item) => item.id !== id), cards: prev.cards.filter((card) => card.sectionId !== id) }));
  };

  const addRelation = (sourceId) => {
    if (!linkDraft.targetId || linkDraft.targetId === sourceId) return;
    updateProject((prev) => ({
      ...prev,
      cards: prev.cards.map((card) => {
        if (card.id !== sourceId) return card;
        const links = card.links || [];
        const exists = links.some((link) => link.targetId === linkDraft.targetId && link.type === linkDraft.type);
        return exists ? card : { ...card, links: [...links, { targetId: linkDraft.targetId, type: linkDraft.type }] };
      }),
    }));
    setLinkDraft({ type: "therefore", targetId: "" });
  };

  const addActivity = (method) => {
    const purpose = ACTIVITY_PURPOSES.find((item) => item.id === activityPurpose) || ACTIVITY_PURPOSES[0];
    const executionSections = project.sections.filter((item) => item.kind === "execution");
    const target = executionSections.find((item) => item.id === activityTargetSectionId)
      || executionSections[0]
      || project.sections[project.sections.length - 1];
    if (!target) return;
    const existing = project.cards.find((card) => card.status !== "archived"
      && card.sectionId === target.id
      && card.activityPurpose === purpose.id
      && card.activityMethod === method.id);
    if (existing) {
      setEditingCard(existing.id);
      return showNotice(`${purpose.label} 역할의 ${method.label} 카드가 이미 있습니다.`);
    }
    const card = makeCard(target.id, "activity", method.label, "", "candidate", "", false, {
      activityPurpose: purpose.id,
      activityMethod: method.id,
    });
    updateProject((prev) => ({ ...prev, cards: [...prev.cards, card] }));
    setEditingCard(card.id);
    showNotice(`${purpose.label} 역할의 활동을 ${target.title}에 추가했습니다.`);
  };

  const cardsForSection = (sectionId, includeArchived = false) => project.cards.filter((card) => card.sectionId === sectionId && (includeArchived || card.status !== "archived"));

  const docMarkdown = (briefOnly = false) => {
    let output = `# ${project.title}\n\n${project.templateName}${project.author ? ` · ${project.author}` : ""}\n\n`;
    output += `타깃: ${project.target || "-"}\n\n`;
    project.sections.forEach((item) => {
      const cards = cardsForSection(item.id).filter((card) => briefOnly ? isBriefIncluded(card) : true);
      if (!cards.length) return;
      output += `## ${item.title}\n`;
      cards.forEach((card) => {
        output += `- **${card.title || "제목 없음"}**${briefOnly ? "" : ` [${STATUSES[card.status]?.label}]`}${card.content ? ` — ${card.content}` : ""}\n`;
        if (card.role === "activity" && card.activityPurpose) output += `  - 역할: ${activityPurposeLabel(card.activityPurpose)}${card.activityMethod ? ` · ${activityMethodLabel(card.activityMethod)}` : ""}\n`;
        if (card.role === "activity" && card.nextAction) output += `  - 다음 행동: ${card.nextAction}\n`;
        if (card.role === "activity" && card.successSignal) output += `  - 성공 신호: ${card.successSignal}\n`;
        if (showEvidence && card.evidence) output += `  - 근거: ${card.evidence}\n`;
      });
      output += "\n";
    });
    return output;
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(docMarkdown(view === "brief"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showNotice("클립보드 복사에 실패했습니다.");
    }
  };

  if (screen === "library") {
    const selectedTypeInfo = WORK_TYPES.find((item) => item.id === selectedType);
    return (
      <div className="min-h-screen bg-stone-100 text-neutral-900">
        <div className="max-w-6xl mx-auto px-5 py-10 sm:py-14">
          <div className="flex flex-wrap items-start gap-4 mb-10">
            <div className="flex-1 min-w-[280px]">
              <p className="text-xs tracking-[0.18em] text-teal-800 font-bold mb-2">CAMPAIGN STRATEGY OS</p>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">생각을 펼치고,<br className="hidden sm:block" /> 팀이 움직일 지침으로 정리하세요.</h1>
              <p className="text-neutral-600 mt-3 max-w-3xl leading-relaxed">브리프는 빈칸을 채우는 문서가 아니라, 작성자와 팀이 이후 과정에서 무엇을 선택하고 어떻게 움직일지 판단하게 하는 지침입니다.</p>
              <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-semibold text-teal-900"><span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1">관찰과 생각 펼치기</span><span className="text-neutral-300">→</span><span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1">선택과 근거 정리</span><span className="text-neutral-300">→</span><span className="rounded-full bg-teal-800 text-white px-3 py-1">실행 지침으로 수렴</span></div>
            </div>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-neutral-300 cursor-pointer text-sm hover:border-neutral-500">
              <FolderOpen size={16} /> 프로젝트 불러오기
              <input type="file" accept="application/json,.json" onChange={importProject} className="hidden" />
            </label>
          </div>

          {recoverable && (
            <div className="w-full mb-8 rounded-2xl bg-teal-900 text-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-stretch gap-2">
              <button onClick={resumeAutosave} className="flex-1 text-left rounded-xl px-3 py-2 sm:px-4 hover:bg-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1"><p className="text-[10px] tracking-widest text-teal-200 font-bold">{project ? "현재 작업 이어하기" : "최근 작업 이어하기"}</p><p className="text-lg font-bold mt-1">{recoverable.title}</p><p className="text-xs text-teal-200 mt-1">{recoverable.templateName} · {project ? "편집 상태 유지됨" : "브라우저에 임시저장됨"}</p></div>
                <span className="text-sm font-semibold whitespace-nowrap">보드 열기 →</span>
              </button>
              <button onClick={clearSavedProject} className="rounded-xl border border-white/20 px-4 py-3 text-xs font-semibold text-teal-100 hover:bg-rose-500/20 hover:border-rose-300 hover:text-white flex items-center justify-center gap-1.5"><Trash2 size={14} /> 작업 지우기</button>
            </div>
          )}

          <section className="mb-10">
            <p className="text-xs font-bold text-neutral-400 tracking-wider mb-3">1. 작업 유형</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {WORK_TYPES.map((item) => (
                <button key={item.id} onClick={() => setSelectedType(item.id)} className={`h-full text-left rounded-2xl border-2 p-5 transition flex flex-col ${selectedType === item.id ? "bg-white border-teal-700 shadow-sm" : "bg-white/60 border-transparent hover:bg-white"}`}>
                  <span className="text-[10px] font-bold text-teal-800">{item.number}</span>
                  <h2 className="font-bold text-lg mt-2">{item.label}</h2>
                  <p className="text-sm font-semibold text-neutral-700 mt-1">{item.short}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed mt-2">{item.desc}</p>
                  <p className="text-[10px] text-neutral-400 mt-auto pt-4 border-t border-neutral-100">적합: {item.fit}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-neutral-400 tracking-wider">2. {selectedTypeInfo?.label} 템플릿</p>
                <p className="text-sm text-neutral-500 mt-1">{selectedTypeInfo?.fit}</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 w-full md:w-auto">
                <input aria-label="프로젝트 제목" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="프로젝트 제목 (선택)" className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700" />
                <input aria-label="캠페인 타깃" value={draftTarget} onChange={(event) => setDraftTarget(event.target.value)} placeholder="캠페인 타깃 (선택)" className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700" />
                <input aria-label="작성자 이름" value={draftAuthor} onChange={(event) => setDraftAuthor(event.target.value)} placeholder="작성자 이름 (선택)" className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-3">
              {templatesForType.map((template) => (
                <article key={template.id} className="h-full min-h-[330px] rounded-2xl bg-white border border-neutral-200 p-5 flex flex-col">
                  <div className="flex items-start gap-2">
                    <div className="flex-1"><h3 className="font-bold">{templateLabel(template, draftAuthor)}</h3><span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-neutral-500">{template.badge}</span></div>
                    <span className="text-[10px] text-neutral-300">{template.sections.length}개 섹션</span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed mt-3">{template.desc}</p>
                  <p className="text-[10px] text-neutral-400 mt-3">{template.source}</p>
                  <div className="flex flex-wrap gap-1 mt-4">{template.sections.slice(0, 4).map((item) => <span key={item.id} className="text-[9px] bg-stone-100 text-neutral-500 rounded-full px-2 py-1">{item.title}</span>)}</div>
                  <div className="mt-auto pt-5"><button onClick={() => startTemplate(template.id)} className="w-full rounded-lg bg-neutral-900 text-white py-2.5 text-sm font-semibold hover:bg-teal-900">이 템플릿으로 시작</button></div>
                </article>
              ))}
            </div>
          </section>

          {!!examplesForType.length && (
            <section className="mt-10 pt-8 border-t border-neutral-200">
              <div className="mb-4"><p className="text-xs font-bold text-neutral-400 tracking-wider">3. 채워진 예시</p><p className="text-sm text-neutral-500 mt-1">실제 제안서 기반 사례와 학습용 가상 사례를 구분했습니다. 전체 보드를 읽거나 복제할 수 있습니다.</p></div>
              <div className="grid md:grid-cols-2 gap-3">
                {examplesForType.map((example) => (
                  <article key={example.id} className="h-full min-h-[390px] rounded-2xl bg-neutral-900 text-white p-6 flex flex-col">
                    <div className="min-h-12"><p className="text-[10px] text-teal-300 font-bold tracking-wider">{example.basis || "작성 형식 예시"}</p>{example.anonymization && <span className="inline-flex mt-2 rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold text-neutral-300">익명화 기준 적용</span>}</div>
                    <h3 className="font-bold text-lg mt-2 min-h-14">{example.title}</h3>
                    <p className="text-sm text-neutral-300 mt-2 leading-relaxed min-h-[60px]">{example.desc}</p>
                    <div className="mt-4 grid gap-1.5 flex-1 content-start">{example.cards.slice(0, 3).map((card, index) => <div key={`${example.id}-${index}`} className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-xs text-neutral-200"><span className="text-teal-300 mr-1.5">{String(index + 1).padStart(2, "0")}</span>{card[2]}</div>)}</div>
                    <div className="mt-auto pt-5 flex gap-2"><button onClick={() => setPreviewExample(example)} className="flex-1 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold hover:bg-white/10">전체 예시 보기</button><button onClick={() => startExample(example)} className="flex-1 rounded-lg bg-white text-neutral-900 px-3 py-2 text-sm font-semibold">복제해 시작</button></div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
        {previewExample && (
          <div className="fixed inset-0 z-50 bg-neutral-950/60 p-4 sm:p-8 flex items-center justify-center" onClick={() => setPreviewExample(null)}>
            <div role="dialog" aria-modal="true" aria-labelledby="example-preview-title" className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-stone-100 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="p-5 sm:p-7 border-b border-neutral-200 flex items-start gap-4">
                <div className="flex-1"><p className="text-[10px] font-bold tracking-wider text-teal-800">채워진 보드 미리보기 · {previewExample.basis || "작성 형식 예시"}</p><h2 id="example-preview-title" className="text-2xl font-bold mt-1">{previewExample.title}</h2><p className="text-sm text-neutral-500 mt-2">{previewExample.desc}</p>{(previewExample.anonymization || previewExample.reconstruction) && <div className="mt-3 grid sm:grid-cols-2 gap-2 text-[10px] leading-relaxed"><p className="rounded-lg bg-white border border-neutral-200 px-3 py-2"><b className="text-neutral-700">익명화</b> · {previewExample.anonymization}</p><p className="rounded-lg bg-white border border-neutral-200 px-3 py-2"><b className="text-neutral-700">재구성</b> · {previewExample.reconstruction}</p></div>}</div>
                <button onClick={() => setPreviewExample(null)} aria-label="예시 닫기" className="p-2 rounded-full bg-white border border-neutral-200"><X size={18} /></button>
              </div>
              <div className="overflow-auto p-5 sm:p-7 max-h-[62vh]">
                <div className="flex gap-3 min-w-max items-start">{(TEMPLATES[previewExample.templateId]?.sections || []).map((exampleSection, sectionIndex) => { const cards = previewExample.cards.filter((card) => card[0] === exampleSection.id); return <section key={exampleSection.id} className="w-80 rounded-2xl bg-stone-200/80 p-3"><div className="mb-3 min-h-12"><span className="text-[9px] font-bold text-teal-800">{String(sectionIndex + 1).padStart(2, "0")}</span><h3 className="font-bold text-sm mt-1">{exampleSection.title}</h3></div><div className="space-y-2">{cards.map((card, cardIndex) => { const meta = card[6] || {}; return <div key={`${exampleSection.id}-${cardIndex}`} className="min-h-[176px] rounded-xl bg-white border border-neutral-200 p-3 flex flex-col"><div className="flex items-center gap-1 min-h-6"><span className="text-[9px] rounded-full bg-stone-100 px-2 py-1 text-neutral-500">{CARD_ROLES[card[1]] || card[1]}</span><span className={`text-[9px] rounded-full border px-2 py-1 ${STATUSES[card[4]]?.badge || STATUSES.idea.badge}`}>{STATUSES[card[4]]?.label || "아이디어"}</span></div><p className="text-sm font-semibold mt-2 min-h-10">{card[2]}</p><p className="text-xs text-neutral-500 mt-1.5 leading-relaxed whitespace-pre-line">{card[3]}</p>{card[1] === "activity" && (meta.nextAction || meta.successSignal) && <div className="mt-auto pt-3"><div className="rounded-lg bg-indigo-50 px-2.5 py-2 text-[10px] text-indigo-800 space-y-1">{meta.nextAction && <p><b>다음 행동</b> · {meta.nextAction}</p>}{meta.successSignal && <p><b>성공 신호</b> · {meta.successSignal}</p>}</div></div>}{card[4] === "rejected" && card[5] && <p className="mt-auto pt-3 text-[10px] font-semibold text-rose-700">제외 이유 · {card[5]}</p>}</div>; })}</div></section>; })}</div>
              </div>
              <div className="p-5 border-t border-neutral-200 bg-white flex justify-end gap-2"><button onClick={() => setPreviewExample(null)} className="px-4 py-2 rounded-lg border border-neutral-300 text-sm">닫기</button><button onClick={() => startExample(previewExample)} className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold">이 예시를 복제해 시작</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!project) return null;

  const currentTemplate = TEMPLATES[project.templateId] || TEMPLATES.blank;
  const exampleForProject = EXAMPLES.find((example) => example.templateId === project.templateId);
  const visibleCards = project.cards.filter((card) => card.status !== "archived");
  const briefCount = visibleCards.filter(isBriefIncluded).length;
  const logicReview = buildLogicReview(project);
  const executionSections = project.sections.filter((item) => item.kind === "execution");
  const currentActivityPurpose = ACTIVITY_PURPOSES.find((item) => item.id === activityPurpose) || ACTIVITY_PURPOSES[0];
  const visibleActivityMethods = ACTIVITY_METHODS.filter((item) => item.purposes.includes(currentActivityPurpose.id));

  return (
    <div className="min-h-screen bg-stone-100 text-neutral-900">
      <style>{`@media print { .print-hidden { display:none !important; } .print-page { break-before:page; page-break-before:always; } body { background:#fff !important; } }`}</style>
      <header className="sticky top-0 z-30 bg-stone-100/95 backdrop-blur border-b border-neutral-200 print-hidden">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <button onClick={goLibrary} className="text-xs text-neutral-400 hover:text-neutral-700">← 유형·템플릿</button>
          <div className="flex-1 min-w-[160px] max-w-[420px]">
            <input aria-label="프로젝트 제목" value={project.title} onChange={(event) => updateProject({ title: event.target.value })} className="w-full font-bold bg-transparent outline-none" />
            <p className="text-[10px] text-neutral-500 truncate">{project.templateName}{project.author ? ` · ${project.author}` : ""}</p>
            <input aria-label="캠페인 타깃" value={project.target || ""} onChange={(event) => updateProject({ target: event.target.value })} placeholder="타깃 미입력" className="block w-full bg-transparent text-[10px] text-neutral-500 placeholder:text-neutral-300 outline-none" />
          </div>
          <div className="lg:ml-auto flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-1 overflow-x-auto">
            {[["board", LayoutGrid, "작업 보드"], ["strategy", FileText, "전략 정리"], ["logic", Link2, "연결 점검"], ["brief", BookOpen, "최종 브리프"]].map(([key, Icon, label]) => (
              <button key={key} onClick={() => setView(key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${view === key ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"}`}><Icon size={14} /> {label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden xl:inline text-[10px] text-neutral-400 mr-1">
              {project.lastFileSavedAt
                ? (dirty ? "파일 저장 이후 변경됨 · 임시저장은 이 기기에만 보관" : "파일로 저장됨")
                : (autoSavedAt ? "임시저장 중 · 이 기기에만 보관, 아직 파일로 백업 안 함" : "저장 준비 중")}
            </span>
            <button onClick={saveProjectFile} title="프로젝트 파일 저장" aria-label="프로젝트 파일 저장" className="p-2 rounded-md border border-neutral-300 text-neutral-500 hover:text-neutral-900"><Save size={15} /></button>
            <label title="프로젝트 불러오기" aria-label="프로젝트 불러오기" className="p-2 rounded-md border border-neutral-300 text-neutral-500 hover:text-neutral-900 cursor-pointer"><Upload size={15} /><input type="file" accept="application/json,.json" onChange={importProject} className="hidden" /></label>
          </div>
        </div>
      </header>

      {storageWarning && <div role="alert" className="max-w-[1600px] mx-auto mt-3 px-4 print-hidden"><div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">{storageWarning}</div></div>}
      {!storageWarning && !project.lastFileSavedAt && project.cards.length >= BACKUP_NUDGE_CARD_COUNT && (
        <div role="alert" className="max-w-[1600px] mx-auto mt-3 px-4 print-hidden">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center gap-2">
            <span className="flex-1 min-w-[220px]">카드가 {project.cards.length}장 쌓였는데 아직 파일로 백업하지 않았습니다. 임시저장은 이 브라우저에만 남아 있어, 데이터 삭제나 기기 변경 시 사라질 수 있습니다.</span>
            <button onClick={saveProjectFile} className="shrink-0 rounded-md bg-amber-900 text-white px-3 py-1.5 font-semibold">지금 파일로 저장</button>
          </div>
        </div>
      )}
      {notice && <div role="status" aria-live="polite" className="fixed z-50 top-20 left-1/2 -translate-x-1/2 rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm shadow-lg print-hidden">{notice}</div>}

      {view === "board" && (
        <main className="max-w-[1600px] mx-auto px-4 py-5 print-hidden">
          <div className="flex flex-wrap items-start gap-3 mb-5">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2"><span className="text-xs font-bold text-teal-800">{project.templateName}</span><span className="text-[10px] rounded-full bg-white border border-neutral-200 px-2 py-0.5 text-neutral-500">{visibleCards.length}장 · 브리프 {briefCount}장</span></div>
              <p className="text-xs text-neutral-400 mt-1">{project.templateSource}</p>
            </div>
            <button onClick={() => setShowPrompts((value) => !value)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs ${showPrompts ? "bg-teal-50 border-teal-200 text-teal-800" : "bg-white border-neutral-300 text-neutral-500"}`}><HelpCircle size={14} /> 질문 {showPrompts ? "숨기기" : "보기"}</button>
            {exampleForProject && <button onClick={() => setShowExampleHints((value) => !value)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs ${showExampleHints ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-neutral-300 text-neutral-500"}`}><Lightbulb size={14} /> 예시 힌트</button>}
            <button onClick={() => setActivityOpen((value) => !value)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-600 text-xs"><ListChecks size={14} /> 활동 카드</button>
            <button onClick={addSection} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 text-white text-xs"><Plus size={14} /> 섹션</button>
          </div>

          <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 flex items-center gap-3 text-xs text-teal-950">
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-teal-800 text-white px-3 py-1.5 font-bold"><Bookmark size={15} className="fill-current" /> 브리프 포함</span>
            <p>카드의 이 버튼을 켜면 카드 위치와 상태는 그대로 유지되고, 내용만 <b>최종 브리프</b>에 자동으로 모입니다.</p>
          </div>

          {activityOpen && (
            <section className="mb-5 rounded-2xl bg-white border border-neutral-200 p-5">
              <div className="flex items-start gap-3 mb-5"><div className="flex-1"><h2 className="font-bold">활동 누락 점검</h2><p className="text-xs text-neutral-500 mt-1">먼저 활동이 맡을 역할을 정한 뒤 실행 수단을 고릅니다. 추천이나 일정 관리가 아니라 전략을 빠뜨리지 않기 위한 후보 목록입니다.</p></div><button onClick={() => setActivityOpen(false)} aria-label="활동 카드 닫기" className="text-neutral-400"><X size={16} /></button></div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-neutral-400 mb-2">1. 활동의 역할</p>
                <div className="flex flex-wrap gap-2">{ACTIVITY_PURPOSES.map((item) => <button key={item.id} onClick={() => setActivityPurpose(item.id)} aria-pressed={activityPurpose === item.id} className={`rounded-full border px-3 py-2 text-xs font-semibold ${activityPurpose === item.id ? "bg-teal-800 border-teal-800 text-white" : "bg-white border-neutral-200 text-neutral-600 hover:border-teal-600"}`}>{item.label}</button>)}</div>
                <p className="text-xs text-neutral-500 mt-2">{currentActivityPurpose.desc}</p>
              </div>
              <div className="mt-5">
                <div className="flex flex-wrap items-end gap-3 mb-2">
                  <div className="flex-1"><p className="text-[10px] font-bold tracking-wider text-neutral-400">2. 실행 수단</p><p className="text-xs text-neutral-500 mt-1">추가하면 역할·다음 행동·성공 신호를 작성하는 후보 카드가 됩니다.</p></div>
                  {executionSections.length > 0 && <label className="text-[10px] text-neutral-500">추가할 섹션<select aria-label="활동 카드를 추가할 섹션" value={activityTargetSectionId || executionSections[0].id} onChange={(event) => setActivityTargetSectionId(event.target.value)} className="block mt-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700">{executionSections.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-2">{visibleActivityMethods.map((method) => <button key={method.id} onClick={() => addActivity(method)} className="h-full min-h-24 text-left rounded-xl border border-neutral-200 p-3 hover:border-teal-600 hover:bg-teal-50 flex flex-col"><p className="text-sm font-semibold min-h-10">{method.label}</p><p className="text-[10px] text-neutral-400 mt-auto pt-1">{method.examples}</p></button>)}</div>
              </div>
            </section>
          )}

          <div className="overflow-x-auto pb-3">
            <div className="flex gap-3 min-w-max items-start">
              {project.sections.map((currentSection, sectionIndex) => {
                const sectionCards = cardsForSection(currentSection.id);
                const recommendedCards = CARD_DECKS[currentSection.defaultRole] || CARD_DECKS.note;
                const hintCard = exampleForProject?.cards.find((card) => card[0] === currentSection.id);
                return (
                  <section key={currentSection.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragCardId) patchCard(dragCardId, { sectionId: currentSection.id }); setDragCardId(null); }} className="w-80 shrink-0 rounded-2xl bg-stone-200/70 p-3">
                    {editingSection === currentSection.id ? (
                      <div className="rounded-xl bg-white border border-neutral-200 p-3 mb-3 space-y-2">
                        <input value={currentSection.title} onChange={(event) => patchSection(currentSection.id, { title: event.target.value })} className="w-full font-bold text-sm border-b border-neutral-200 pb-1 outline-none" />
                        <textarea value={currentSection.prompt || ""} onChange={(event) => patchSection(currentSection.id, { prompt: event.target.value })} placeholder="이 섹션의 도움 질문" rows={2} className="w-full text-xs rounded bg-stone-50 p-2 outline-none resize-none" />
                        <div className="flex items-center"><button onClick={() => removeSection(currentSection.id)} className="text-[10px] text-rose-600">섹션 삭제</button><button onClick={() => setEditingSection(null)} className="ml-auto px-2 py-1 rounded bg-neutral-900 text-white text-[10px]">완료</button></div>
                      </div>
                    ) : (
                      <div className="px-1 mb-3">
                        <div className="flex items-center gap-1.5"><span className="text-[10px] font-bold text-teal-800">{String(sectionIndex + 1).padStart(2, "0")}</span><button onClick={() => setEditingSection(currentSection.id)} className="font-bold text-sm text-left hover:text-teal-800">{currentSection.title}</button><span className="ml-auto text-[10px] text-neutral-400">{sectionCards.length}장</span></div>
                        <p className="text-[10px] text-neutral-500 mt-1">{currentSection.desc}</p>
                        <div className="flex items-center gap-1 mt-2"><button disabled={sectionIndex === 0} onClick={() => moveSection(currentSection.id, -1)} className="text-neutral-400 disabled:opacity-20" aria-label="섹션 왼쪽 이동"><ArrowLeft size={12} /></button><button disabled={sectionIndex === project.sections.length - 1} onClick={() => moveSection(currentSection.id, 1)} className="text-neutral-400 disabled:opacity-20" aria-label="섹션 오른쪽 이동"><ArrowRight size={12} /></button></div>
                      </div>
                    )}

                    {showPrompts && currentSection.prompt && (
                      <div className="rounded-xl bg-teal-50 border border-teal-100 p-3 mb-2">
                        <p className="text-xs font-semibold leading-relaxed text-teal-950">{currentSection.prompt}</p>
                        <textarea value={project.drafts?.[currentSection.id] || ""} onChange={(event) => updateProject((prev) => ({ ...prev, drafts: { ...prev.drafts, [currentSection.id]: event.target.value } }))} placeholder="답변을 적으면 바로 카드가 됩니다." rows={2} className="w-full mt-2 text-xs rounded-lg border border-teal-200 bg-white p-2 outline-none resize-y" />
                        <button onClick={() => addPromptCard(currentSection)} className="mt-2 text-[10px] font-bold text-teal-800">답변을 카드로 추가 →</button>
                      </div>
                    )}

                    {showExampleHints && hintCard && (
                      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/80 p-3 mb-2">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-700"><Lightbulb size={11} /> 예시 힌트</div>
                        <p className="text-xs font-semibold mt-1.5">{hintCard[2]}</p>
                        <p className="text-[10px] text-neutral-500 mt-1 line-clamp-3">{hintCard[3]}</p>
                        <button onClick={() => copyExampleCard(hintCard)} className="mt-2 text-[10px] font-bold text-amber-800">내 카드로 복사 →</button>
                      </div>
                    )}

                    <div className="rounded-xl bg-white/55 border border-neutral-200/70 p-2.5 mb-2">
                      <p className="text-[9px] font-bold text-neutral-400 mb-1.5">이 단계의 추천 카드</p>
                      <div className="flex flex-wrap gap-1">{recommendedCards.map(([title, role]) => <button key={`${title}-${role}`} onClick={() => addRecommendedCard(currentSection.id, title, role)} className="rounded-full bg-white border border-neutral-200 px-2 py-1 text-[9px] text-neutral-600 hover:border-teal-600 hover:text-teal-800">+ {title}</button>)}</div>
                    </div>

                    <div className="space-y-2">
                      {sectionCards.map((card, cardIndex) => (
                        <article key={card.id} draggable={editingCard !== card.id} onDragStart={() => setDragCardId(card.id)} onDragEnd={() => setDragCardId(null)} className={`group rounded-xl border p-3 shadow-sm ${STATUSES[card.status]?.card || STATUSES.idea.card}`}>
                          {editingCard === card.id ? (
                            <div className="space-y-2">
                              <input aria-label="카드 제목" autoFocus value={card.title} onChange={(event) => patchCard(card.id, { title: event.target.value })} placeholder="카드 제목" className="w-full font-semibold text-sm bg-transparent border-b border-neutral-300 pb-1 outline-none" />
                              <textarea aria-label="카드 내용" value={card.content || ""} onChange={(event) => patchCard(card.id, { content: event.target.value })} placeholder="내용 · 긴 문단도 작성할 수 있습니다." rows={4} className="w-full text-xs rounded-lg bg-white/70 p-2 outline-none resize-y" />
                              <textarea aria-label="카드 근거와 출처" value={card.evidence || ""} onChange={(event) => patchCard(card.id, { evidence: event.target.value })} placeholder="근거 · 출처 · 데이터" rows={2} className="w-full text-xs rounded-lg bg-teal-50 p-2 outline-none resize-y" />
                              {card.role === "activity" && <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 space-y-2">
                                <div><p className="text-[10px] font-bold text-indigo-800">활동 연결 정보</p><p className="text-[9px] text-indigo-600 mt-0.5">담당자와 일정이 아니라, 이 활동이 왜 필요한지와 다음 행동을 적습니다.</p></div>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="text-[9px] text-neutral-500">활동의 역할<select aria-label="활동의 역할" value={card.activityPurpose || ""} onChange={(event) => patchCard(card.id, { activityPurpose: event.target.value })} className="block w-full mt-1 rounded border border-indigo-200 bg-white p-1.5 text-[10px]"><option value="">역할 선택</option>{ACTIVITY_PURPOSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                                  <label className="text-[9px] text-neutral-500">실행 수단<select aria-label="활동의 실행 수단" value={card.activityMethod || ""} onChange={(event) => patchCard(card.id, { activityMethod: event.target.value })} className="block w-full mt-1 rounded border border-indigo-200 bg-white p-1.5 text-[10px]"><option value="">수단 선택</option>{ACTIVITY_METHODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
                                </div>
                                <input aria-label="활동 이후 다음 행동" value={card.nextAction || ""} onChange={(event) => patchCard(card.id, { nextAction: event.target.value })} placeholder="다음 행동 · 이 활동을 접한 사람을 어디로 이동시킬까요?" className="w-full text-xs rounded border border-indigo-200 bg-white p-2 outline-none" />
                                <input aria-label="활동의 성공 신호" value={card.successSignal || ""} onChange={(event) => patchCard(card.id, { successSignal: event.target.value })} placeholder="성공 신호 · 무엇이 일어나면 유효하다고 판단할까요?" className="w-full text-xs rounded border border-indigo-200 bg-white p-2 outline-none" />
                              </div>}
                              <button onClick={() => patchCard(card.id, { includeInBrief: !isBriefIncluded(card) })} aria-pressed={isBriefIncluded(card)} className={`w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-bold ${isBriefIncluded(card) ? "bg-teal-800 border-teal-800 text-white shadow-sm" : "bg-white/80 border-neutral-300 text-neutral-700 hover:border-teal-700"}`}><Bookmark size={17} className={isBriefIncluded(card) ? "fill-current" : ""} /> {isBriefIncluded(card) ? "최종 브리프에 포함됨" : "최종 브리프에 포함"}</button>
                              <div className="grid grid-cols-2 gap-1.5">
                                <select aria-label="카드 역할" value={card.role} onChange={(event) => patchCard(card.id, { role: event.target.value })} className="text-[10px] rounded border border-neutral-200 bg-white p-1.5 outline-none">{Object.entries(CARD_ROLES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                                <select aria-label="카드 상태" value={card.status} onChange={(event) => patchCard(card.id, { status: event.target.value, rejectionReason: event.target.value === "rejected" ? card.rejectionReason : "" })} className="text-[10px] rounded border border-neutral-200 bg-white p-1.5 outline-none">{Object.entries(STATUSES).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select>
                                <select aria-label="카드 섹션 이동" value={card.sectionId} onChange={(event) => patchCard(card.id, { sectionId: event.target.value })} className="text-[10px] rounded border border-neutral-200 bg-white p-1.5 outline-none">{project.sections.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                                <input aria-label="퍼널 태그" value={card.funnel || ""} onChange={(event) => patchCard(card.id, { funnel: event.target.value })} placeholder="퍼널 태그 (선택)" className="text-[10px] rounded border border-neutral-200 bg-white p-1.5 outline-none" />
                              </div>
                              {card.status === "selected" && <input value={card.decisionReason || ""} onChange={(event) => patchCard(card.id, { decisionReason: event.target.value })} placeholder="대표안으로 선택한 이유" className="w-full text-xs rounded border border-amber-200 bg-amber-50 p-2 outline-none" />}
                              {card.status === "rejected" && <div className="space-y-1"><select value={REJECTION_REASONS.includes(card.rejectionReason) ? card.rejectionReason : "직접 입력"} onChange={(event) => patchCard(card.id, { rejectionReason: event.target.value })} className="w-full text-xs rounded border border-rose-200 bg-rose-50 p-2 outline-none"><option value="">탈락 이유</option>{REJECTION_REASONS.map((item) => <option key={item}>{item}</option>)}</select>{(!REJECTION_REASONS.includes(card.rejectionReason) || card.rejectionReason === "직접 입력") && <input value={card.rejectionReason === "직접 입력" ? "" : card.rejectionReason || ""} onChange={(event) => patchCard(card.id, { rejectionReason: event.target.value })} placeholder="탈락 이유 직접 입력" className="w-full text-xs rounded border border-rose-200 bg-white p-2 outline-none" />}</div>}
                              <div className="rounded-lg bg-white/70 border border-neutral-200 p-2">
                                <p className="text-[10px] font-bold text-neutral-500 flex items-center gap-1 mb-1.5"><Link2 size={11} /> 논리 관계</p>
                                <div className="flex gap-1"><select value={linkDraft.type} onChange={(event) => setLinkDraft((prev) => ({ ...prev, type: event.target.value }))} className="w-24 text-[9px] rounded border border-neutral-200 p-1"><option value="">관계</option>{Object.entries(LINK_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select value={linkDraft.targetId} onChange={(event) => setLinkDraft((prev) => ({ ...prev, targetId: event.target.value }))} className="min-w-0 flex-1 text-[9px] rounded border border-neutral-200 p-1"><option value="">연결 카드</option>{project.cards.filter((item) => item.id !== card.id).map((item) => <option key={item.id} value={item.id}>{item.title || "제목 없음"}</option>)}</select><button onClick={() => addRelation(card.id)} className="px-2 rounded bg-neutral-900 text-white text-[9px]">추가</button></div>
                                {!!card.links?.length && <div className="mt-2 space-y-1">{card.links.map((link) => { const target = project.cards.find((item) => item.id === link.targetId); return <div key={`${link.type}-${link.targetId}`} className="flex items-center gap-1 text-[9px] text-neutral-500"><b>{LINK_TYPES[link.type]}</b><span className="truncate">→ {target?.title || "삭제된 카드"}</span><button onClick={() => patchCard(card.id, { links: card.links.filter((item) => !(item.type === link.type && item.targetId === link.targetId)) })} className="ml-auto text-neutral-300"><X size={10} /></button></div>; })}</div>}
                              </div>
                              <div className="flex items-center"><button onClick={() => removeCard(card.id)} className="text-[10px] text-rose-600">삭제</button><button onClick={() => { setEditingCard(null); setLinkDraft({ type: "therefore", targetId: "" }); }} className="ml-auto px-3 py-1 rounded bg-neutral-900 text-white text-[10px]">완료</button></div>
                            </div>
                          ) : (
                            <div onClick={() => setEditingCard(card.id)} className="min-h-[176px] flex flex-col">
                              <div className="min-h-12 flex items-start gap-1.5"><p className="flex-1 text-sm font-semibold leading-snug">{card.title || <span className="text-neutral-300">제목 없음</span>}</p><button onClick={(event) => { event.stopPropagation(); patchCard(card.id, { includeInBrief: !isBriefIncluded(card) }); }} aria-label={isBriefIncluded(card) ? "브리프에서 제외" : "브리프에 포함"} aria-pressed={isBriefIncluded(card)} title={isBriefIncluded(card) ? "브리프에 포함됨" : "브리프에 포함"} className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${isBriefIncluded(card) ? "bg-teal-800 border-teal-800 text-white shadow-sm" : "bg-white/80 border-neutral-300 text-neutral-600 hover:border-teal-700 hover:text-teal-800"}`}><Bookmark size={14} className={isBriefIncluded(card) ? "fill-current" : ""} /> 브리프</button><span className={`text-[9px] rounded-full border px-1.5 py-0.5 ${STATUSES[card.status]?.badge}`}>{STATUSES[card.status]?.label}</span></div>
                              <div className="flex-1">{card.content && <p className="text-xs text-neutral-500 leading-relaxed mt-1.5 line-clamp-5 whitespace-pre-wrap">{card.content}</p>}
                              {card.evidence && <p className="text-[10px] text-teal-800 bg-teal-50 rounded px-2 py-1 mt-1.5 line-clamp-2">근거: {card.evidence}</p>}
                              {card.role === "activity" && (card.nextAction || card.successSignal) && <div className="mt-1.5 rounded-lg bg-indigo-50 px-2 py-1.5 text-[10px] text-indigo-800 space-y-0.5">{card.nextAction && <p><b>다음 행동</b> · {card.nextAction}</p>}{card.successSignal && <p><b>성공 신호</b> · {card.successSignal}</p>}</div>}
                              {card.rejectionReason && card.status === "rejected" && <p className="text-[10px] text-rose-700 mt-1.5">탈락: {card.rejectionReason}</p>}</div>
                              <div className="flex items-center gap-1 mt-auto pt-2"><span className="text-[9px] rounded-full bg-white/70 px-1.5 py-0.5 text-neutral-500">{CARD_ROLES[card.role] || card.role}</span>{card.role === "activity" && card.activityPurpose && <span className="text-[9px] rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-700">{activityPurposeLabel(card.activityPurpose)}</span>}{card.funnel && <span className="text-[9px] rounded-full bg-white/70 px-1.5 py-0.5 text-neutral-500">{card.funnel}</span>}{!!card.links?.length && <span className="text-[9px] rounded-full bg-white/70 px-1.5 py-0.5 text-neutral-500 flex items-center gap-0.5"><Link2 size={9} /> {card.links.length}</span>}<span className="ml-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex gap-0.5"><button aria-label="카드를 위로 이동" disabled={cardIndex === 0} onClick={(event) => { event.stopPropagation(); moveCardWithin(card.id, -1); }} className="text-neutral-400 disabled:opacity-20"><ArrowLeft size={12} className="rotate-90" /></button><button aria-label="카드를 아래로 이동" disabled={cardIndex === sectionCards.length - 1} onClick={(event) => { event.stopPropagation(); moveCardWithin(card.id, 1); }} className="text-neutral-400 disabled:opacity-20"><ArrowRight size={12} className="rotate-90" /></button><button aria-label="카드 보관" onClick={(event) => { event.stopPropagation(); patchCard(card.id, { status: "archived" }); }} title="보관" className="text-neutral-400"><Archive size={12} /></button></span></div>
                            </div>
                          )}
                        </article>
                      ))}
                      <button onClick={() => addCard(currentSection.id)} className="w-full rounded-xl border border-dashed border-neutral-300 py-2 text-xs text-neutral-400 hover:border-teal-700 hover:text-teal-800 flex items-center justify-center gap-1"><Plus size={13} /> 카드</button>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center text-[10px] text-neutral-400 mt-3"><span>카드를 다른 섹션으로 드래그</span><span>브리프 핀을 켜면 최종 브리프에 자동 포함</span><span>질문 답변은 해당 섹션 카드로 생성</span><button onClick={() => updateProject((prev) => ({ ...prev, cards: prev.cards.map((card) => card.status === "archived" ? { ...card, status: "idea" } : card) }))} className="ml-auto flex items-center gap-1 text-neutral-500"><RotateCcw size={11} /> 보관 카드 복원</button></div>
        </main>
      )}

      {view === "logic" && (
        <main className="max-w-5xl mx-auto px-4 py-8 print-hidden">
          <div className="flex flex-wrap items-start gap-3 mb-6">
            <div className="flex-1 min-w-[260px]"><p className="text-[10px] tracking-[0.18em] text-teal-800 font-bold">LOGIC CONNECTION REVIEW</p><h2 className="text-2xl font-bold mt-1">논리 연결 점검</h2><p className="text-sm text-neutral-500 mt-2 max-w-3xl leading-relaxed">특정 마케팅 프레임워크의 정답이나 점수를 제시하지 않습니다. 지금 작성한 목표·근거·전략·활동이 끊기지 않고 이어지는지만 확인합니다.</p></div>
            <button onClick={() => setView("board")} className="rounded-lg bg-neutral-900 text-white px-4 py-2.5 text-sm font-semibold">보드에서 보완</button>
          </div>

          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {logicReview.checks.map((item) => { const style = LOGIC_CHECK_STYLES[item.status]; return <article key={item.id} className={`h-full min-h-36 rounded-2xl border p-4 flex flex-col ${style.card}`}>
              <div className="flex items-center gap-2"><span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${style.icon}`}>{item.status === "connected" ? <Check size={15} /> : item.status === "needs-review" ? <HelpCircle size={15} /> : <span aria-hidden="true">–</span>}</span><h3 className="font-bold text-sm">{item.label}</h3><span className={`ml-auto text-[9px] rounded-full px-2 py-1 font-bold ${style.badge}`}>{style.label}</span></div>
              <p className="text-xs text-neutral-600 leading-relaxed mt-auto pt-3">{item.detail}</p>
            </article>; })}
          </section>

          <section className="mt-6 rounded-2xl bg-white border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-200"><h3 className="font-bold">전략에서 실행까지</h3><p className="text-xs text-neutral-500 mt-1">활동 카드를 기준으로 연결된 전략, 맡은 역할, 다음 행동, 성공 신호를 한 줄로 확인합니다.</p></div>
            {logicReview.activityChains.length ? <div className="divide-y divide-neutral-100">{logicReview.activityChains.map(({ card, strategies }) => <button key={card.id} onClick={() => { setView("board"); setEditingCard(card.id); }} className="w-full text-left p-5 hover:bg-stone-50">
              <div className="grid md:grid-cols-[1.2fr_1fr_1.2fr_1.2fr] gap-3 items-stretch">
                <div className="min-h-32 rounded-xl bg-stone-50 border border-neutral-100 p-3 flex flex-col"><p className="text-[9px] font-bold tracking-wider text-neutral-400">연결된 전략</p>{strategies.length ? <div className="mt-auto pt-2 space-y-1">{strategies.map((strategy) => <p key={strategy.id} className="text-xs font-semibold text-teal-800">{strategy.title || "제목 없음"}</p>)}</div> : <p className="text-xs text-amber-700 mt-auto pt-2">논리 관계를 연결해 주세요.</p>}</div>
                <div className="min-h-32 rounded-xl bg-stone-50 border border-neutral-100 p-3 flex flex-col"><p className="text-[9px] font-bold tracking-wider text-neutral-400">활동</p><div className="mt-auto pt-2"><p className="text-sm font-semibold">{card.title || "제목 없음"}</p><p className="text-[10px] text-indigo-700 mt-1">{activityPurposeLabel(card.activityPurpose)}{card.activityMethod ? ` · ${activityMethodLabel(card.activityMethod)}` : ""}</p></div></div>
                <div className="min-h-32 rounded-xl bg-stone-50 border border-neutral-100 p-3 flex flex-col"><p className="text-[9px] font-bold tracking-wider text-neutral-400">다음 행동</p><p className={`text-xs mt-auto pt-2 leading-relaxed ${card.nextAction ? "text-neutral-700" : "text-amber-700"}`}>{card.nextAction || "다음 행동을 적어주세요."}</p></div>
                <div className="min-h-32 rounded-xl bg-stone-50 border border-neutral-100 p-3 flex flex-col"><p className="text-[9px] font-bold tracking-wider text-neutral-400">성공 신호</p><p className={`text-xs mt-auto pt-2 leading-relaxed ${card.successSignal ? "text-neutral-700" : "text-amber-700"}`}>{card.successSignal || "판단할 신호를 적어주세요."}</p></div>
              </div>
            </button>)}</div> : <div className="p-10 text-center"><ListChecks size={22} className="mx-auto text-neutral-300" /><p className="font-semibold mt-3">아직 점검할 활동이 없습니다.</p><p className="text-xs text-neutral-500 mt-1">작업 보드의 활동 누락 점검에서 역할과 실행 수단을 선택해 후보 카드를 추가하세요.</p></div>}
          </section>

          <div className="mt-4 rounded-xl border border-neutral-200 bg-stone-50 px-4 py-3 text-xs text-neutral-500 leading-relaxed"><b className="text-neutral-700">판정 원칙</b> · 내용의 정답을 평가하지 않고 입력 여부와 카드 간 논리 관계만 확인합니다. 경고는 작업을 막지 않으며 외부 프레임워크에서 만든 판단을 다시 쓰게 하지 않습니다.</div>
        </main>
      )}

      {(view === "strategy" || view === "brief") && (
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center gap-2 mb-4 print-hidden">
            <div className="flex-1 min-w-[240px]"><h2 className="font-bold">{view === "strategy" ? "전략 정리" : "최종 브리프"}</h2><p className="text-xs text-neutral-500">{view === "strategy" ? "보드의 모든 카드를 섹션 순서대로 검토합니다." : "보드에서 브리프 핀을 켠 카드만 자동으로 모입니다."}</p></div>
            <button onClick={() => setShowEvidence((value) => !value)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm ${showEvidence ? "bg-teal-50 border-teal-300 text-teal-800" : "bg-white border-neutral-300 text-neutral-500"}`}>근거 {showEvidence ? "숨기기" : "포함"}</button>
            <button onClick={copyMarkdown} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-neutral-300 text-sm">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "복사됨" : "Markdown"}</button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm"><Printer size={14} /> 인쇄·PDF</button>
          </div>

          <article className="rounded-2xl bg-white border border-neutral-200 p-7 sm:p-10 shadow-sm print:border-0 print:shadow-none">
            <p className="text-[10px] tracking-[0.18em] text-teal-800 font-bold">{view === "strategy" ? "STRATEGY REVIEW" : "FINAL BRIEF"}</p>
            <h1 className="text-3xl font-bold mt-2">{project.title}</h1>
            <p className="text-sm text-neutral-500 mt-2">{project.templateName}{project.author ? ` · ${project.author}` : ""}</p>
            <p className="text-sm text-neutral-500 mt-1">타깃: {project.target || "-"}</p>
            <p className="text-[10px] text-neutral-400 mt-2">{project.templateSource}</p>

            <div className="mt-10 space-y-8">
              {project.sections.map((item, index) => {
                const cards = cardsForSection(item.id).filter((card) => view === "brief" ? isBriefIncluded(card) : true);
                if (!cards.length) return null;
                return <section key={item.id}><div className="flex items-baseline gap-2 border-b border-neutral-200 pb-2 mb-3"><span className="text-xs font-bold text-neutral-300">{String(index + 1).padStart(2, "0")}</span><h2 className="font-bold">{item.title}</h2></div><div className="space-y-3">{cards.map((card) => <div key={card.id} className={view === "strategy" ? "rounded-lg bg-stone-50 border border-neutral-100 p-3" : ""}><div className="flex items-start gap-2"><p className="font-semibold flex-1">{card.title}</p>{view === "strategy" && <><span className={`text-[9px] rounded-full border px-1.5 py-0.5 ${STATUSES[card.status]?.badge}`}>{STATUSES[card.status]?.label}</span>{isBriefIncluded(card) && <span className="text-[9px] rounded-full bg-teal-800 text-white px-1.5 py-0.5 flex items-center gap-0.5"><Bookmark size={9} className="fill-current" /> 브리프</span>}</>}</div>{card.content && <p className="text-sm text-neutral-600 mt-1 whitespace-pre-wrap">{card.content}</p>}{card.role === "activity" && (card.activityPurpose || card.nextAction || card.successSignal) && <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800 space-y-1">{card.activityPurpose && <p><b>역할</b> · {activityPurposeLabel(card.activityPurpose)}{card.activityMethod ? ` · ${activityMethodLabel(card.activityMethod)}` : ""}</p>}{card.nextAction && <p><b>다음 행동</b> · {card.nextAction}</p>}{card.successSignal && <p><b>성공 신호</b> · {card.successSignal}</p>}</div>}{showEvidence && card.evidence && <p className="text-xs text-teal-800 mt-1.5 rounded bg-teal-50 px-2 py-1.5">근거: {card.evidence}</p>}{view === "strategy" && card.decisionReason && <p className="text-xs text-amber-700 mt-1.5">선택 이유: {card.decisionReason}</p>}{view === "strategy" && card.rejectionReason && <p className="text-xs text-rose-700 mt-1.5">탈락 이유: {card.rejectionReason}</p>}{view === "strategy" && !!card.links?.length && <div className="mt-2 text-[10px] text-neutral-400">{card.links.map((link) => { const target = project.cards.find((targetCard) => targetCard.id === link.targetId); return <p key={`${link.type}-${link.targetId}`}>{LINK_TYPES[link.type]} → {target?.title || "삭제된 카드"}</p>; })}</div>}</div>)}</div></section>;
              })}
            </div>
            {view === "brief" && briefCount === 0 && <div className="mt-10 rounded-xl border border-dashed border-neutral-300 p-8 text-center"><Bookmark size={22} className="mx-auto text-neutral-300" /><p className="font-semibold mt-3">아직 브리프에 포함한 카드가 없습니다.</p><p className="text-xs text-neutral-500 mt-1">작업 보드에서 카드 우측 상단의 브리프 핀을 눌러주세요.</p></div>}
          </article>
        </main>
      )}
    </div>
  );
}

export { ACTIVITY_METHODS, ACTIVITY_PURPOSES, EXAMPLES, SCHEMA_VERSION, TEMPLATES, buildLogicReview, createProject, normalizeImported, templateLabel };
