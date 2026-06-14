// src/utils/similarity.js

// Classify the Five Elements based on face width/height ratio and jaw sharpness
export function classifyFiveElements(raw, lang = 'ko') {
  const { face_aspect_ratio, jaw_sharpness } = raw;
  
  let mok = 0, hwa = 0, to = 0, geum = 0, su = 0;
  
  // 1. Mok (木): Long and slender
  if (face_aspect_ratio < 0.80) mok += 3.0;
  else if (face_aspect_ratio < 0.83) mok += 1.5;
  
  // 2. Hwa (火): Sharp jaw/chin, triangular
  if (jaw_sharpness < 0.74) hwa += 3.0;
  else if (jaw_sharpness < 0.78) hwa += 1.5;
  
  // 3. To (土): Fleshy, square
  if (face_aspect_ratio >= 0.82 && jaw_sharpness >= 0.81) to += 3.0;
  
  // 4. Geum (金): Bony, angular jaw
  if (face_aspect_ratio >= 0.77 && face_aspect_ratio <= 0.83 && jaw_sharpness >= 0.80) geum += 2.0;
  if (jaw_sharpness >= 0.83) geum += 1.5; // strong jaw bone
  
  // 5. Su (水): Round and fleshy
  if (face_aspect_ratio >= 0.84) su += 2.5;
  if (jaw_sharpness >= 0.76 && jaw_sharpness <= 0.82) su += 1.0; // smooth oval jaw
  
  // Add a small tie-breaker based on standard proportions
  su += 0.1; 

  const scores = { mok, hwa, to, geum, su };
  let maxElement = "su";
  let maxScore = -1;
  for (const [el, val] of Object.entries(scores)) {
    if (val > maxScore) {
      maxScore = val;
      maxElement = el;
    }
  }
  
  const info = {
    mok: {
      name: "목(木)형",
      char: "나무처럼 세로로 길고 곧게 뻗은 얼굴",
      description: "나무가 곧게 자라듯 자존심과 명예욕이 높고 지적인 성향이 강합니다. 영리하고 분석력이 뛰어나 학문, 교육, 연구, 기획 분야에서 크게 두각을 보이며 신뢰받는 조언자 기질이 강합니다.",
      name_en: "Mok (Wood) Type",
      char_en: "Straight and vertically elongated face, like a tree",
      description_en: "Just as trees grow straight, you have high self-esteem, honor, and strong intellectual tendencies. Clever and analytical, you stand out in academia, education, research, and planning, acting as a trusted advisor."
    },
    hwa: {
      name: "화(火)형",
      char: "불꽃처럼 뾰족한 삼각형/역삼각형 얼굴",
      description: "불꽃처럼 열정적이고 감정이 풍부하며 두뇌 회전이 대단히 빠릅니다. 사교성이 좋고 예술적 감각과 리더십을 갖추었으나, 다혈질적이고 급한 성미를 다스려야 더 큰 명예가 따릅니다.",
      name_en: "Hwa (Fire) Type",
      char_en: "Triangular or inverted-triangular face, like a flame",
      description_en: "Passionate and emotional like a flame, with an extremely fast-thinking mind. Socially active, with artistic sense and leadership, but managing your fiery temper will lead to greater honor."
    },
    to: {
      name: "토(土)형",
      char: "대지처럼 두툼하고 살집이 있는 둥근 사각형 얼굴",
      description: "대지(흙)처럼 신용과 의리를 가장 중시하며 넓은 포용력을 자랑합니다. 감정 변화가 적고 묵묵히 헌신하는 성품으로, 대기만성형 사업가나 조직의 든든한 리더 관상에 속합니다.",
      name_en: "To (Earth) Type",
      char_en: "Thick, fleshy, rounded rectangular face, like the earth",
      description_en: "Values trust and loyalty above all, showcasing immense tolerance and reliability. With stable emotions and quiet dedication, you possess the look of a late-blooming entrepreneur or stable leader."
    },
    geum: {
      name: "금(金)형",
      char: "무쇠처럼 광대와 턱뼈가 발달한 각진 사각형 얼굴",
      description: "철부지 없는 강한 추진력과 결단력을 지녔습니다. 불의를 참지 못하고 강한 책임감을 자랑합니다. 사업가, 법조인, 군/경찰 또는 한 분야의 최고 기술 권위자로 크게 성공할 기운입니다.",
      name_en: "Geum (Metal) Type",
      char_en: "Angular rectangular face with developed cheekbones and jaw, like iron",
      description_en: "Equipped with strong execution drive and decisiveness. Standing against injustice with deep responsibility, this energy brings high success as an entrepreneur, legal professional, law officer, or technical authority."
    },
    su: {
      name: "수(水)형",
      char: "물처럼 둥글둥글하고 통통하며 부드러운 얼굴",
      description: "물이 흐르듯 친화력과 융통성이 뛰어나고 환경 적응력이 매우 높습니다. 장사나 대인관계를 통한 사업 수완이 특출나며 평생 식복과 인덕이 끊이지 않는 복을 타고난 관상입니다.",
      name_en: "Su (Water) Type",
      char_en: "Round, chubby, and soft face, like flowing water",
      description_en: "Possesses high friendliness, flexibility, and adaptability, just as water flows. Outstanding business acumen through networking and trade, blessed with lifelong good fortune and food comfort."
    }
  };
  
  const elementData = info[maxElement];
  const isEn = lang === 'en';
  
  return {
    type: maxElement,
    name: isEn ? elementData.name_en : elementData.name,
    char: isEn ? elementData.char_en : elementData.char,
    description: isEn ? elementData.description_en : elementData.description
  };
}

