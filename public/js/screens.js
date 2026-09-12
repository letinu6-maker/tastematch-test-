/* 화면 HTML — 인트로·온보딩·결과·주변 맛집·상세·유형 가이드·내 조건 */

import { esc, fmtDist, fmtRadius, hash, walkMin } from './util.js';
import { ALLERGENS, ALLERGEN_LABEL, ATMOS, AXIS_COLOR, AXIS_WASH, EXPLORE, NATIONS, PERSONAS, VEGAN_LABEL, VEGAN_TYPES, VIBE_LABEL } from './data.js';
import { loadSaved, state } from './state.js';
import { langSwitchHtml, t, tpl } from './i18n.js';
import { activeCombo, activePersonaProfile, comboKey, natLabel } from './profile.js';
import { PLACES } from './api.js';
import { ORIGINS, WEIGHTS, recommend, scoreMenu, topReasons } from './score.js';
import { rawDataSectionHtml } from './map.js';
import { character } from './character.js';

/* ============================================================
   화면
   ============================================================ */

var ICON = {
  search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>',
  back:'<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  user:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  fork:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 3v7a3 3 0 0 0 6 0V3"/><path d="M9 10v11"/><path d="M17 3c-1.5 2-2 4-2 6h4c0-2-.5-4-2-6z"/><path d="M17 9v12"/></svg>',
  pin:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  grid:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></svg>',
  gear:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3"/></svg>',
  mark:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#FFA300"/><path d="M12 17c-4-3-3-8 0-11 3 3 4 8 0 11z" fill="#26225B"/></svg>'
};

export function screenIntro(){
  var cells = '';
  ['adventure','trend','proven'].forEach(function(ex){
    ['quiet','either','trendy'].forEach(function(vb){
      cells += '<div class="char-cell">' + character(ex, vb, 40) +
               '<span>' + esc(t(PERSONAS[ex + '-' + vb].title)) + '</span></div>';
    });
  });
  var saved = loadSaved();
  return '<div class="screen intro"><div class="scroll"><div class="intro-body">' +
    '<div class="langrow" style="padding:0 0 12px;justify-content:flex-end">' + langSwitchHtml() + '</div>' +
    '<div class="logo-row">' + ICON.mark + t('<b>TasteMatch Seoul</b><span>비짓서울 API</span></div>') +
    t('<h1 class="display">서울에서<br>당신의 한 입을 찾습니다</h1>') +
    t('<p class="lede">국적별 선호 데이터와 당신의 입맛, 지금 있는 자리에서의 거리를 겹쳐 <b>지금 걸어갈 수 있는</b> 한 끼를 고릅니다. 알레르기·채식·할랄 조건은 추천에서 자동으로 걸러냅니다.</p>') +
    '<div class="char-strip">' + cells + '</div>' +
    '<div class="facts">' +
      t('<div class="fact"><b>6,568</b><span>비짓서울 음식 콘텐츠</span></div>') +
      t('<div class="fact"><b>16</b><span>국적별 선호 데이터</span></div>') +
      t('<div class="fact"><b>500m~</b><span>반경 기반 주변 추천</span></div>') +
    '</div>' +
    '</div></div>' +
    '<div class="intro-foot">' +
    (saved ? t('<button class="cta" data-action="resume">저장된 프로필로 계속하기</button>') +
             t('<button class="cta ghost" data-action="start">처음부터 다시 하기</button>')
           : t('<button class="cta" data-action="start">시작하기 · 7문항</button>')) +
    t('<p class="fine" style="color:var(--on-panel-dim)">화면에 나오는 장소는 모두 비짓서울 API에서 실시간으로 받아온 실제 콘텐츠입니다. 매운맛·알레르기는 가게 이름과 대표 메뉴에서 추정합니다.</p>') +
    '</div></div>';
}

var STEPS = [
  { title:t('국적이 어떻게 되세요?'), note:t('국적별 메뉴 선호 통계를 추천 점수의 28%로 반영합니다.') },
  { title:t('새로운 메뉴, 어떻게 고르세요?'), note:t('미식가 유형을 결정하는 첫 번째 축입니다.') },
  { title:t('식당 분위기는 어떤 쪽이 좋아요?'), note:t('미식가 유형을 결정하는 두 번째 축입니다.') },
  { title:t('매운맛, 어디까지 괜찮으세요?'), note:t('한국 음식은 같은 이름이어도 매운 정도가 크게 다릅니다.') },
  { title:t('알레르기나 못 먹는 재료가 있나요?'), note:t('선택한 재료가 들어간 메뉴는 추천에서 완전히 제외됩니다.') },
  { title:t('채식 유형이 있나요?'), note:t('해당하는 유형을 만족하는 메뉴만 남깁니다.') },
  { title:t('할랄 인증이 필요하세요?'), note:t('할랄 인증이 확인된 메뉴만 추천합니다.') }
];

