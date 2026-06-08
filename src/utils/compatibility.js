// src/utils/compatibility.js
import { classifyFiveElements } from './similarity';

// Five Elements generation (상생) and restriction (상극) definitions
const RELATIONSHIP_MATRIX = {
  mok: { // Wood
    mok: { score: 80, type: "비견(동일) 관계", couple: "서로 지적이고 생각이 깊어 깊은 대화가 통하는 커플입니다. 단, 고집이 세서 부딪칠 수 있습니다.", partner: "서로 기획력과 창의력이 뛰어나 두뇌 회전이 대단히 빠른 동료입니다. 추진 시 각자의 고집을 꺾어야 조화롭습니다." },
    hwa: { score: 95, type: "상생(생성) 관계", couple: "나무가 불을 틔우듯(목생화), 목형의 이성과 지혜가 화형의 열정과 추진력을 부드럽게 지탱하고 격려해 주는 최상의 찰떡 궁합입니다.", partner: "목형이 기획하고 화형이 추진하는 최고의 비즈니스 시너지입니다. 서로의 속도 차이만 존중한다면 불가능이 없습니다." },
    to: { score: 55, type: "상극(억제) 관계", couple: "나무가 흙을 파고들듯(목극토), 지적이고 분석적인 목형이 포용력 있는 토형의 성격을 다소 옥죄거나 잔소리를 할 수 있어 양보가 필요한 관계입니다.", partner: "토형의 우직한 추진을 목형의 날카로운 잣대로 비판하여 마찰이 생길 수 있습니다. 토형의 큰 그릇을 믿어주어야 합니다." },
    geum: { score: 60, type: "상극(억제) 관계", couple: "도끼가 나무를 찌르듯(금극목), 추진력 강하고 엄격한 금형의 기준이 감성적이고 지적인 목형에게 상처를 주기 쉽습니다. 대화 시 유연성이 필수입니다.", partner: "금형의 결단력과 목형의 분석력이 조화를 이루면 강하지만, 자칫 지시와 반발의 구도로 가기 쉽습니다. 명확한 R&R 분리가 답입니다." },
    su: { score: 90, type: "상생(생성) 관계", couple: "물줄기가 나무를 기르듯(수생목), 유연하고 적응력 강한 수형이 지적이고 곧은 목형의 자존심을 잘 채워주고 감싸안는 풍요롭고 평온한 궁합입니다.", partner: "수형의 친화력과 넓은 대인 인맥이 목형의 정교한 시스템 구축과 만나 탄탄한 경영 및 관리 체계를 완성하는 환상적인 파트너입니다." }
  },
  hwa: { // Fire
    mok: { score: 95, type: "상생(생성) 관계", couple: "불이 나무를 얻듯(목생화), 목형의 영리하고 차분한 조언이 화형의 열정적이고 성급한 다혈질 성미를 부드럽게 감싸안아 성공으로 이끄는 조합입니다.", partner: "화형의 돌파력과 리더십을 목형의 주도면밀한 기획력이 뒤받쳐주어, 사업을 영위하고 확장하는 데 최고의 보완재 역할을 합니다." },
    hwa: { score: 75, type: "비견(동일) 관계", couple: "두 개의 불꽃이 만난 것처럼 매우 활기차고 첫눈에 타오르는 사랑을 하지만, 의견 대립 시 불같이 싸울 수 있어 감정 조절이 필요합니다.", partner: "사교성과 행동력이 극대화되어 영업이나 홍보에 압도적이지만, 리스크 관리가 안 될 수 있습니다. 냉철한 제3자의 중재가 필요합니다." },
    to: { score: 92, type: "상생(생성) 관계", couple: "불이 흙을 따뜻하게 하듯(화생토), 화형의 밝은 에너지와 표현력이 묵묵하고 우직한 토형에게 활력소가 되며, 토형은 화형의 감정 기복을 단단히 받아줍니다.", partner: "표현력이 강한 화형이 마케팅과 대외 영업을 맡고, 토형이 내부 자금 및 경영 관리를 우직하게 도맡아 훌륭한 기업 구조를 이뤄냅니다." },
    geum: { score: 50, type: "상극(억제) 관계", couple: "화기가 쇠를 녹이듯(화극금), 성격 급한 화형의 감정적 분출이 책임감 강하고 원칙적인 금형을 지치게 하기 쉽습니다. 서로의 성향차를 다름으로 인정해야 합니다.", partner: "금형의 냉철한 원칙주의와 화형의 감성주의가 사사건건 충돌할 우려가 있습니다. 감정을 배제하고 숫자로 소통해야 성공합니다." },
    su: { score: 65, type: "상극(억제) 관계", couple: "물이 불을 끄듯(수극화), 유연하고 현실적인 수형의 처세가 명예와 열정을 중시하는 화형의 자존심을 건드리기 쉬워 사소한 말다툼이 잦을 수 있습니다.", partner: "수형의 자유로운 융통성이 화형의 불같은 원칙적 목표 설정에 태클을 걸 수 있습니다. 서로의 행동 방식을 사전에 조율해야 합니다." }
  },
  to: { // Earth
    mok: { score: 55, type: "상극(억제) 관계", couple: "나무가 흙의 영양분을 뺏듯(목극토), 차분하고 말이 없는 토형이 분석적이고 자기주장이 뚜렷한 목형에게 주도권을 빼앗겨 답답함을 느끼기 쉽습니다.", partner: "토형의 안정 지향적 성향과 목형의 새로운 혁신 시도가 맞부딪칩니다. 조율 없는 독단적 결정은 사업 파탄을 부릅니다." },
    hwa: { score: 92, type: "상생(생성) 관계", couple: "불이 흙을 구워 도자기를 만들듯(화생토), 화형의 열정적인 표현과 로맨틱함이 묵묵한 토형을 감동시키며 평생 기댈 수 있는 편안한 연분을 이룹니다.", partner: "화형이 비전을 제시하고 트렌드를 읽어오면, 토형이 이를 구체화하여 끈기 있게 실행해 내는 환상의 콤비입니다." },
    to: { score: 85, type: "비견(동일) 관계", couple: "서로 넓고 우직한 대지 같아 안정감 있고 오랜 친구 같은 연애를 이어가지만, 지나치게 정체되어 권태로움을 느낄 수 있으니 여행이나 취미 공유가 좋습니다.", partner: "안정성과 신용도가 매우 높아 오래가는 동업 관계를 유지합니다. 다만, 리스크를 피하려다 새로운 시장 진출 기회를 놓칠 수 있습니다." },
    geum: { score: 95, type: "상생(생성) 관계", couple: "흙 속에서 단단한 바위(철광석)가 나오듯(토생금), 토형의 넓은 포용력과 신용이 고집스럽고 원칙적인 금형의 날카로운 성정을 부드럽게 길들여 상생하는 최길(最吉)의 관계입니다.", partner: "토형의 탄탄한 자본/인력 관리 기반 위에 금형의 신속하고 칼 같은 결단 및 실행력이 더해져 시장 점유율을 돌파해 내는 최강의 비즈니스 궁합입니다." },
    su: { score: 58, type: "상극(억제) 관계", couple: "댐(흙)이 물길을 막아 가두듯(토극수), 자유롭고 융통성 있는 수형의 처세가 보수적이고 신의를 따지는 토형의 눈에는 다소 가벼워 보여 마찰이 생길 수 있습니다.", partner: "수형의 임기응변식 영업 방식과 토형의 절차 중시 관리가 충돌합니다. 각자의 전문 영역을 철저히 터치하지 않아야 합니다." }
  },
  geum: { // Metal
    mok: { score: 60, type: "상극(억제) 관계", couple: "도끼가 나무를 베어 쓰러뜨리듯(금극목), 성격이 날카롭고 추진력 강한 금형이 여리고 지적인 목형의 마음을 본의 아니게 아프게 하는 상처의 궁합입니다. 다정한 말씨가 요구됩니다.", partner: "금형의 결단 독주가 목형의 세밀하고 정교한 분석 설계를 덮어버려 설계 부실이 생길 수 있습니다. 목형의 데이터 피드백을 귀담아들으십시오." },
    hwa: { score: 50, type: "상극(억제) 관계", couple: "용광로가 무쇠를 쇠붙이로 녹이듯(화극금), 감정과 사교성 위주인 화형의 다혈질 성정이 이성적이고 독립적인 금형의 성격을 자극하여 사소한 일이 자존심 싸움으로 커집니다.", partner: "서로 스타일이 완전히 극과 극입니다. 업무 협력 시 서로 감정적인 비판을 자제하고 이메일이나 메신저 등 서면 기록 기반으로 소통해야 안전합니다." },
    to: { score: 95, type: "상생(생성) 관계", couple: "대지가 광석을 품어 보호하듯(토생금), 포용력 깊고 묵묵한 토형의 성격이 추진력 강하지만 외로운 독고다이 기질의 금형에게 심리적인 안식처를 주는 대길의 결합입니다.", partner: "서로에 대한 의리와 신용이 철저하여 자금 거래나 동업 시 동반 성장하는 최고의 궁합입니다. 토형이 지지하고 금형이 칼자루를 쥐면 승리합니다." },
    geum: { score: 78, type: "비견(동일) 관계", couple: "두 개의 칼이 부딪치는 소리가 나듯 성격이 강하고 주체성이 뚜렷합니다. 싸울 때는 차갑고 냉정하게 돌아서지만, 서로의 신의를 높이 사 한 번 신뢰하면 단단한 관계를 유지합니다.", partner: "업무 추진력은 1등이지만 각자 고집이 워낙 강해 결정을 내리기 어려울 수 있습니다. 서열 구조나 결정권 비율을 확실히 나누어야 합니다." },
    su: { score: 90, type: "상생(생성) 관계", couple: "금속 표면에 이슬이 맺히듯(금생수), 책임감 있고 추진력 강한 금형의 강인함을 유연하고 사교적인 수형이 윤활유처럼 부드럽게 녹여주어 화합하는 훌륭한 조화입니다.", partner: "금형이 강력한 우량 제품이나 원천 기술을 생산하면, 수형이 화려한 언변과 인맥으로 외부 판로를 개척하여 막대한 매출을 일궈내는 상호 보완 파트너입니다." }
  },
  su: { // Water
    mok: { score: 90, type: "상생(생성) 관계", couple: "강물이 나무의 뿌리를 축여 자라게 하듯(수생목), 지혜롭고 융통성 있는 수형이 원칙을 중시하며 곧은 목형을 심리적으로 든든히 보필하고 성장시키는 평온한 궁합입니다.", partner: "수형의 상황 대처 능력과 정보력, 목형의 정밀한 실행 기획과 문서 체계가 융합되어 어떤 사업 기회든 체계적인 수익 구조로 뽑아내는 콤비입니다." },
    hwa: { score: 65, type: "상극(억제) 관계", couple: "찬물이 뜨거운 불을 급격히 끄듯(수극화), 감정적이고 자존심 센 화형이 현실적이고 유연하며 다소 냉정한 수형의 언사에서 서운함을 느끼고 돌아서기 쉽습니다.", partner: "목표 지향적인 화형과 과정 및 친화 지향적인 수형이 갈등하기 쉽습니다. 일정을 문서화하고 명확한 중간 조율자를 두어야 관계가 유지됩니다." },
    to: { score: 58, type: "상극(억제) 관계", couple: "흙이 맑은 물줄기를 덮쳐 탁하게 만들듯(토극수), 자유롭고 대인관계 위주인 수형의 융통성이 보수적이고 신의와 원칙을 고집스럽게 지키는 토형에게 집착이나 답답함으로 다가옵니다.", partner: "토형의 보수적인 예산 운용이 수형의 자유로운 마케팅 활동을 제한하여 마찰을 부릅니다. 예산 집행 한도를 미리 조율해야 동업이 유지됩니다." },
    geum: { score: 90, type: "상생(생성) 관계", couple: "바위가 맑은 옹달샘을 솟아나게 하듯(금생수), 단단하고 결단력 있는 금형의 책임감이 부드럽고 융통성 높은 수형에게 깊은 안전감과 믿음을 주어 행복한 연을 유지합니다.", partner: "금형의 확실한 품질 보증 및 리스크 차단 본능과 수형의 적극적이고 매끄러운 영업 활동이 조화를 이루어 롱런하는 튼튼한 조합입니다." },
    su: { score: 80, type: "비견(동일) 관계", couple: "두 물줄기가 만나 거대한 강을 이루듯 융통성과 대인관계 능력이 최고입니다. 유유자적하고 즐거운 라이프스타일을 공유하지만, 재물 관리에 소홀할 수 있어 조심해야 합니다.", partner: "아이디어가 무궁무진하고 사교성이 뛰어나 외부 미팅 및 영업에 강력합니다. 다만 실질적인 뼈대를 잡고 실행할 관리형 직원이 보완되어야 사업이 유지됩니다." }
  }
};

