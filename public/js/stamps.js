/* 미식 여권의 도장 — 저장, 칭호, 도장 그림(SVG)
   도장 하나 = "이 추천이 실제로 맞았다"는 기록이다. */

import { state } from './state.js';
import { esc, hash } from './util.js';
import { t } from './i18n.js';

export var STAMP_KEY  = 'tastematch.stamps.v1';
export var STAMP_GOAL = 5;      /* 여권 한 권을 완성하는 도장 수 */
export var CHECKIN_M  = 300;    /* 이 거리(m) 안에서만 실제 도장이 찍힌다 */

export function readStamps(){
  try{
    var raw = localStorage.getItem(STAMP_KEY);
    var a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a : [];
  }catch(e){ return []; }
}

function write(list){
  try{ localStorage.setItem(STAMP_KEY, JSON.stringify(list)); }catch(e){}
}

export function hasStamp(cid){
  return readStamps().some(function(s){ return s.cid === cid; });
}

/* place = 추천 결과의 장소 객체, demo = 위치 확인 없이 찍은 도장인지 */
export function addStamp(place, demo){
  var list = readStamps();
  if(list.some(function(s){ return s.cid === place.cid; })) return list;
  list.push({
    cid:   place.cid,
    name:  place.name,
    kind:  place.kind,
    gu:    place.gu,
    menu:  place.tip || '',
    spice: place.spice,
    lat:   place.lat,
    lng:   place.lng,
    at:    Date.now(),
    demo:  !!demo
  });
  write(list);
  return list;
}

export function clearStamps(){ write([]); }

/* ---- 칭호 ---- */

var KIND_TITLE = {
  '한식': '한식 순례자',
  '분식': '분식 탐험가',
  '카페': '카페 수집가',
  '중식': '경계 없는 미식가',
  '일식': '경계 없는 미식가',
  '양식': '경계 없는 미식가',
  '기타': '경계 없는 미식가'
};

export function titleOf(list){
  if(!list || list.length < 3) return null;

  var spicy = list.filter(function(s){ return (s.spice || 0) >= 7; });
  if(spicy.length >= 3) return { key:'spice', label:'매운맛 정복자' };

  var gus = {};
  list.forEach(function(s){ if(s.gu) gus[s.gu] = 1; });
  if(Object.keys(gus).length >= 4) return { key:'gu', label:'서울 종주자' };

  var counts = {};
  list.forEach(function(s){ counts[s.kind] = (counts[s.kind] || 0) + 1; });
  var top = Object.keys(counts).sort(function(a,b){ return counts[b] - counts[a]; })[0];
  return { key:'kind', label:KIND_TITLE[top] || '경계 없는 미식가', kind:top, n:counts[top] };
}

/* ---- 도장 그림 ---- */

var INK = {
  '한식':'#C8102E', '분식':'#A32D84', '카페':'#0072CE',
  '중식':'#A76D11', '일식':'#A76D11', '양식':'#A76D11', '기타':'#A76D11'
};

function ymd(ms){
  var d = new Date(ms);
  return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
}

/* 같은 가게는 늘 같은 각도로 찍히도록 이름에서 각도를 만든다 */
export function stampAngle(st){ return (hash(st.cid || st.name || 'x') % 17) - 8; }

/* 도장 내부 그림만 (viewBox 0 0 120 120). 화면과 이미지 저장이 같이 쓴다.
   회전은 CSS가 아니라 SVG transform 속성으로 준다 — 이미지로 구울 때도 그대로 적용된다. */
export function stampInner(st, uid){
  var ink = INK[st.kind] || '#A76D11';
  var id = 'arc' + uid;
  var label = t(st.kind || '').slice(0, 10);
  var menu = (st.menu || st.name || '').replace(/\s*\(.*$/, '').slice(0, 7);

  return '<defs><path id="' + id + '" d="M 60 60 m -44 0 a 44 44 0 1 1 88 0" fill="none"/></defs>' +
    '<g transform="rotate(' + stampAngle(st) + ' 60 60)" font-family="sans-serif">' +
      '<g fill="none" stroke="' + ink + '" stroke-width="3" opacity=".92">' +
        '<circle cx="60" cy="60" r="55"/><circle cx="60" cy="60" r="47" stroke-width="1.5"/>' +
      '</g>' +
      '<text font-size="10.5" font-weight="700" letter-spacing="2.4" fill="' + ink + '" opacity=".92">' +
        '<textPath href="#' + id + '" xlink:href="#' + id + '" startOffset="50%" text-anchor="middle">SEOUL TASTE</textPath></text>' +
      '<text x="60" y="52" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1.5" ' +
        'fill="' + ink + '" opacity=".85">' + esc(label) + '</text>' +
      '<text x="60" y="72" text-anchor="middle" font-size="' + (menu.length > 4 ? 15 : 19) + '" font-weight="800" ' +
        'fill="' + ink + '">' + esc(menu) + '</text>' +
      '<text x="60" y="88" text-anchor="middle" font-size="9" font-family="monospace" ' +
        'fill="' + ink + '" opacity=".8">' + ymd(st.at) + '</text>' +
      '<line x1="26" y1="94" x2="94" y2="94" stroke="' + ink + '" stroke-width="1.2" opacity=".5"/>' +
    '</g>';
}

export function stampSvg(st, size){
  var s = size || 132;
  var uid = Math.abs(hash((st.cid || st.name || '') + s));
  return '<svg class="stamp-svg" viewBox="0 0 120 120" width="' + s + '" height="' + s + '" role="img" ' +
    'aria-label="' + esc(st.name || '') + '">' + stampInner(st, uid) + '</svg>';
}

export function stampDate(ms){ return ymd(ms); }

/* 여권 번호 — 프로필에서 만들어 낸 고정 문자열 (개인정보 아님) */
export function passportNo(){
  var p = state.profile;
  var seed = [p.natKey, p.natCustom, p.explore, p.atmosphere, p.spice].join('|');
  var n = hash(seed);
  return 'TM' + String(n % 1000000 + 100000).slice(0, 6);
}