export function stepValid(){
  var p = state.profile;
  switch(state.step){
    case 0: return !!p.natKey;
    case 1: return !!p.explore;
    case 2: return !!p.atmosphere;
    case 3: return p.spice !== null;
    case 4: return p.noAllergy || p.allergens.length > 0 || p.customAllergens.length > 0;
    case 5: return p.veganNone || p.vegan.length > 0;
    default: return true;
  }
}

export function natChipsHTML(){
  var p = state.profile, q = state.natQuery.trim(), html = '';
  var list = NATIONS.filter(function(n){ return !q || n.label.indexOf(q) >= 0; });
  if(!list.length && !q) return '';
  list.forEach(function(n, i){
    var rank = NATIONS.indexOf(n) + 1;
    html += '<button class="chip ' + (p.natKey === n.key ? 'on' : '') + '" data-action="nat" data-key="' + n.key + '">' +
            '<span class="rank">' + rank + '</span>' + esc(t(n.label)) + '</button>';
  });
  if(!list.length) html += t('<p class="empty-note">검색 결과가 없어요. 아래 <b>직접 입력</b>으로 추가해 주세요.</p>');
  if(p.natKey === 'custom' && p.natCustom){
    html += '<button class="chip on" data-action="nat-clear">' + esc(p.natCustom) + ' <span aria-hidden="true">✕</span></button>';
  }
  html += t('<button class="chip dash" data-action="nat-custom-toggle">+ 직접 입력</button>');
  return html;
}

export function algChipsHTML(){
  var p = state.profile, q = state.algQuery.trim(), html = '';
  var list = ALLERGENS.filter(function(a){ return !q || a.label.indexOf(q) >= 0; });
  list.forEach(function(a){
    var on = !p.noAllergy && p.allergens.indexOf(a.key) >= 0;
    html += '<button class="chip ' + (on ? 'on' : '') + '" data-action="alg" data-key="' + a.key + '">' + esc(t(a.label)) + '</button>';
  });
  if(!list.length) html += t('<p class="empty-note">목록에 없네요. <b>직접 입력</b>으로 추가해 주세요.</p>');
  p.customAllergens.forEach(function(word, i){
    html += '<button class="chip on" data-action="alg-remove" data-idx="' + i + '">' + esc(word) + ' <span aria-hidden="true">✕</span></button>';
  });
  html += t('<button class="chip dash" data-action="alg-custom-toggle">+ 직접 입력</button>');
  html += '<button class="chip neutral ' + (p.noAllergy ? 'on' : '') + t('" data-action="alg-none">없어요</button>');
  return html;
}

function spiceNote(v){
  if(v === null) return '';
  if(v <= 2) return t('순한 편이시네요. 김치·고추장이 들어간 기본 메뉴도 맵게 느껴질 수 있어 그 점까지 감안해 추천할게요.');
  if(v <= 5) return t('한국인 평균과 비슷한 수준이에요. 대부분의 대표 메뉴를 무리 없이 즐길 수 있습니다.');
  if(v <= 8) return t('매운 음식을 즐기시는군요. 낙지볶음이나 닭갈비 같은 본격적인 메뉴를 추천 상위에 올릴게요.');
  return t('한국인 중에서도 상위권입니다. 불닭 계열까지 추천 대상에 넣겠습니다.');
}

