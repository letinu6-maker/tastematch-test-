/* 고정 데이터 — 국적·알레르기·미식가 유형·국적별 선호표·추정 규칙 */

/* ============================================================
   데이터 — 비짓서울 API 음식 콘텐츠 필드 구조를 본뜬 샘플 세트
   ============================================================ */

export var NATIONS = [
  { key:'china', label:'중국' }, { key:'japan', label:'일본' },
  { key:'taiwan', label:'대만' }, { key:'usa', label:'미국' },
  { key:'vietnam', label:'베트남' }, { key:'hongkong', label:'홍콩' },
  { key:'philippines', label:'필리핀' }, { key:'thailand', label:'태국' },
  { key:'singapore', label:'싱가포르' }, { key:'malaysia', label:'말레이시아' },
  { key:'indonesia', label:'인도네시아' }, { key:'uk', label:'영국' },
  { key:'canada', label:'캐나다' }, { key:'australia', label:'호주' },
  { key:'france', label:'프랑스' }, { key:'germany', label:'독일' }
];

export var ALLERGENS = [
  { key:'peanut', label:'땅콩' }, { key:'nuts', label:'견과류' },
  { key:'dairy', label:'우유' }, { key:'egg', label:'계란' },
  { key:'shellfish', label:'갑각류' }, { key:'mollusk', label:'조개·연체류' },
  { key:'gluten', label:'밀·글루텐' }, { key:'soy', label:'대두' },
  { key:'fish', label:'생선' }, { key:'buckwheat', label:'메밀' },
  { key:'pork', label:'돼지고기' }, { key:'beef', label:'소고기' },
  { key:'sesame', label:'참깨' }
];
export var ALLERGEN_LABEL = {};
ALLERGENS.forEach(function(a){ ALLERGEN_LABEL[a.key] = a.label; });

export var VEGAN_TYPES = [
  { key:'vegan', label:'완전채식 (비건)' },
  { key:'lacto', label:'락토 (유제품 O)' },
  { key:'ovo', label:'오보 (달걀 O)' },
  { key:'pesco', label:'페스코 (해산물 O)' }
];
export var VEGAN_LABEL = {};
VEGAN_TYPES.forEach(function(v){ VEGAN_LABEL[v.key] = v.label; });

export var EXPLORE = [
  { key:'adventure', label:'낯선 메뉴부터 도전해요', sub:'처음 보는 이름일수록 끌립니다', short:'모험형' },
  { key:'trend', label:'지금 SNS에서 뜨는 메뉴요', sub:'화제가 되는 건 일단 먹어봐야죠', short:'트렌드형' },
  { key:'proven', label:'검증된 맛집이 편해요', sub:'실패 없는 선택이 최고입니다', short:'정통파' }
];
export var ATMOS = [
  { key:'quiet', label:'조용한 로컬 식당', sub:'현지인만 아는 골목 노포', short:'로컬파' },
  { key:'either', label:'둘 다 상관없어요', sub:'맛만 좋으면 어디든', short:'균형파' },
  { key:'trendy', label:'트렌디한 인기 맛집', sub:'사진 찍기 좋고 활기찬 곳', short:'핫플파' }
];

export var AXIS_COLOR = { adventure:'#FFA300', trend:'#A32D84', proven:'#0072CE' };
export var AXIS_WASH  = { adventure:'var(--wash-adv)', trend:'var(--wash-trend)', proven:'var(--wash-proven)' };