// Compute Samjeong balance score (out of 100)
export function calculateSamjeongScore(sj, jj, hj, lang = 'ko') {
  // Balanced state is 33.3%, 33.3%, 33.3%
  const target = 33.33;
  const error = Math.abs(sj - target) + Math.abs(jj - target) + Math.abs(hj - target);
  
  // Scale error (typically max error is around 25-30)
  // Let's compute a percentage: 100 - (error * 3) capped at 0 and 100
  const score = Math.max(20, Math.min(100, Math.round(100 - error * 2.5)));
  
  const isEn = lang === 'en';
  let resultText = isEn 
    ? "The three zones are perfectly balanced, indicating extremely stable fortunes throughout early, middle, and late life (Great Fortune)."
    : "삼정이 균형을 이루어 초년, 중년, 말년 운세의 평행성이 매우 안정적인 대길(大吉)의 관상입니다.";
    
  if (score < 80) {
    // Determine which part is dominant
    const maxVal = Math.max(sj, jj, hj);
    if (maxVal === sj) {
      resultText = isEn
        ? "The Upper Zone (forehead) is most developed, suggesting high intelligence and early life success (before age 30) with academic talent."
        : "상정(이마)이 가장 발달하여 학업이나 지혜가 뛰어나고 초년(30세 이전)에 기회가 많고 총명함을 발휘할 관상입니다.";
    } else if (maxVal === jj) {
      resultText = isEn
        ? "The Middle Zone (nose and cheekbones) is dominant, indicating excellent energy to build your own business or rise to key social positions during your 30s and 40s."
        : "중정(코와 광대)이 우세하여 30대와 40대의 청장년기에 스스로 사업을 일구거나 사회적 중심 지위에 올라 큰 성공을 거둘 기질을 이룹니다.";
    } else {
      resultText = isEn
        ? "The Lower Zone (jaw and mouth area) is well-developed, offering broad tolerance, good relationships with juniors, and stable, rising fortunes in later life."
        : "하정(턱과 입 주변)이 넉넉히 발달하여 아랫사람 복과 포용력이 넓고, 중년 이후 노후(말년운)로 갈수록 안정되고 복록이 차오르는 관상입니다.";
    }
  }
  
  return {
    score,
    text: resultText,
    sj,
    jj,
    hj
  };
}