export function screenOnboarding(){
  var p = state.profile, s = state.step, def = STEPS[s], body = '';

  if(s === 0){
    body = '<div class="search-row">' + ICON.search +
           t('<input type="text" id="natSearch" placeholder="국가 검색 (예: 캐나다, 태국)" value="') + esc(state.natQuery) + '" autocomplete="off"></div>' +
           '<div class="chips" id="natChips">' + natChipsHTML() + '</div>' +
           (state.showNatCustom ? t('<div class="custom-row"><input type="text" id="natCustom" placeholder="예: 브라질, 스페인" autocomplete="off"><button data-action="nat-custom-add">추가</button></div>') : '') +
           t('<p class="muted">방한 관광객 수가 많은 국가 순으로 정렬했습니다. 목록에 없으면 직접 입력해 주세요.</p>');
  } else if(s === 1 || s === 2){
    var opts = s === 1 ? EXPLORE : ATMOS;
    var cur = s === 1 ? p.explore : p.atmosphere;
    var act = s === 1 ? 'explore' : 'atmos';
    body = '<div class="choices">' + opts.map(function(o){
      return '<button class="choice ' + (cur === o.key ? 'on' : '') + '" data-action="' + act + '" data-key="' + o.key + '">' +
             '<span class="dot"></span><span><b>' + esc(t(o.label)) + '</b><small>' + esc(t(o.sub)) + '</small></span></button>';
    }).join('') + '</div>';
  } else if(s === 3){
    var pep = '';
    for(var i=1;i<=10;i++){
      var on = p.spice !== null && i <= p.spice;
      var peak = p.spice === i;
      pep += '<button class="pepper ' + (on ? 'on' : '') + ' ' + (peak ? 'peak' : '') + '" data-action="spice" data-key="' + i + '" aria-label="' + esc(tpl('spiceAria', { n:i })) + '">🌶️</button>';
    }
    body = t('<div class="spice-head"><span class="muted">1 = 순한맛 · 10 = 불닭</span>') +
           '<span class="spice-val">' + (p.spice === null ? '—' : p.spice + '/10') + '</span></div>' +
           '<div class="pepper-row">' + pep + '</div>' +
           t('<div class="scale-ends"><span>김치도 매워요</span><span>불닭 완주 가능</span></div>') +
           (p.spice !== null ? '<div class="spice-note">' + esc(t(spiceNote(p.spice))) + '</div>' : '');
  } else if(s === 4){
    body = '<div class="search-row">' + ICON.search +
           t('<input type="text" id="algSearch" placeholder="재료 검색 (예: 갑각류, 글루텐)" value="') + esc(state.algQuery) + '" autocomplete="off"></div>' +
           '<div class="chips" id="algChips">' + algChipsHTML() + '</div>' +
           (state.showAlgCustom ? t('<div class="custom-row"><input type="text" id="algCustom" placeholder="예: 참외, 키위" autocomplete="off"><button data-action="alg-custom-add">추가</button></div>') : '') +
           t('<p class="muted">여러 개를 고를 수 있어요. 고른 재료가 들어간 메뉴는 추천 목록에서 아예 빠집니다.</p>');
  } else if(s === 5){
    body = '<div class="chips">' + VEGAN_TYPES.map(function(v){
      var on = !p.veganNone && p.vegan.indexOf(v.key) >= 0;
      return '<button class="chip ' + (on ? 'on' : '') + '" data-action="vegan" data-key="' + v.key + '">' + esc(t(v.label)) + '</button>';
    }).join('') +
    '<button class="chip neutral ' + (p.veganNone ? 'on' : '') + t('" data-action="vegan-none">해당없음</button></div>') +
    t('<p class="muted">고른 유형을 모두 만족하는 메뉴만 남깁니다.</p>');
  } else {
    body = t('<div class="switch-row"><span><b>할랄 음식만 보여주기</b>') +
           t('<small>할랄 인증 또는 성분이 확인된 메뉴만 추천합니다.</small></span>') +
           '<button class="switch ' + (p.halal ? 'on' : '') + '" data-action="halal" role="switch" aria-checked="' + (p.halal ? 'true' : 'false') + t('" aria-label="할랄 전용"><i></i></button></div>') +
           t('<p class="muted">지금은 ') + (p.halal ? t('할랄 인증 메뉴만') : t('모든 메뉴를')) + t(' 대상으로 추천합니다.</p>');
  }

  var rail = '';
  for(var k=0;k<7;k++) rail += '<i class="' + (k <= state.step ? 'on' : '') + '"></i>';

  var primary = state.editing ? t('저장하고 돌아가기') : (state.step === 6 ? t('추천 시작하기') : t('다음'));

  return '<div class="screen">' +
    '<div class="rail">' + rail + '</div>' +
    '<div class="scroll">' +
      '<div class="q-head"><div class="step">STEP ' + (state.step + 1) + ' / 7</div>' +
      '<h2>' + esc(t(def.title)) + '</h2><p>' + esc(t(def.note)) + '</p></div>' +
      '<div class="q-body">' + body + '</div>' +
    '</div>' +
    '<div class="nav-bar">' +
      (state.step > 0 && !state.editing ? t('<button class="back" data-action="prev">이전</button>') : '') +
      (state.editing ? t('<button class="back" data-action="cancel-edit">취소</button>') : '') +
      '<button class="cta" data-action="next"' + (stepValid() ? '' : ' disabled') + '>' + primary + '</button>' +
    '</div></div>';
}

/* 언어를 바꾼 뒤에도 다시 번역되도록 함수로 둔다 */
export var ANALYZE_STEP_KEYS = [
  '비짓서울 API 음식 콘텐츠 불러오는 중',
  '국적별 선호 통계 대조하는 중',
  '알레르기 · 채식 · 할랄 조건으로 거르는 중',
  '현재 위치에서 가까운 순으로 정렬하는 중'
];
function analyzeSteps(){ return ANALYZE_STEP_KEYS.map(function(k){ return t(k); }); }

export function screenAnalyzing(){
  var done = state.analyzeStep || 0;
  var steps = analyzeSteps().map(function(label, i){
    return '<div class="astep ' + (i < done ? 'on' : '') + '"><span class="tick">' + (i < done ? '✓' : '') + '</span>' + esc(label) + '</div>';
  }).join('');
  return '<div class="screen analyze">' +
    '<div class="pot">' + character(state.profile.explore, state.profile.atmosphere, 96) + '</div>' +
    '<h2>' + esc(natLabel(state.profile)) + t(' 여행자 데이터와<br>맞춰보고 있어요</h2>') +
    '<div class="steps">' + steps + '</div></div>';
}