/**
 * Evaluates the compatibility between two individuals based on their raw metric values.
 * @param {Object} rawA Raw metrics of subject A
 * @param {Object} rawB Raw metrics of subject B
 * @param {string} type 'couple' or 'partner'
 * @returns {Object} Compatibility result
 */
export function evaluateCompatibility(rawA, rawB, type = 'couple') {
  // Classify elements
  const elemA = classifyFiveElements(rawA);
  const elemB = classifyFiveElements(rawB);

  const typeA = elemA.type;
  const typeB = elemB.type;

  // Base score and description from matrix
  const matrixMatch = RELATIONSHIP_MATRIX[typeA]?.[typeB] || { score: 70, type: "일반 조화 관계", couple: "서로 평이하고 무난한 흐름을 보이는 조화로운 연인 관상입니다.", partner: "평범하고 무난하게 협력하며 일해 나갈 수 있는 비즈니스 파트너 관계입니다." };

  let baseScore = matrixMatch.score;
  const relationTypeName = matrixMatch.type;
  const descriptionText = type === 'couple' ? matrixMatch.couple : matrixMatch.partner;

  // UI adjustments based on secondary physical features (micro-compatibility)
  let scoreAdjustment = 0;
  const reasons = [];

  // 1. Eyebrow expression & intensity (Brow center z-gap & slant)
  const eyebrowDiff = Math.abs((rawA.eyebrow_slant || 0) - (rawB.eyebrow_slant || 0));
  if (eyebrowDiff < 0.04) {
    // Both have similar eyebrow expressions (either both gentle or both active)
    scoreAdjustment += 3;
    reasons.push(type === 'couple' ? "눈썹 각도와 결이 닮아 서로 첫인상부터 호감을 크게 느꼈을 것입니다." : "의지력과 행동 지향점이 비슷해 프로젝트 돌파 시 주저함이 없습니다.");
  } else {
    // Complementary
    scoreAdjustment += 2;
    reasons.push(type === 'couple' ? "한 사람의 강단과 다른 사람의 차분한 눈썹 관상이 조화를 이루며 서로를 보완합니다." : "한 사람은 과감하고 한 사람은 신중하여 상호 보안 리스크 필터링이 가능합니다.");
  }

  // 2. Mouth corners (Smile slant / positivity)
  const mouthSlantA = rawA.mouth_corner_slant || 0;
  const mouthSlantB = rawB.mouth_corner_slant || 0;
  if (mouthSlantA > 0.02 && mouthSlantB > 0.02) {
    scoreAdjustment += 4;
    reasons.push("두 사람 모두 입꼬리가 위를 향하는 양월구(陽月口) 관상을 지녀 함께 있으면 긍정적인 복과 재물이 배가됩니다.");
  } else if (Math.abs(mouthSlantA - mouthSlantB) > 0.06) {
    scoreAdjustment += 1;
    reasons.push("한 사람의 묵묵함과 다른 사람의 밝고 사교적인 표정이 어우러져 일상의 지루함을 달래 줍니다.");
  }

  // 3. Eye corner slants (Eye shapes: sharp vs round)
  const eyeSlantA = rawA.eye_corner_slant || 0;
  const eyeSlantB = rawB.eye_corner_slant || 0;
  const eyeSlantDiff = Math.abs(eyeSlantA - eyeSlantB);
  if (eyeSlantDiff > 0.06) {
    scoreAdjustment += 3;
    reasons.push(type === 'couple' ? "눈 모양의 개성이 서로 달라(한 사람은 날카롭고 이성적, 한 사람은 둥글고 감성적) 질리지 않는 깊은 매력을 느낍니다." : "한 사람은 날카로운 피드백을 맡고 한 사람은 대인 친화를 맡아 외부 고객 대응에 최적입니다.");
  } else {
    scoreAdjustment += 1;
    reasons.push("관조하는 눈매의 흐름과 사물을 보는 통찰 코드가 같아 깊은 침묵 속에서도 통하는 신뢰가 있습니다.");
  }

  const finalScore = Math.max(30, Math.min(99, baseScore + scoreAdjustment));

  // Determine warnings/advice bullet points
  const warnings = [];
  if (relationTypeName.includes("상극")) {
    if (type === 'couple') {
      warnings.push("의견 대립 시 즉각적인 감정 표현을 삼가고, 3시간 정도 생각의 정리 기간을 가진 뒤 차분히 대화하십시오.");
      warnings.push("상대방의 자존심이나 아킬레스건을 건드리는 직설적인 조언보다 '내가 속상했다'는 I-Message 화법이 훌륭한 개운법입니다.");
    } else {
      warnings.push("공적인 예산 집행이나 업무 분담(R&R)에 대해 계약서나 문서로 완벽히 명문화해 두어야 트러블을 예방합니다.");
      warnings.push("상대방이 추진하는 업무 방식이 마음에 들지 않더라도 일단 1차 보고 시점까지는 격려하고 기다려주는 인내가 성공을 부릅니다.");
    }
  } else if (relationTypeName.includes("비견") || relationTypeName.includes("동일")) {
    if (type === 'couple') {
      warnings.push("서로 가치관이나 성격이 너무 닮았기 때문에 자칫 권태기가 올 수 있으니 매년 새로운 장소로의 여행을 계획해 보세요.");
      warnings.push("둘 다 고집이 차오르는 시점에는 제3자의 객관적인 조언을 듣는 조율 기조를 미리 약속해 두면 좋습니다.");
    } else {
      warnings.push("둘 다 장점과 단점이 겹치므로 리스크 관리나 마케팅 중 비어있는 파트에 대해 외부 전문가의 조언을 정기적으로 수용하십시오.");
      warnings.push("아이디어가 좋지만 문서화나 뒤처리가 약할 수 있으니 끈기 있게 서포트할 수 있는 보완 직원을 팀에 합류시키는 것을 추천합니다.");
    }
  } else { // 상생
    if (type === 'couple') {
      warnings.push("원체 궁합이 부드러워 서로에게 지나치게 의존하다가 중요한 경제적 결정 시기를 놓치지 않도록 이성적인 점검도 잊지 마세요.");
      warnings.push("서로 돕는 에너지(목생화, 화생토 등)를 지속시키기 위해 서로의 배려에 늘 고마움을 언어로 꼼꼼히 표현하십시오.");
    } else {
      warnings.push("사업이 너무 잘 풀린다고 자만하지 말고, 상생의 기운이 극에 달했을 때 이익의 일부를 리스크 대비 준비금으로 단단히 저축해 두십시오.");
      warnings.push("서로에 대한 예의와 파트너십이 과해져 쓴소리를 해야 할 골든타임을 넘기지 않도록 매 분기 냉정하게 성과를 대조하십시오.");
    }
  }

  return {
    score: finalScore,
    elemA: elemA.name,
    elemB: elemB.name,
    charA: elemA.char,
    charB: elemB.char,
    relationType: relationTypeName,
    description: descriptionText,
    reasons,
    warnings
  };
}
