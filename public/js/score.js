/* 추천 엔진 — 항목별 점수, 하드 필터, 추천 이유 */

import { clamp, distKm, fmtDist, hash, walkMin } from './util.js';
import { ALLERGEN_LABEL, NAT_CUISINE, NAT_CUISINE_DEFAULT, NOVELTY_LABEL, VIBE_LABEL } from './data.js';
import { state } from './state.js';
import { t, tpl } from './i18n.js';
import { natLabel } from './profile.js';
import { PLACES } from './api.js';

/* 위치 선택지 — 관광객 이동 거점 */
export var ORIGINS = [
  { key:'myeongdong', label:'명동역', lat:37.5609, lng:126.9860 },
  { key:'jongno',     label:'종로3가역', lat:37.5704, lng:126.9919 },
  { key:'hongdae',    label:'홍대입구역', lat:37.5572, lng:126.9244 },
  { key:'itaewon',    label:'이태원역', lat:37.5346, lng:126.9946 },
  { key:'seoulstn',   label:'서울역', lat:37.5547, lng:126.9707 },
  { key:'ddp',        label:'동대문역사문화공원', lat:37.5653, lng:127.0079 },
  { key:'seongsu',    label:'성수역', lat:37.5446, lng:127.0559 },
  { key:'gangnam',    label:'강남역', lat:37.4979, lng:127.0276 }
];



/* ============================================================
   매칭 엔진
   ============================================================ */

export var WEIGHTS = [
  { key:'nat',     label:'국적별 선호도', w:0.28, cls:'' },
  { key:'spice',   label:'매운맛 적합도', w:0.22, cls:'' },
  { key:'dist',    label:'현재 위치에서 거리', w:0.20, cls:'t' },
  { key:'explore', label:'탐색 성향 적합도', w:0.16, cls:'t' },
  { key:'vibe',    label:'분위기 적합도', w:0.14, cls:'t' }
];


function natScore(place, natKey){
  var table = NAT_CUISINE[natKey] || NAT_CUISINE_DEFAULT;
  var s = table[place.kind] || table['기타'] || 65;
  s += (hash(place.cid + '|' + natKey) % 9) - 4;
  return clamp(Math.round(s), 34, 99);
}
function spiceScore(place, spice){
  return clamp(Math.round(100 - Math.abs(place.spice - spice) * 11), 0, 100);
}
function exploreScore(place, explore){
  if(explore === 'adventure') return { exotic:100, mid:72, familiar:44 }[place.novelty] || 70;
  if(explore === 'trend') return { trendy:92, mixed:70, local:54 }[place.vibe] || 70;
  return { familiar:100, mid:82, exotic:48 }[place.novelty] || 75;
}
function vibeScore(place, atm){
  if(atm === 'either') return 86;
  if(place.vibe === 'mixed') return 78;
  var wants = atm === 'quiet' ? 'local' : 'trendy';
  return place.vibe === wants ? 100 : 50;
}
function distScore(km){ return clamp(Math.round(100 * Math.exp(-km / 2.8)), 0, 100); }

function blockReason(place, p){
  var i, hit = [];
  if(!p.noAllergy){
    for(i=0;i<p.allergens.length;i++){
      if(place.allergens.indexOf(p.allergens[i]) >= 0) hit.push(t(ALLERGEN_LABEL[p.allergens[i]]));
    }
    for(i=0;i<p.customAllergens.length;i++){
      /* 변수명을 t로 두면 번역 함수 t()를 가려 버린다(var 호이스팅) */
      var word = p.customAllergens[i];
      if(place.name.indexOf(word) >= 0 || place.blurb.indexOf(word) >= 0 ||
         place.cat.indexOf(word) >= 0 || (place.tip || '').indexOf(word) >= 0) hit.push(word);
    }
  }
  if(hit.length) return tpl('blockedAllergy', { list:hit.join(', ') });
  if(!p.veganNone && p.vegan.length && !place.veganOk.length) return t('채식 정보 없음');
  if(p.halal && !place.halal) return t('할랄 정보 없음');
  return null;
}

export function scoreMenu(place, p){
  var o = state.origin;
  var km = distKm(o.lat, o.lng, place.lat, place.lng);
  var parts = {
    nat: natScore(place, p.natKey),
    spice: spiceScore(place, p.spice),
    dist: distScore(km),
    explore: exploreScore(place, p.explore),
    vibe: vibeScore(place, p.atmosphere)
  };
  var total = 0, i;
  for(i=0;i<WEIGHTS.length;i++) total += parts[WEIGHTS[i].key] * WEIGHTS[i].w;
  return { menu:place, parts:parts, km:km, total:Math.round(total) };
}

function reasonFor(key, place, p, parts, km){
  if(key === 'dist') return tpl('distReason', { dist:fmtDist(km), min:walkMin(km) });
  if(key === 'nat') return tpl('natReason', { nat:natLabel(p), kind:t(place.kind), score:parts.nat });
  if(key === 'spice'){
    var d = Math.abs(place.spice - p.spice);
    if(d === 0) return tpl('spiceExact', { v:place.spice });
    if(d <= 2) return tpl('spiceNear', { v:place.spice });
    return tpl('spicePlain', { v:place.spice });
  }
  if(key === 'explore'){
    if(p.explore === 'adventure') return tpl('exploreAdv', { novelty:t(NOVELTY_LABEL[place.novelty]) });
    if(p.explore === 'trend') return tpl('exploreTrend', { vibe:t(VIBE_LABEL[place.vibe]) || t('중간') });
    return tpl('exploreProven', {});
  }
  return tpl('vibeReason', { vibe:t(VIBE_LABEL[place.vibe]) || t('중간') });
}

export function topReasons(entry, p, n){
  var scored = WEIGHTS.map(function(w){
    return { key:w.key, v:entry.parts[w.key] * w.w };
  }).sort(function(a,b){ return b.v - a.v; });
  return scored.slice(0, n).map(function(s){
    return reasonFor(s.key, entry.menu, p, entry.parts, entry.km);
  });
}

export function recommend(p){
  var ok = [], blocked = [], far = [];
  PLACES.forEach(function(m){
    var b = blockReason(m, p);
    if(b){ blocked.push({ menu:m, why:b }); return; }
    var e = scoreMenu(m, p);
    if(e.km > state.radiusKm) far.push(e); else ok.push(e);
  });
  var bySort = function(a, b){ return b.total - a.total || a.km - b.km; };
  ok.sort(bySort);
  far.sort(function(a, b){ return a.km - b.km; });
  return { list:ok, blocked:blocked, far:far, pending:0 };
}