function tabs(active){
  var items = [
    { key:'result', label:t('내 유형'), icon:ICON.user },
    { key:'places', label:t('주변 맛집'), icon:ICON.pin },
    { key:'guide', label:t('유형 가이드'), icon:ICON.grid },
    { key:'profile', label:t('내 조건'), icon:ICON.gear }
  ];
  return '<div class="tabs">' + items.map(function(it){
    return '<button class="tab ' + (active === it.key ? 'on' : '') + '" data-action="go" data-key="' + it.key + '">' +
           it.icon + '<span>' + t(it.label) + '</span></button>';
  }).join('') + '</div>';
}

export function screenResult(){
  var p = activePersonaProfile();
  var combo = activeCombo();
  var parts = combo.split('-');
  var per = PERSONAS[combo];
  var rec = recommend(p);
  var top = rec.list.slice(0, 3);
  var pct = 9 + (hash(combo + '|' + p.natKey) % 19);
  var exShort = EXPLORE.filter(function(e){ return e.key === parts[0]; })[0].short;
  var atShort = ATMOS.filter(function(a){ return a.key === parts[1]; })[0].short;

  var preview = top.map(function(e){
    return '<button class="place" data-action="menu" data-key="' + e.menu.id + '">' +
      '<div class="body"><div class="nm">' + esc(e.menu.name) + '</div>' +
      '<div class="loc">' + esc(e.menu.place) + ' · ' + esc(e.menu.gu) + '</div>' +
      '<div class="walk"><b class="num">' + fmtDist(e.km) + '</b><span>' + esc(tpl('walkMin', { min:walkMin(e.km) })) + '</span></div>' +
      '<div class="why"><span class="b">→</span><span>' + esc(topReasons(e, p, 1)[0]) + '</span></div></div>' +
      '<div class="match"><div class="pct">' + e.total + '</div><div class="lab">MATCH</div></div></button>';
  }).join('');

  return '<div class="screen">' +
    (state.previewCombo ? '<div class="banner"><span>' + esc(t(per.title)) + t(' 유형으로 미리보는 중</span><button data-action="clear-preview">내 유형으로</button></div>') : '') +
    '<div class="scroll">' +
      '<div class="reveal">' +
        '<div class="char-frame">' + character(parts[0], parts[1], 132) + '</div>' +
        '<div class="kicker">' + (state.previewCombo ? t('다른 유형 미리보기') : t('당신의 미식가 유형')) + '</div>' +
        '<h1>' + esc(t(per.title)) + '</h1>' +
        '<p class="tag">' + esc(t(per.tag)) + '</p>' +
        '<div class="axis-pair"><span class="axis-pill">' + esc(t(exShort)) + '</span><span class="axis-pill">' + esc(t(atShort)) + '</span></div>' +
      '</div>' +
      '<div class="sect"><p class="body-copy">' + esc(t(per.body)) + '</p>' +
        '<div class="kw-row" style="margin-top:14px">' + per.kw.map(function(k){ return '<span class="kw">' + esc(t(k)) + '</span>'; }).join('') + '</div>' +
      '</div>' +
      t('<div class="sect"><h3 class="sect-title">입력한 조건</h3>') +
        '<div class="stat-3">' +
          t('<div class="stat"><div class="k">국적</div><div class="v">') + esc(natLabel(p)) + '</div></div>' +
          t('<div class="stat"><div class="k">매운맛</div><div class="v num">') + p.spice + '/10</div></div>' +
          t('<div class="stat"><div class="k">분위기</div><div class="v">') + esc(t(atShort)) + '</div></div>' +
        '</div>' +
        '<div class="cohort" style="margin-top:12px"><span class="big">' + pct + '%</span>' +
        '<p>' + esc(tpl('cohort', { nat:natLabel(p) })) + '</p></div>' +
      '</div>' +
      '<div class="sect"><h3 class="sect-title">' + esc(t(state.origin.label)) + t(' 주변 상위 추천</h3>') +
        (top.length ? preview
          : '<p class="fine" style="margin:0">' + esc(t(poolStillLoading() ? '주변 식당을 찾고 있어요' : '반경을 넓히면 더 많은 곳이 보여요')) + '</p>') +
        '<button class="cta" style="margin-top:12px" data-action="go" data-key="places">' +
          (rec.list.length ? esc(tpl('mapCount', { n:rec.list.length }))
                           : esc(t('내 주변 식당 찾으러 가기'))) + '</button>' +
        t('<button class="cta ghost" style="margin-top:8px" data-action="go" data-key="guide">9가지 유형 둘러보기</button>') +
      '</div>' +
    '</div>' + tabs('result') + '</div>';
}

