// src/utils/blogData.js

export const BLOG_ARTICLES = [
  {
    id: "art_1",
    title: "《마의상법(麻衣相法)》과 동양 관상학의 역사",
    title_en: "《Ma-ui Sangbeop (麻衣相法)》 and the History of Eastern Physiognomy",
    summary: "동양 상학의 교과서이자 시조라 불리는 마의선사의 철학과 얼굴 분석학의 기원에 대해 심층적으로 알아봅니다.",
    summary_en: "We delve deeply into the origins of face analysis and the philosophy of Master Ma-ui, the textbook and pioneer of Eastern physiognomy.",
    category: "역사와 철학",
    category_en: "History & Philosophy",
    readTime: "약 5분",
    readTime_en: "Approx. 5 min",
    content: `동양의 관상학은 수천 년 동안 누적된 통계와 경험을 바탕으로 발전한 인상 진단학입니다. 그 중에서도 《마의상법(麻衣相法)》은 송나라 시대의 기인인 마의선사(麻衣禪師)가 저술한 것으로 알려져 있으며, 동양 상학의 바이블이자 교과서로 여겨집니다. 마의선사는 화산의 돌굴에 거주하며 삼베옷(마의)만 입고 지냈다고 하여 마의선사라는 이름이 붙었습니다.

마의상법의 핵심 철학은 단순히 얼굴의 형태를 보고 길흉을 단정 짓는 것이 아닙니다. 얼굴은 마음이 겉으로 표출되는 거울이며, 신체의 기혈 흐름이 반영되는 통로라는 점을 강조합니다. 즉, '유상무심 심수상멸(유상무심 심수상멸)' - 관상이 아무리 좋아도 마음이 바르지 않으면 좋은 상이 소멸하고, 반대로 '무상유심 심조상생(무상유심 심조상생)' - 관상이 나빠도 마음이 바르면 관상이 좋게 변한다는 마음의 통찰을 전하고 있습니다.

현대의 AI 얼굴 분석 기술은 마의상법이 제시하는 안면의 골격 분포, 피부의 조도(빛깔), 비율의 균형점을 현대 컴퓨터 그래픽스 기술을 사용해 수치화한 것입니다. 예컨대 눈꼬리의 각도, 미간의 거리, 턱의 두께 등 마의상법이 중요하게 보았던 물리적 비율 지표들을 정량 측정하여 이를 현대적이고 학술적인 분석으로 되짚어 보는 데 깊은 의의가 있습니다.`,
    content_en: `Eastern physiognomy is a diagnostic study developed based on thousands of years of accumulated statistics and experience. Among others, 《Ma-ui Sangbeop (麻衣相法)》 is known to have been written by Master Ma-ui (麻衣禪師), a hermit of the Song Dynasty, and is regarded as the bible and textbook of Eastern face-reading. Master Ma-ui lived in a stone cave on Mount Hua and wore only hemp clothes (Ma-ui), hence his name.

The core philosophy of Ma-ui Sangbeop is not simply to judge good or bad fortune by looking at facial shapes. It emphasizes that the face is a mirror reflecting the mind, and a channel reflecting the flow of the body's Qi and blood. That is, 'Having a face but no heart, the face disappears as the heart goes (유상무심 심수상멸)' and 'Having no face but having a heart, the face is created as the heart goes (무상유심 심조상생)'. It conveys the deep insight that even if one's face structure is poor, a good heart can reshape one's fortune.

Modern AI face analysis technology quantifies physical facial bone distribution, skin brightness (aura), and ratio balance using modern computer vision, which Master Ma-ui viewed as essential physical indicators (eye corner slant, brow distance, jaw width). Translating these guidelines into quantitative measurements holds academic and practical significance.`
  },
  {
    id: "art_2",
    title: "얼굴형으로 구분하는 음양오행(五行) 체질 감별법",
    title_en: "Discerning Yin-Yang & Five Elements (五行) via Face Shapes",
    summary: "목형, 화형, 토형, 금형, 수형 얼굴의 기하학적 윤곽 형태와 각 체질별 기질적 강점 및 보완법을 계측식과 함께 설명합니다.",
    summary_en: "Explains the geometric outline shapes of Mok, Hwa, To, Geum, and Su faces, and the strengths and remedies of each constitution alongside measurement formulas.",
    category: "오행체질",
    category_en: "Five Elements",
    readTime: "약 6분",
    readTime_en: "Approx. 6 min",
    content: `동양 의학과 상학의 근간이 되는 《오행설(五행설)》에서는 인간과 우주만물을 구성하는 다섯 가지 원소인 목(木 - 나무), 화(火 - 불), 토(土 - 흙), 금(金 - 쇠), 수(수 - 물)의 기운에 따라 사람의 형상을 다섯 가지 체질로 분류합니다.

1. 목(木)형 얼굴: 나무처럼 세로로 길고 곧게 뻗은 형태를 지닙니다. AI 계측상 안면 가로폭 대비 세로길이 비율(face_aspect_ratio)이 0.80 이하로 길쭉하게 나타납니다. 지적이고 자존심이 세며 명예를 중시하는 학자나 기획자 유형이 많습니다.

2. 화(火)형 얼굴: 타오르는 불꽃처럼 턱끝이 뾰족하고 위로 갈수록 이마가 발달하거나, 턱뼈의 각도가 날렵한 역삼각형 윤곽입니다. 턱 끝의 예리함(jaw_sharpness)이 0.74 이하로 매우 날카롭게 잡힙니다. 다정다감하고 표현력이 뛰어나나 감정의 기복과 성미가 급한 면을 조절해야 성공합니다.

3. 토(土)형 얼굴: 비옥한 대지처럼 살집이 있고 네모난 듯하면서도 둥글며 턱과 이마가 두툼합니다. 안면 가로세로 비가 균등하고 턱뼈 각도가 0.81 이상으로 넓고 두텁습니다. 성품이 듬직하여 신용과 의리를 지키며, 조직의 리더나 대기만성형 사업가 관상에 많습니다.

4. 금(金)형 얼굴: 쇠붙이처럼 얼굴 골격(광대뼈와 귀밑 턱뼈)이 각지고 두드러집니다. 추진력과 단단함이 계측되며 책임을 지는 추진 능력이 우수합니다. 군인, 경찰, 법조인 등 원칙과 기강이 있는 분야에서 크게 활약합니다.

5. 수(水)형 얼굴: 흐르는 물방울처럼 얼굴 전체가 둥글둥글하고 통통하며 뼈가 드러나지 않고 살집이 부드럽습니다. 융통성이 탁월하며 환경 적응력이 1등입니다. 대인관계를 통한 비즈니스 수완이 좋아 평생 식복과 인덕이 끊이지 않는 복관상입니다.`,
    content_en: `In the Theory of the Five Elements (五行설), which forms the basis of Eastern medicine and physiognomy, human forms are classified into five constitutions based on the five elements of the universe: Mok (木 - Wood), Hwa (火 - Fire), To (土 - Earth), Geum (金 - Metal), and Su (水 - Water).

1. Mok (Wood) Face: Elongated and straight like a tree. On AI measurement, the width-to-height ratio (face_aspect_ratio) is below 0.80. Often intellectuals, planners, or scholars who value pride and honor.

2. Hwa (Fire) Face: Sharp chin and wider forehead like a burning flame, forming a sharp inverted triangle. Jaw sharpness (jaw_sharpness) is below 0.74. Highly expressive, passionate, and social, but must manage emotional volatility and haste to achieve greatness.

3. To (Earth) Face: Fleshy and square-rounded like the rich earth, with thick jaws. Aspect ratio is balanced and jaw angle ratio (jaw_sharpness) is above 0.81. Faithful, reliable, and honest, common among late-blooming business leaders.

4. Geum (Metal) Face: Strong, angular bone structure (pronounced cheekbones and jaws) like raw metal. Shows high execution, sense of responsibility, and principles. Flourishes in law enforcement, military, legal circles, or technical authorities.

5. Su (Water) Face: Round and chubby like a water droplet, with soft flesh hiding the bones. Outstanding flexibility, adaptability, and networking skills. Blessed with lifelong food comfort and helpful connections.`
  },
  {
    id: "art_3",
    title: "삼정(상정·중정·하정) 비율과 인생의 흐름",
    title_en: "The Three Zones (Samjeong) and the Flow of Life",
    summary: "얼굴을 삼등분하는 이마, 코, 턱의 대칭성과 각각이 상징하는 나이대별(초년, 중년, 말년) 운세 균형을 분석합니다.",
    summary_en: "Analyzes the symmetry of the forehead, nose, and jaw, representing early, middle, and late life fortunes respectively.",
    category: "삼정비율",
    category_en: "Samjeong Zones",
    readTime: "약 4분",
    readTime_en: "Approx. 4 min",
    content: `《삼정상법(三停相法)》에서는 얼굴을 가로선으로 3등분하여 각각 상정(上停), 중정(중정), 하정(하정)이라 부르고 이를 통해 한 인간의 생애 주기를 진단합니다.

* 상정(이마 발제선 ~ 눈썹 사이 미간): 초년운(15세 ~ 30세)을 관장합니다. 이마가 넓고 평평하며 흉터가 없으면 부모의 덕이 있고 학업 능력이 뛰어나 조기에 두각을 나타냅니다.
* 중정(눈썹 사이 ~ 코끝 준두): 중년운(31세 ~ 50세)을 담당합니다. 코의 높이와 주위 광대뼈의 조화가 좋아야 이 시기에 자기 사업이나 사회적 성취를 크게 이루고 재물을 모웁니다.
* 하정(코끝 아래 인중 ~ 턱끝): 말년운(51세 이후)을 의미합니다. 입 주변이 넉넉하고 턱이 이중턱이 되거나 둥글고 단단하면 아랫사람 복이 넘치고 평화로운 노후를 보냅니다.

AI 관상 분석은 MediaPipe 좌표계를 활용해 발제점(랜드마크 10)부터 미간(168), 코끝(4), 턱끝(152)의 Y축 거리를 구한 뒤 각 영역의 백분율 비율을 계측합니다. 완벽한 삼정 비율은 33.3%씩 대칭을 이루는 것이며, 특정 영역이 비대해지거나 함몰되면 해당 시기의 보완점과 성격적 개운 비법을 도출하게 됩니다.`,
    content_en: `In the Three Zones Method (삼정상법), the face is divided horizontally into three zones: the Upper Zone (상정), Middle Zone (중정), and Lower Zone (하정), representing the timeline of a human life.

* Upper Zone (Hairline to Brow center): Governs early life (ages 15-30). A wide, flat forehead without scars indicates parental support and academic success.

* Middle Zone (Brows to Nose tip): Governs middle life (ages 31-50). Balanced nose height and cheekbone harmony bring social achievements and wealth accumulation.

* Lower Zone (Nose tip to Chin): Governs later life (ages 51+). A fleshy mouth area and rounded, solid jaw bring good relationships with juniors, a stable household, and peaceful retirement.

AI analysis utilizes the MediaPipe coordinate system to measure the vertical Y-axis distance from the hairline (landmark 10), brow center (168), nose tip (4), and chin (152) to evaluate the percentage of each zone. Perfect balance is 33.3% each; deviations highlight specific developmental areas and remedies.`
  },
  {
    id: "art_4",
    title: "오악조응(五岳조응): 코를 호위하는 얼굴의 다섯 봉우리",
    title_en: "O-ak-Joeung: The Five Mountain Peaks of the Face",
    summary: "얼굴의 기하학적 깊이감(Z축 값)을 측정하여 코(숭산)를 이마, 턱, 광대가 조화롭게 감싸 안는지 입체적으로 분석하는 원리입니다.",
    summary_en: "Uses 3D depth (Z-coordinates) to analyze whether the nose (center peak) is harmoniously surrounded by the forehead, jaw, and cheekbones.",
    category: "오악조응",
    category_en: "Five Peaks",
    readTime: "약 5분",
    readTime_en: "Approx. 5 min",
    content: `동양의 산악 숭배 사상과 지리학은 인상학에도 투영되어, 얼굴의 솟아오른 다섯 군데의 뼈대를 다섯 개의 큰 산인 '오악(五岳)'에 비유합니다.

1. 중악(中岳 - 코): 얼굴의 중심이자 중국의 숭산(嵩山)에 비유되며, 주체성과 재물적 그릇을 나타냅니다.
2. 남악(南岳 - 이마): 중국의 형산(衡山)에 비유되며, 명예와 부모운을 의미합니다.
3. 북악(北岳 - 턱): 중국의 항산(恒山)에 비유되며, 자녀운과 말년의 터전을 뜻합니다.
4. 동악(동악 - 좌측 광대뼈) & 서악(서악 - 우측 광대뼈): 태산(泰山)과 화산(華山)에 비유되며, 대인 사회적 서포터와 부하 복을 나타냅니다.

전통 문헌에서 가장 이상적으로 꼽는 형태는 '오악조응(오악조응)'입니다. 이는 중심의 코가 우뚝 서 있고, 이를 이마와 턱, 그리고 양쪽 광대뼈가 든든하게 호위하듯 서로 감싸 안으며 솟아있는 배치입니다.
만약 다른 뼈대들은 평평한데 코만 지나치게 솟아있으면 《고봉고산(고봉고산)》이라 하여 고집이 세고 고독한 상이 되며, 반대로 코가 낮고 주변 뼈만 드세면 주체성이 약한 상이 됩니다. AI 관상은 랜드마크의 Z좌표(3D 깊이값)의 차이인 Z-Gap을 평균 계산하여 이 다섯 봉우리의 조응 평형도를 100점 만점으로 계측해 냅니다.`,
    content_en: `Eastern geography and mountain worship are reflected in physiognomy, comparing the five raised facial bones to five sacred mountains (오악).

1. Center Peak (Nose): Compared to Mount Song (숭산), representing subjectivity and financial capacity.

2. South Peak (Forehead): Compared to Mount Heng (형산), representing honor and parents.

3. North Peak (Jaw): Compared to Mount Heng (항산), representing children and later life foundation.

4. East & West Peaks (Cheekbones): Compared to Mount Tai (태산) and Mount Hua (화산), representing social helpers and colleagues.

Traditional books rank 'Five Peaks Harmonized (오악조응)' highest, where the central nose stands tall and is securely guarded and supported by the other four peaks. If the nose rises alone while others are flat, it is called 'Isolated Peak (고봉고산)', indicating high pride but loneliness. AI measurements calculate the Z-coordinate difference (Z-Gap) to evaluate the harmony score out of 100.`
  },
  {
    id: "art_5",
    title: "미간(명궁)과 코끝(재백궁)의 기색(안색) 분석 원리",
    title_en: "Principles of Color Aura (기색) Analysis on Myeong & Jaebaek",
    summary: "기운이 흐르는 통로인 명궁과 재백궁의 실시간 HSL 피부 픽셀 밝기와 맑기를 측정하여 오늘날의 운기를 진단하는 방법을 설명합니다.",
    summary_en: "Explains how we measure skin pixel HSL brightness and redness in real-time around the Myeonggung and Jaebaekgung areas to diagnose daily fortunes.",
    category: "기색판정",
    category_en: "Skin Color Aura",
    readTime: "약 4분",
    readTime_en: "Approx. 4 min",
    content: `관상학의 정수 중 하나는 고정된 뼈나 이목구비 형태를 보는 것을 넘어, 시시각각 변하는 안면의 빛깔과 밝기를 진단하는 《기색론(기색론)》에 있습니다. 골격이 고속도로라면 기색은 그 위를 달리는 자동차의 흐름과 날씨에 비유할 수 있습니다.

* 명궁(인당/미간): 눈썹과 눈썹 사이의 영역으로, 한 사람의 정신적 평온함과 운명의 총체적 통로입니다. 이곳이 밝게 빛나고 맑으면 현재 머리가 맑고 추진하는 계약이나 학업운이 크게 열리는 징조입니다. 반대로 붉은 핏기가 과도하게 돌면 조급한 고민이나 번뇌가 있음을 의미합니다.
* 재백궁(코끝 준두): 코의 맨 앞 끝부위로, 금전과 재물운이 머무는 곳입니다. 재백궁 끝에 촉촉한 윤기가 돌고 맑은 살굿빛 황금색이 감돌면 뜻밖의 재물이나 투자 이익이 생길 길조이며, 이곳에 붉은 뾰루지가 나거나 지나치게 과밀한 붉은 기색(Redness)이 비치면 일시적인 손실이나 불필요한 지출이 생길 징조이므로 조심해야 합니다.

AI 시스템은 사용자가 캡처를 완료하는 순간 미간(랜드마크 168번 주변)과 코끝(4번 주변)의 캔버스 픽셀을 직접 가로챕니다. 해당 좌표군 주변의 HSL 밝기값(Lightness)과 RGB 스펙트럼 상의 적색 비율(Red Factor)을 계산하여 선조들의 경험론과 부합하는 실시간 기색 점괘를 판정해 줍니다.`,
    content_en: `One of the pinnacles of face-reading is the study of real-time aura and color changes (기색론). If the bone structure is a highway, the color aura represents the traffic flow and weather.

* Myeonggung (Brow Center): Located between the eyebrows, it governs mental clarity and general fortune. A bright, mirror-like reflection indicates high mental focus and upcoming promotions. Excessive redness suggest anxiety or temporary blocks.

* Jaebaekgung (Nose Tip): Located at the nose tip, it governs cash flow. A moist, golden/peach glow signals wealth rise and business gains. Redness or pimples signal temporary losses or unexpected expenses.

AI grabs canvas pixels around the brow center (168) and nose tip (4) the moment capture finishes, calculating HSL Lightness and RGB Redness to provide real-time readings matching traditional wisdom.`
  }
];