// Match user metrics with registered fortune rules
export function evaluateRules(rawMetrics, rulesList) {
  const matchedRules = [];
  
  rulesList.forEach(rule => {
    const value = rawMetrics[rule.metric];
    if (value === undefined) return;
    
    // Find matching range
    const matchedRange = rule.ranges.find(range => {
      const minOk = range.min === null || value >= range.min;
      const maxOk = range.max === null || value < range.max;
      return minOk && maxOk;
    });
    
    if (matchedRange) {
      matchedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleName_en: rule.name_en,
        metric: rule.metric,
        value,
        matchedLabel: matchedRange.label,
        matchedLabel_en: matchedRange.label_en,
        fortunes: {
          love: matchedRange.love,
          love_en: matchedRange.love_en,
          wealth: matchedRange.wealth,
          wealth_en: matchedRange.wealth_en,
          children: matchedRange.children,
          children_en: matchedRange.children_en,
          health: matchedRange.health,
          health_en: matchedRange.health_en,
          advice: matchedRange.advice,
          advice_en: matchedRange.advice_en
        }
      });
    }
  });
  
  return matchedRules;
}

// Generate the final categorized physiognomy report
export function generateFortuneReport(analysisResult, matchedRules, lang = 'ko') {
  // Combine fortunes across different rules for each category
  const categories = {
    love: [],
    wealth: [],
    children: [],
    health: [],
    advice: []
  };

  const isEn = lang === 'en';

  matchedRules.forEach(rule => {
    const name = isEn ? (rule.ruleName_en || rule.ruleName) : rule.ruleName;
    const loveVal = isEn ? rule.fortunes.love_en : rule.fortunes.love;
    const wealthVal = isEn ? rule.fortunes.wealth_en : rule.fortunes.wealth;
    const childrenVal = isEn ? rule.fortunes.children_en : rule.fortunes.children;
    const healthVal = isEn ? rule.fortunes.health_en : rule.fortunes.health;
    const adviceVal = isEn ? rule.fortunes.advice_en : rule.fortunes.advice;

    if (loveVal) categories.love.push({ source: name, text: loveVal });
    if (wealthVal) categories.wealth.push({ source: name, text: wealthVal });
    if (childrenVal) categories.children.push({ source: name, text: childrenVal });
    if (healthVal) categories.health.push({ source: name, text: healthVal });
    if (adviceVal) categories.advice.push({ source: name, text: adviceVal });
  });

  // Derived analyses (Samjeong and Stars/Colors)
  const samjeong = calculateSamjeongScore(
    analysisResult.derived.samjeong.sj,
    analysisResult.derived.samjeong.jj,
    analysisResult.derived.samjeong.hj,
    lang
  );
  
  const elements = classifyFiveElements(analysisResult.raw, lang);

  // Assess Five Peaks (오악)
  const peaksResult = analysisResult.derived.peaks;
  let peaksText = "";
  let peaksName = "";
  if (peaksResult.status === "isolated") {
    peaksName = isEn ? "Isolated Peak (Gobong-Gosan) Type" : "고봉고산(孤峰孤山) 형";
    peaksText = isEn
      ? "The nose (center peak) rises too high compared to the surrounding cheekbones, forehead, and jaw. While you possess high pride and independence leading to achievements in professional fields, you may feel isolated. Cultivating tolerance for others will bring greater balance."
      : "코(중악)가 주위의 광대뼈나 이마, 턱에 비해 지나치게 우뚝 솟아있습니다. 자존심이 매우 강하고 주체성이 뚜렷하여 전문 분야에서 큰 성취를 이룰 수 있으나, 독선으로 흐르거나 대인관계에서 고독감을 느낄 수 있으니 남을 포용하는 여유를 기르면 좋습니다.";
  } else if (peaksResult.status === "flat") {
    peaksName = isEn ? "Flat and Smooth (Pyeongpyeong-Hwasun) Type" : "평평화순(平平和順) 형";
    peaksText = isEn
      ? "The heights of the nose and surrounding forehead, jaw, and cheekbones are gentle, giving a flat impression. With a mild and gentle personality, you cooperate well and avoid conflicts. Actively building decisiveness and execution drive will lead to great success."
      : "코의 높이와 주위 이마, 턱, 광대뼈의 높이 차이가 완만하여 평평한 느낌을 줍니다. 성품이 완만하고 온화하여 남들과 마찰이 없으며 협동심이 우수합니다. 적극적인 결단력과 강력한 추진력을 의식적으로 기른다면 대성할 수 있습니다.";
  } else {
    peaksName = isEn ? "Five Peaks Harmonized (O-ak-Joeung) Type" : "오악조응(五岳朝應) 형";
    peaksText = isEn
      ? "The central nose and surrounding forehead, jaw, and cheekbones rise in balanced harmony, guarding each other. This is highly regarded as the best bone structure in physiognomy, bringing outstanding capability, good helpers, lifelong abundance, and success."
      : "중심의 코(숭산)와 이마(형산), 턱(항산), 좌우 광대뼈(태산, 화산)가 적절한 두께와 높이로 서로를 호위하듯 균형 있게 솟아있습니다. 관상학에서 으뜸으로 치는 뼈의 배치로, 자기 역량이 뛰어나면서도 인덕과 부하 운이 따라 평생 의식주가 풍족하고 대업을 완수할 상입니다.";
  }

  // Assess star colors (기색 분석)
  const myeonggung = analysisResult.derived.stars.myeonggung;
  const jaebaekgung = analysisResult.derived.stars.jaebaekgung;

  let starText = "";
  if (myeonggung.redFactor > 1.35) {
    starText += isEn
      ? "A reddish glow is present around the brow center (Myeonggung), suggesting temporary inner anxiety or minor delays in your affairs. Keep a calm mind. "
      : "미간(명궁) 부위에 붉은 기운이 돌아 현재 심적으로 번뇌가 있고 일의 성사가 일시 지체될 수 있으니 마음을 편히 다스려야 합니다. ";
  } else if (myeonggung.brightness > 78) {
    starText += isEn
      ? "The brow center (Myeonggung) shines clearly and brightly like a mirror, indicating high mental clarity and upcoming honors, success, or promotions. "
      : "미간(명궁)이 거울처럼 맑고 투명하게 빛나 정신이 총명하며 조만간 명예로운 경사나 승진의 운이 찾아올 징조입니다. ";
  } else {
    starText += isEn
      ? "The color of the brow center (Myeonggung) is calm and subtle, representing a peaceful nature and healthy mental state. "
      : "미간(명궁)의 빛깔이 평온하고 은은하여 선천적 성정이 차분하고 정신이 건강한 상태입니다. ";
  }

  if (jaebaekgung.redFactor > 1.35) {
    starText += isEn
      ? "The nose tip (Jaebaekgung) shows a reddish tint, cautioning against unexpected spending or financial loss. Postpone impulsive transactions or loans. "
      : "코끝(재백궁)이 붉은 기색을 띠어 예기치 못한 소비나 재물 손실이 날 수 있으니 충동적 거래나 금전 대여는 미루십시오. ";
  } else if (jaebaekgung.brightness > 78) {
    starText += isEn
      ? "A golden or peach-colored luster glows on the nose tip (Jaebaekgung), signaling rising wealth fortunes and gains in your ongoing business or trades."
      : "코끝(재백궁)에 황금색/살굿빛 윤기가 돌아 재물운이 강력하게 상승하고 있어 추진하던 비즈니스나 거래에서 이득을 얻을 길조입니다.";
  } else {
    starText += isEn
      ? "The clear tone of the nose tip (Jaebaekgung) maintains steady financial luck, preventing unnecessary cash outflow."
      : "코끝(재백궁)의 기색이 맑아 불필요한 돈이 새나가지 않는 단단한 금전운을 유지하고 있습니다.";
  }

  return {
    elements,
    samjeong,
    peaks: {
      name: peaksName,
      status: peaksResult.status,
      score: peaksResult.status === "balanced" ? 95 : (peaksResult.status === "isolated" ? 75 : 70),
      text: peaksText,
      averageZGap: peaksResult.averageZGap
    },
    stars: {
      text: starText,
      myeonggungBrightness: myeonggung.brightness,
      jaebaekgungBrightness: jaebaekgung.brightness
    },
    categories: {
      love: categories.love,
      wealth: categories.wealth,
      children: categories.children,
      health: categories.health,
      advice: categories.advice
    }
  };
}