var RADII = [0.5, 1, 2, 5];

/* 아직 비짓서울 API에서 장소를 모으는 중인가 */
function poolStillLoading(){
  return state.pool.status === 'loading' || state.pool.filling === true;
}

function placeCard(e, p, rank){
  var m = e.menu;
  var tags = '<span class="tag">🌶️ ' + m.spice + t('/10 추정</span>') +
    '<span class="tag">' + esc(t(VIBE_LABEL[m.vibe]) || t('중간')) + '</span>';
  if(m.veganOk.length) tags += t('<span class="tag veg">채식 가능</span>');
  if(m.halal) tags += t('<span class="tag halal">할랄</span>');
  var why = topReasons(e, p, 2);
  return '<button class="place ' + (state.selectedId === m.id ? 'sel' : '') + '" id="card-' + m.id + '" data-action="menu" data-key="' + m.id + '">' +
    (rank ? '<span class="rankdot">' + rank + '</span>' : '') +
    '<div class="body"><div class="nm">' + esc(m.name) + '</div>' +
    '<div class="loc">' + esc(m.place) + ' · ' + esc(m.gu) + '</div>' +
    '<div class="walk"><b class="num">' + fmtDist(e.km) + '</b><span>' + esc(tpl('walkMin', { min:walkMin(e.km) })) + '</span></div>' +
    why.map(function(w){ return '<div class="why"><span class="b">→</span><span>' + esc(w) + '</span></div>'; }).join('') +
    '<div class="tagrow">' + tags + '</div></div>' +
    '<div class="match"><div class="pct">' + e.total + '</div><div class="lab">MATCH</div></div></button>';
}

function locPanel(){
  if(!state.showLoc) return '';
  var chips = ORIGINS.map(function(o){
    return '<button class="chip ' + (state.origin.key === o.key ? 'on' : '') + '" data-action="origin" data-key="' + o.key + '">' + esc(t(o.label)) + '</button>';
  }).join('');
  return '<div class="locpanel">' +
    t('<button class="cta ghost" data-action="geo">📍 지금 내 위치로 설정하기</button>') +
    (state.geoMsg ? '<p class="muted" style="margin:9px 0 0">' + esc(state.geoMsg) + '</p>' : '') +
    t('<p class="muted" style="margin:12px 0 8px">또는 이동 거점에서 고르기</p>') +
    '<div class="chips">' + chips + '</div></div>';
}