export var PERSONAS = {
  'adventure-quiet': { title:'골목 개척자', tag:'지도에 없는 골목을 먼저 걷는 사람',
    body:'관광 안내서에 실린 곳은 이미 재미가 없습니다. 간판도 흐릿한 노포에서 처음 보는 이름의 메뉴를 시키고, 그게 무슨 맛인지 스스로 알아내는 걸 즐기죠. 서울에서 가장 깊은 맛은 대개 이런 사람이 먼저 찾아냅니다.',
    kw:['노포 탐사','현지어 메뉴판','발견의 기쁨'] },
  'adventure-either': { title:'무경계 미식가', tag:'장소는 상관없어요, 처음 보는 메뉴면 됩니다',
    body:'분위기나 인테리어에는 큰 관심이 없습니다. 기준은 오직 하나, 아직 안 먹어본 것인가. 노포든 신상 카페든 가리지 않고 들어가서 가장 낯선 메뉴를 시킵니다. 하루에 네 끼도 가능한 타입.',
    kw:['가리지 않음','신메뉴 우선','하루 네 끼'] },
  'adventure-trendy': { title:'번개 도전자', tag:'핫플에서도 제일 낯선 메뉴를 시키는 사람',
    body:'사람 많은 곳의 에너지를 좋아하지만, 남들과 같은 걸 시키지는 않습니다. 줄 서 있는 가게에 들어가 메뉴판 맨 아래 처음 보는 이름을 고르는 쪽이죠. 속도도 빠릅니다. 한 곳에 오래 머물기보다 여러 곳을 거칩니다.',
    kw:['핫플 순회','비주류 메뉴','빠른 회전'] },
  'trend-quiet': { title:'숨은 화제 헌터', tag:'뜨기 직전의 로컬을 먼저 찾아내는 사람',
    body:'유행은 챙기지만 이미 붐비는 곳은 늦었다고 생각합니다. 언급량이 막 오르기 시작한 조용한 동네 가게를 찾아내 남들보다 먼저 다녀오는 게 목표죠. 결과적으로 가장 좋은 타이밍에 가장 좋은 자리에 앉습니다.',
    kw:['선점','언급량 급상승','한적한 시간대'] },
  'trend-either': { title:'인플루언서 미식가', tag:'화제의 메뉴는 일단 다 먹어봐야 하는 사람',
    body:'지금 서울에서 무엇이 화제인지 늘 알고 있습니다. 장소의 성격은 따지지 않고, 화제성이 곧 방문 이유가 되죠. 먹은 것을 기록하고 공유하는 것까지가 한 끼의 완성입니다.',
    kw:['실시간 화제','기록과 공유','타이밍 감각'] },
  'trend-trendy': { title:'핫플 스트리터', tag:'지금 가장 뜨거운 곳에 가장 먼저 도착하는 사람',
    body:'줄이 길수록 확신이 생기는 타입입니다. 성수, 연남, 을지로처럼 지금 사람이 몰리는 거리를 걸으며 화제의 가게를 차례로 방문합니다. 한 곳에서 한두 개만 먹고 다음 가게로 이동하는 스트리트 스타일.',
    kw:['웨이팅 감수','거리 단위 이동','한입씩'] },
  'proven-quiet': { title:'조용한 정석파', tag:'검증된 노포에서 혼자만의 루틴을 지키는 사람',
    body:'새로움보다 안정감을 삽니다. 수십 년 같은 메뉴를 내는 가게에서, 붐비지 않는 시간에, 늘 시키던 것을 시키는 편안함이죠. 여행지에서도 이 리듬이 무너지지 않기를 바랍니다.',
    kw:['노포 정식','한산한 시간','같은 메뉴'] },
  'proven-either': { title:'든든한 푸드메이트', tag:'누구와 가도 실패 없는 선택을 하는 사람',
    body:'일행 중 누구도 못 먹는 것이 없게 고르는 감각이 있습니다. 매운 정도, 알레르기, 식단까지 두루 살펴 가장 무난하면서도 만족스러운 한 상을 차려내죠. 여행 첫 끼를 맡기기 좋은 사람.',
    kw:['모두 만족','한 상 차림','안전한 선택'] },
  'proven-trendy': { title:'안전한 핫플러', tag:'인기 있는 곳 중에서도 확실한 것만 고르는 사람',
    body:'활기찬 분위기는 좋지만 모험까지 할 생각은 없습니다. 인기 있는 가게에 가되 그 집의 대표 메뉴, 후기가 가장 많은 메뉴를 시킵니다. 실패 확률이 가장 낮은 방식으로 트렌드를 즐기는 방법이죠.',
    kw:['대표 메뉴','후기 1위','검증된 인기'] }
};

/* ============================================================
   장소 데이터 — 전부 비짓서울 API에서 실시간으로 받아옵니다.
   임의로 만든 샘플 메뉴는 사용하지 않습니다.
   ============================================================ */


export var NOVELTY_LABEL = { familiar:'익숙한 편', mid:'적당히 새로운', exotic:'낯선 메뉴' };
export var VIBE_LABEL = { local:'조용한 로컬', mixed:'중간', trendy:'트렌디한 핫플' };


/* --- 외부 데이터 ① 국적별 음식 종류 선호 경향 (자체 큐레이션 지표) --- */
export var NAT_CUISINE = {
  japan:      { '한식':86,'분식':76,'카페':72,'중식':60,'일식':52,'양식':58,'기타':66 },
  china:      { '한식':84,'분식':70,'카페':66,'중식':56,'일식':64,'양식':60,'기타':66 },
  taiwan:     { '한식':85,'분식':78,'카페':74,'중식':58,'일식':66,'양식':60,'기타':67 },
  hongkong:   { '한식':84,'분식':74,'카페':72,'중식':56,'일식':66,'양식':62,'기타':66 },
  usa:        { '한식':80,'분식':72,'카페':70,'중식':62,'일식':68,'양식':54,'기타':64 },
  uk:         { '한식':79,'분식':70,'카페':72,'중식':62,'일식':68,'양식':54,'기타':64 },
  canada:     { '한식':80,'분식':71,'카페':70,'중식':62,'일식':68,'양식':54,'기타':64 },
  australia:  { '한식':80,'분식':72,'카페':73,'중식':62,'일식':68,'양식':55,'기타':64 },
  france:     { '한식':78,'분식':66,'카페':74,'중식':62,'일식':70,'양식':52,'기타':64 },
  germany:    { '한식':78,'분식':67,'카페':71,'중식':62,'일식':68,'양식':53,'기타':64 },
  vietnam:    { '한식':83,'분식':76,'카페':70,'중식':64,'일식':64,'양식':60,'기타':66 },
  thailand:   { '한식':84,'분식':78,'카페':72,'중식':64,'일식':66,'양식':60,'기타':67 },
  philippines:{ '한식':83,'분식':76,'카페':71,'중식':64,'일식':64,'양식':62,'기타':66 },
  singapore:  { '한식':82,'분식':74,'카페':72,'중식':60,'일식':66,'양식':62,'기타':66 },
  malaysia:   { '한식':81,'분식':73,'카페':70,'중식':62,'일식':64,'양식':60,'기타':65 },
  indonesia:  { '한식':81,'분식':73,'카페':70,'중식':62,'일식':64,'양식':60,'기타':65 }
};
export var NAT_CUISINE_DEFAULT = { '한식':80,'분식':72,'카페':70,'중식':62,'일식':66,'양식':60,'기타':65 };