export function screenPlaces(){
  var p = activePersonaProfile();
  var rec = recommend(p);
  var per = PERSONAS[activeCombo()];

  var radChips = RADII.map(function(r){
    return '<button class="rchip ' + (state.radiusKm === r ? 'on' : '') + '" data-action="radius" data-key="' + r + '">' +
           fmtRadius(r) + '</button>';
  }).join('');

  /* 아직 한 곳도 못 찾았고 수집 중이면, 지도 자리에 대기 UI를 덮는다.
     같은 문구를 본문에도 반복하지 않는다. */
  var mapWaiting = !rec.list.length && poolStillLoading();

  var body;
  if(rec.list.length){
    body = rec.list.map(function(e, i){ return placeCard(e, p, i + 1); }).join('');
  } else if(mapWaiting){
    body = '';
  } else if(state.pool.status === 'error'){
    body = t('<div class="empty-state"><b>비짓서울 API에서 데이터를 불러오지 못했어요.</b><br>') +
      esc(state.pool.error || '') + t('<br><button class="cta ghost" style="margin-top:12px" data-action="reload-pool">다시 시도하기</button></div>');
  } else {
    var nearest = rec.far[0];
    body = '<div class="empty-state"><b>' + esc(tpl('emptyRadius', { r:fmtRadius(state.radiusKm) })) + '</b>' +
      (nearest ? t('<br>가장 가까운 곳은 ') + esc(nearest.menu.name) + ' — ' + fmtDist(nearest.km) + t(' 거리예요. 반경을 넓혀보세요.') : '') + '</div>' +
      (nearest ? placeCard(nearest, p, null) : '');
  }

  var offCount = rec.far.length + rec.blocked.length;
  var notes = '';
  if(offCount){
    notes = '<button class="offnote" data-action="toggle-off">' +
      t('<span>제외된 ') + offCount + t('곳 · 반경 밖 ') + rec.far.length + t(' · 조건 불일치 ') + rec.blocked.length + '</span>' +
      '<span class="chev">' + (state.showOff ? t('접기') : t('보기')) + '</span></button>';
    if(state.showOff){
      notes += '<div class="offlist">' +
        rec.blocked.map(function(b){
          return '<div class="offrow"><span>' + esc(b.menu.name) + '</span><span class="r">' + esc(b.why) + '</span></div>';
        }).join('') +
        rec.far.map(function(f){
          return '<div class="offrow"><span>' + esc(f.menu.name) + '</span><span class="r">' + fmtDist(f.km) + t(' · 반경 밖</span></div>');
        }).join('') + '</div>';
    }
  }

  return '<div class="screen">' +
    (state.previewCombo ? '<div class="banner"><span>' + esc(t(per.title)) + t(' 유형 기준 추천</span><button data-action="clear-preview">내 유형으로</button></div>') : '') +
    '<div class="scroll">' +
      '<div class="locbar"><button class="locbtn" data-action="toggle-loc">' +
        t('<span class="pinico">📍</span><span class="l"><span class="k">현재 위치') + (state.origin.live ? ' · GPS' : '') + '</span>' +
        '<span class="v">' + esc(t(state.origin.label)) + '</span></span>' +
        '<span class="chev">' + (state.showLoc ? t('닫기') : t('변경')) + '</span></button>' + locPanel() + '</div>' +
      '<div class="mapwrap"><div id="kmap-places" style="width:100%;height:248px"></div>' +
        (mapWaiting
          ? '<div class="map-wait"><span class="spinner" aria-hidden="true"></span>' +
            '<b>' + esc(t('주변 식당을 찾고 있어요')) + '</b>' +
            '<span class="sub">' + esc(state.pool.total
                ? tpl('loadProgress', { done:state.pool.done, total:state.pool.total })
                : t('비짓서울 API에 연결하는 중이에요')) + '</span></div>'
          : '') + '</div>' +
      t('<div class="radrow"><span class="muted">반경</span>') + radChips +
        '<span class="cnt num">' + (mapWaiting ? '—' : rec.list.length + t('곳')) + '</span></div>' +
      '<div class="pad" style="padding-top:14px">' +
        '<h2 class="display" style="font-size:20px;margin:0 0 4px">' + esc(tpl('nearOrder', { persona:t(per.title) })) + '</h2>' +
        t('<p class="muted" style="margin:0 0 13px">매치도 = 국적 선호 28% · 매운맛 22% · <b>거리 20%</b> · 탐색 성향 16% · 분위기 14%</p>') +
        ((!mapWaiting && poolStillLoading())
          ? '<p class="fine" style="margin:0 0 10px">' + esc(tpl('loadProgress', { done:state.pool.done, total:state.pool.total })) + '</p>' : '') +
        notes +
        '<div style="margin-top:12px">' + body + '</div>' +
        t('<p class="fine" style="margin-top:16px">목록에 뜨는 곳은 모두 비짓서울 API에 실제로 등록된 콘텐츠이고, 지도의 위치는 API가 준 실제 좌표입니다(OpenStreetMap). 거리·도보 시간은 직선거리 기준 추정값이며, 매운맛·알레르기는 이름·대표 메뉴에서 추정한 값입니다.</p>') +
      '</div>' +
    '</div>' + tabs('places') + '</div>';
}

export function screenMenu(){
  var p = activePersonaProfile();
  var m = PLACES.filter(function(x){ return x.id === state.activeMenu; })[0];
  if(!m) return screenPlaces();
  var e = scoreMenu(m, p);

  var bars = WEIGHTS.map(function(w){
    return '<div class="bar-row"><div class="top"><b>' + esc(t(w.label)) + '</b>' +
      '<span class="w">' + e.parts[w.key] + ' × ' + Math.round(w.w * 100) + '%</span></div>' +
      '<div class="track"><div class="fill ' + w.cls + '" style="width:' + e.parts[w.key] + '%"></div></div></div>';
  }).join('');

  var alg = m.allergens.map(function(a){ return t(ALLERGEN_LABEL[a]) || a; }).join(', ') || t('추정된 성분 없음');
  var vegLine = m.veganOk.length
    ? (m.dietaryLabels && m.dietaryLabels.length ? m.dietaryLabels.join(', ') : t('채식 관련 표기 있음'))
    : t('채식 정보 없음');

  var others = recommend(p).list.filter(function(x){ return x.menu.id !== m.id; }).slice(0, 2).map(function(x){
    return '<button class="place" data-action="menu" data-key="' + x.menu.id + '">' +
      '<div class="body"><div class="nm">' + esc(x.menu.name) + '</div>' +
      '<div class="loc">' + esc(x.menu.gu) + ' · ' + esc(x.menu.cat) + '</div></div>' +
      '<div class="match"><div class="pct">' + x.total + '</div><div class="lab">MATCH</div></div></button>';
  }).join('');

  return '<div class="screen"><div class="scroll">' +
    t('<div class="topbar"><button data-action="go" data-key="places" aria-label="뒤로">') + ICON.back + '</button>' +
    '<h3>' + esc(m.name) + '</h3></div>' +
    '<div class="hero-fig" style="background:' + AXIS_WASH[p.explore] + '">' +
      '<div style="text-align:center"><div class="num" style="font-size:38px;color:var(--red);line-height:1">' + e.total + '</div>' +
      '<div class="muted" style="letter-spacing:.1em;font-size:10px">MATCH SCORE</div></div>' +
    '</div>' +
    '<div class="sect"><div class="muted" style="font-size:11.5px">' + esc(m.place) + ' · ' + esc(m.gu) + ' · ' + esc(m.cat) + '</div>' +
      '<p class="body-copy" style="margin-top:9px">' + esc(m.blurb) + '</p></div>' +
    t('<div class="sect"><h3 class="sect-title">여기서 가는 길</h3>') +
      '<div class="mapwrap mini"><div id="kmap-menu" style="width:100%;height:180px"></div></div>' +
      '<div class="kv" style="margin-top:4px"><span class="k">' + esc(tpl('fromOrigin', { origin:t(state.origin.label) })) + '</span>' +
      '<span class="v num">' + esc(tpl('distWalk', { dist:fmtDist(e.km), min:walkMin(e.km) })) + '</span></div>' +
      t('<p class="fine" style="margin-top:8px">📍 비짓서울 API가 제공한 실제 좌표(') + m.lat.toFixed(5) + ', ' + m.lng.toFixed(5) + t(')로 표시했습니다.</p></div>') +
    t('<div class="sect"><h3 class="sect-title">이 점수가 나온 이유</h3><div class="bars">') + bars + '</div></div>' +
    t('<div class="sect"><h3 class="sect-title">내 조건과 대조</h3>') +
      t('<div class="kv"><span class="k">거리</span><span class="v num">') + esc(tpl('radiusBasis', { dist:fmtDist(e.km), r:fmtRadius(state.radiusKm) })) + '</span></div>' +
      '<div class="kv"><span class="k">' + esc(tpl('natPref', { nat:natLabel(p) })) + '</span><span class="v num">' + e.parts.nat + ' / 100</span></div>' +
      t('<div class="kv"><span class="k">매운 정도</span><span class="v num">') + esc(tpl('spiceMine', { v:m.spice, mine:p.spice })) + '</span></div>' +
      t('<div class="kv"><span class="k">알레르기 유발 성분</span><span class="v">') + esc(alg) + '</span></div>' +
      t('<div class="kv"><span class="k">채식</span><span class="v ') + (m.veganOk.length ? 'ok' : '') + '">' + esc(vegLine) + '</span></div>' +
      t('<div class="kv"><span class="k">할랄</span><span class="v ') + (m.halal ? 'ok' : 'no') + '">' + (m.halal ? t('관련 표기 있음') : t('정보 없음')) + '</span></div>' +
    '</div>' +
    t('<p class="fine" style="margin:0 16px">매운맛·알레르기 성분은 비짓서울 API에 없는 항목이라, 가게 이름·대표 메뉴·태그를 기준으로 <b>추정</b>한 값입니다. 할랄·채식은 API가 제공하는 표기를 그대로 씁니다.</p>') +
    (m.tip ? t('<div class="sect"><h3 class="sect-title">대표 메뉴</h3><div class="tipbox">') + esc(m.tip) + '</div></div>' : '') +
    t('<div class="sect"><h3 class="sect-title">비짓서울 원본 데이터</h3>') + rawDataSectionHtml(m) + '</div>' +
    t('<div class="sect"><h3 class="sect-title">다음 한 입</h3>') + others + '</div>' +
    '</div>' + tabs('places') + '</div>';
}

export function screenGuide(){
  var mine = comboKey(state.profile);
  var groups = EXPLORE.map(function(ex){
    var rows = ATMOS.map(function(at){
      var key = ex.key + '-' + at.key;
      var per = PERSONAS[key];
      var isMine = key === mine;
      return '<button class="type-row ' + (isMine ? 'mine' : '') + '" data-action="type" data-key="' + key + '">' +
        '<span class="avatar" style="background:' + AXIS_WASH[ex.key] + '">' + character(ex.key, at.key, 44) + '</span>' +
        '<span class="info"><span class="nm">' + esc(t(per.title)) + (isMine ? t('<span class="mine-badge">내 유형</span>') : '') + '</span>' +
        '<span class="sub">' + esc(t(per.tag)) + '</span></span></button>';
    }).join('');
    return '<div class="type-group"><div class="group-head">' +
      '<span class="swatch" style="background:' + AXIS_COLOR[ex.key] + '"></span>' +
      '<b>' + esc(t(ex.short)) + '</b><small>' + esc(t(ex.sub)) + '</small></div>' + rows + '</div>';
  }).join('');

  return '<div class="screen"><div class="scroll"><div class="pad">' +
    t('<h2 class="display" style="font-size:22px;margin:0 0 4px">9가지 미식가 유형</h2>') +
    t('<p class="muted" style="margin:0 0 18px">새로운 메뉴를 고르는 방식(가로 축)과 선호하는 식당 분위기(세로 축)를 조합해 아홉 가지가 나옵니다. 눌러서 다른 유형의 추천도 볼 수 있어요.</p>') +
    groups + '</div></div>' + tabs('guide') + '</div>';
}