/* --- 외부 데이터 ② 메뉴명·태그 기반 매운맛 추정 규칙 --- */
export var SPICE_RULES = [
  { re:/불닭|핵매운|아주\s*매운|엽기|buldak|fire\s*chicken/i, v:10 },
  { re:/낙지볶음|쭈꾸미|짬뽕|불족발|매운\s*갈비|아구찜|해물찜|닭발|불막창|jjamppong|spicy\s*stir/i, v:8 },
  { re:/떡볶이|닭갈비|김치찌개|순두부|부대찌개|매운|칼칼|얼큰|tteokbokki|dakgalbi|kimchi\s*stew|sundubu|spicy/i, v:7 },
  { re:/제육|비빔|낙지|고추장|감자탕|해장국|bibim|gochujang|jeyuk/i, v:5 },
  { re:/김치|된장|청국장|찌개|전골|탕\b|kimchi|doenjang|jjigae|stew/i, v:4 },
  { re:/삼겹|구이|갈비|불고기|치킨|족발|보쌈|전\b|튀김|고기|samgyeop|galbi|bulgogi|chicken|grill|jokbal|bossam|fried/i, v:3 },
  { re:/설렁탕|곰탕|삼계탕|백반|한정식|국밥|죽\b|수제비|칼국수|콩국수|냉면|만두|김밥|초밥|seolleongtang|samgyetang|gukbap|kalguksu|naengmyeon|mandu|gimbap|sushi|porridge|noodle/i, v:1 },
  { re:/카페|커피|디저트|베이커리|빵|케이크|빙수|티\b|차\b|cafe|coffee|dessert|bakery|cake|bingsu|tea\b/i, v:0 }
];

/* --- 외부 데이터 ③ 메뉴명 기반 알레르기 유발 성분 추정 규칙 --- */
export var ALLERGEN_RULES = [
  { key:'shellfish', re:/새우|게장|꽃게|랍스터|대게|갑각|shrimp|crab|lobster|prawn/i },
  { key:'mollusk',   re:/오징어|낙지|문어|조개|굴\b|전복|골뱅이|홍합|쭈꾸미|squid|octopus|clam|oyster|abalone|mussel/i },
  { key:'fish',      re:/생선|고등어|갈치|굴비|회\b|초밥|참치|멸치|장어|아구|fish|mackerel|tuna|anchovy|eel|sashimi|sushi/i },
  { key:'pork',      re:/돼지|삼겹|목살|제육|족발|보쌈|순대|돈까스|돈가스|pork|samgyeop|jokbal|bossam|sundae/i },
  { key:'beef',      re:/소고기|한우|갈비|불고기|육회|곰탕|설렁탕|차돌|beef|hanwoo|galbi|bulgogi|yukhoe/i },
  { key:'dairy',     re:/치즈|우유|크림|버터|라떼|요거트|cheese|milk|cream|butter|latte|yogurt/i },
  { key:'egg',       re:/계란|달걀|에그|오믈렛|egg|omelet/i },
  { key:'gluten',    re:/국수|면\b|칼국수|라면|빵|만두|튀김|파스타|우동|김밥|떡볶이|수제비|돈까스|noodle|bread|dumpling|pasta|udon|gimbap|tteokbokki|fried/i },
  { key:'buckwheat', re:/메밀|막국수|buckwheat|makguksu/i },
  { key:'nuts',      re:/견과|아몬드|호두|잣\b|nut|almond|walnut|pine\s*nut/i },
  { key:'peanut',    re:/땅콩|peanut/i },
  { key:'soy',       re:/두부|된장|간장|콩\b|순두부|청국장|tofu|doenjang|soy|bean/i },
  { key:'sesame',    re:/참깨|참기름|들깨|깨\b|sesame|perilla/i }
];