export function screenType(){
  var key = state.openType;
  var per = PERSONAS[key];
  var parts = key.split('-');
  var isMine = key === comboKey(state.profile);
  var exShort = EXPLORE.filter(function(e){ return e.key === parts[0]; })[0];
  var atShort = ATMOS.filter(function(a){ return a.key === parts[1]; })[0];

  return '<div class="screen"><div class="scroll">' +
    t('<div class="topbar"><button data-action="go" data-key="guide" aria-label="뒤로">') + ICON.back + t('</button><h3>미식가 유형</h3></div>') +
    '<div class="reveal">' +
      '<div class="char-frame">' + character(parts[0], parts[1], 124) + '</div>' +
      '<div class="kicker">' + (isMine ? t('내 유형') : t('유형 소개')) + '</div>' +
      '<h1>' + esc(t(per.title)) + '</h1><p class="tag">' + esc(t(per.tag)) + '</p>' +
      '<div class="axis-pair"><span class="axis-pill">' + esc(t(exShort.short)) + '</span><span class="axis-pill">' + esc(t(atShort.short)) + '</span></div>' +
    '</div>' +
    '<div class="sect"><p class="body-copy">' + esc(t(per.body)) + '</p>' +
      '<div class="kw-row" style="margin-top:14px">' + per.kw.map(function(k){ return '<span class="kw">' + esc(t(k)) + '</span>'; }).join('') + '</div></div>' +
    t('<div class="sect"><h3 class="sect-title">이 유형의 기준</h3>') +
      t('<div class="kv"><span class="k">메뉴 선택</span><span class="v">') + esc(t(exShort.label)) + '</span></div>' +
      t('<div class="kv"><span class="k">식당 분위기</span><span class="v">') + esc(t(atShort.label)) + '</span></div></div>' +
    '<div class="sect">' +
      (isMine
        ? t('<button class="cta" data-action="go" data-key="places">내 추천 맛집 보기</button>')
        : '<button class="cta" data-action="preview" data-key="' + key + t('">이 유형 기준으로 추천 보기</button>') +
          t('<p class="fine" style="margin-top:9px">내 조건(국적·매운맛·알레르기)은 그대로 두고, 이 유형의 성향만 적용해 다시 계산합니다.</p>')) +
    '</div></div>' + tabs('guide') + '</div>';
}

export function screenProfile(){
  var p = state.profile;
  var rows = [
    { k:t('국적'), v:natLabel(p), step:0 },
    { k:t('메뉴 선택 성향'), v:t(EXPLORE.filter(function(e){ return e.key === p.explore; })[0].label), step:1 },
    { k:t('식당 분위기'), v:t(ATMOS.filter(function(a){ return a.key === p.atmosphere; })[0].label), step:2 },
    { k:t('매운맛'), v:p.spice + ' / 10', step:3 },
    { k:t('알레르기 · 못 먹는 재료'), v:p.noAllergy ? t('없음') :
        p.allergens.map(function(a){ return t(ALLERGEN_LABEL[a]); }).concat(p.customAllergens).join(', '), step:4 },
    { k:t('채식'), v:p.veganNone ? t('해당없음') : p.vegan.map(function(v){ return t(VEGAN_LABEL[v]); }).join(', '), step:5 },
    { k:t('할랄'), v:p.halal ? t('할랄 인증 메뉴만') : t('제한 없음'), step:6 }
  ];
  return '<div class="screen"><div class="scroll"><div class="pad">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      t('<h2 class="display" style="font-size:22px;margin:0">내 조건</h2>') + langSwitchHtml() + '</div>' +
    t('<p class="muted" style="margin:0 0 8px">값을 바꾸면 유형과 추천이 즉시 다시 계산됩니다.</p>') +
    rows.map(function(r){
      return '<div class="prow"><span class="l"><span class="k">' + esc(r.k) + '</span>' +
        '<span class="v">' + esc(r.v || '—') + '</span></span>' +
        '<button class="btn-sm" data-action="edit" data-key="' + r.step + t('">수정</button></div>');
    }).join('') +
    t('<button class="cta ghost" style="margin-top:20px" data-action="reset">처음부터 다시 하기</button>') +
    t('<p class="fine" style="margin-top:14px">2026 서울관광재단 비짓서울 API 데이터·AI 활용 아이디어 공모전 · 미식 프로파일러 프로토타입. 모든 장소 데이터는 비짓서울 API 실시간 응답입니다.</p>') +
    '</div></div>' + tabs('profile') + '</div>';
}
