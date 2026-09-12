/* 미식가 유형 캐릭터 일러스트(SVG) */

import { AXIS_COLOR } from './data.js';

/* ============================================================
   캐릭터 일러스트 (탐색 축 = 모자 / 분위기 축 = 포즈)
   ============================================================ */

function hatFor(explore, c){
  if(explore === 'adventure'){
    return '<path d="M35 39 Q37 23 50 23 Q63 23 65 39 Z" fill="#A76D11"/>' +
           '<ellipse cx="50" cy="39" rx="25" ry="5" fill="#7E520C"/>' +
           '<rect x="35" y="34" width="30" height="4.5" rx="2" fill="#FFCD00"/>';
  }
  if(explore === 'trend'){
    return '<path d="M50 38 L50 26" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round"/>' +
           '<circle cx="50" cy="22" r="4.4" fill="#FFCD00"/>';
  }
  return '<path d="M36 39 L36 31 Q34 22 43 24 Q50 17 57 24 Q66 22 64 31 L64 39 Z" fill="#FFFFFF"/>' +
         '<rect x="36" y="36" width="28" height="5.5" rx="2.5" fill="#DCDEE0"/>';
}

var INK = '#26225B', CREAM = '#FFFFFF', GOLD = '#FFCD00';

function arm(c, d){
  return '<path d="' + d + '" stroke="' + c + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>';
}
function heart(x, y, s, fill){
  return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    '<path d="M7 12.5 C.8 8.2 -.2 4.6 2.3 2.4 C4.4 .6 6.3 2 7 3.4 C7.7 2 9.6 .6 11.7 2.4 C14.2 4.6 13.2 8.2 7 12.5 Z" fill="' + fill + '"/></g>';
}
var STAR_PATH = 'M0 -11 L2.7 -3.7 L10.5 -3.4 L4.4 1.4 L6.5 8.9 L0 4.6 L-6.5 8.9 L-4.4 1.4 L-10.5 -3.4 L-2.7 -3.7 Z';

/* 유형 이름에 맞춘 소품 — 모자(탐색 축)는 같은 계열로 유지 */
var POSE = {
  /* 골목 개척자 — 골목 사이에서 지도를 펼쳐 든 모습 */
  'adventure-quiet': function(c){
    return {
      back:'<rect x="0" y="26" width="7" height="74" rx="2" fill="' + c + '" opacity=".17"/>' +
           '<rect x="93" y="26" width="7" height="74" rx="2" fill="' + c + '" opacity=".17"/>',
      arms: arm(c, 'M27 64 Q19 71 22 78'),
      front:'<path d="M13 73 L28 69 L28 87 L13 91 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>' +
            '<path d="M20.5 71 L20.5 89" stroke="' + INK + '" stroke-width="1" opacity=".4"/>' +
            '<circle cx="24" cy="78" r="2.3" fill="' + c + '"/>'
    };
  },
  /* 무경계 미식가 — 경계선을 넘어 양손에 각기 다른 음식 */
  'adventure-either': function(c){
    return {
      back:'<circle cx="50" cy="62" r="41" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-dasharray="7 9" opacity=".33"/>',
      arms: arm(c, 'M26 62 Q15 62 11 68') + arm(c, 'M74 62 Q85 58 87 51'),
      front:'<ellipse cx="13" cy="69" rx="11" ry="2.6" fill="#E4E6E8" stroke="' + INK + '" stroke-width="1.3"/>' +
            '<path d="M2.5 69 L23.5 69 Q21 82 13 82 Q5 82 2.5 69 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>' +
            '<path d="M83 56 L96 37" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<circle cx="86" cy="54" r="3.3" fill="' + GOLD + '"/><circle cx="90" cy="48" r="3.3" fill="' + c + '"/><circle cx="94" cy="42" r="3.3" fill="' + GOLD + '"/>'
    };
  },
  /* 번개 도전자 — 몸을 기울이고 속도선, 번개 */
  'adventure-trendy': function(c){
    return {
      tilt:-11,
      back:'<path d="M1 52 h15" stroke="' + c + '" stroke-width="3.2" opacity=".4" stroke-linecap="round"/>' +
           '<path d="M0 62 h19" stroke="' + c + '" stroke-width="3.2" opacity=".5" stroke-linecap="round"/>' +
           '<path d="M2 72 h13" stroke="' + c + '" stroke-width="3.2" opacity=".35" stroke-linecap="round"/>',
      arms: arm(c, 'M72 62 Q82 56 84 48'),
      front:'<g transform="translate(82,30)"><path d="M2 -10 L-7 4 L0 4 L-5 17 L9 0 L1 0 Z" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="1.2" stroke-linejoin="round"/></g>'
    };
  },
  /* 숨은 화제 헌터 — 돋보기로 찾고, 언급량은 막 오르는 중 */
  'trend-quiet': function(c){
    return {
      arms: arm(c, 'M27 64 Q19 70 21 75'),
      front:'<circle cx="19" cy="75" r="9.5" fill="' + CREAM + '" fill-opacity=".65" stroke="' + INK + '" stroke-width="2.4"/>' +
            '<path d="M26 82 L33 90" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>' +
            '<path d="M70 59 L77 49 L84.5 38" fill="none" stroke="' + GOLD + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path d="M78 38.5 L85 37 L84.5 44" fill="none" stroke="' + GOLD + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    };
  },
  /* 인플루언서 미식가 — 음식을 찍어 올리는 중 */
  'trend-either': function(c){
    return {
      arms: arm(c, 'M72 62 Q80 57 79 51'),
      front:'<g transform="rotate(24 79 45)"><rect x="72" y="33" width="14" height="21" rx="3.2" fill="' + INK + '"/>' +
            '<rect x="74" y="36" width="10" height="14" rx="1.6" fill="#FFFFFF"/></g>' +
            '<ellipse cx="77" cy="75" rx="13" ry="3" fill="#E4E6E8" stroke="' + INK + '" stroke-width="1.3"/>' +
            '<path d="M64 75 L90 75 Q87 88 77 88 Q67 88 64 75 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>' +
            heart(6, 34, 1.05, GOLD) + heart(19, 20, .72, c)
    };
  },
  /* 핫플 스트리터 — 대기 줄과 번호표 */
  'trend-trendy': function(c){
    return {
      back:'<circle cx="9" cy="83" r="4.6" fill="' + c + '" opacity=".26"/>' +
           '<circle cx="20" cy="79" r="4.6" fill="' + c + '" opacity=".34"/>' +
           '<circle cx="31" cy="76" r="4.6" fill="' + c + '" opacity=".42"/>',
      arms: arm(c, 'M72 63 Q81 60 83 53'),
      front:'<g transform="rotate(-13 84 49)"><rect x="74" y="42" width="20" height="14" rx="2.8" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.5"/>' +
            '<path d="M84 43 L84 55" stroke="' + INK + '" stroke-width="1.2" stroke-dasharray="2 2.4"/></g>'
    };
  },
  /* 조용한 정석파 — 혼자 늘 먹던 한 그릇 */
  'proven-quiet': function(c){
    return {
      arms: arm(c, 'M27 64 Q21 69 21 73'),
      front:'<path d="M16 66 q3.6 -4.2 0 -8" fill="none" stroke="' + c + '" stroke-width="2" opacity=".55" stroke-linecap="round"/>' +
            '<path d="M30 65 q3.6 -4.2 0 -8" fill="none" stroke="' + c + '" stroke-width="2" opacity=".45" stroke-linecap="round"/>' +
            '<ellipse cx="23" cy="71" rx="16" ry="3.1" fill="#E4E6E8" stroke="' + INK + '" stroke-width="1.4"/>' +
            '<path d="M7 71 L39 71 Q35 87 23 87 Q11 87 7 71 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>'
    };
  },
  /* 든든한 푸드메이트 — 다같이 둘러앉은 한 냄비 */
  'proven-either': function(c){
    return {
      arms: arm(c, 'M28 65 Q24 70 27 74') + arm(c, 'M72 65 Q76 70 73 74'),
      front:'<path d="M2 60 L26 73" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<path d="M2 66 L26 77" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<path d="M98 60 L74 73" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<path d="M98 66 L74 77" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<path d="M18 80 q-6 3 0 7" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<path d="M82 80 q6 3 0 7" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
            '<ellipse cx="50" cy="75" rx="30" ry="4.2" fill="#E4E6E8" stroke="' + INK + '" stroke-width="1.5"/>' +
            '<path d="M20 75 L80 75 Q76 96 50 96 Q24 96 20 75 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>'
    };
  },
  /* 안전한 핫플러 — 후기 1위, 검증된 것만 */
  'proven-trendy': function(c){
    return {
      arms: arm(c, 'M72 62 Q82 54 82 46'),
      front:'<g transform="translate(82,38)"><path d="' + STAR_PATH + '" fill="' + GOLD + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/></g>' +
            '<circle cx="19" cy="79" r="11" fill="' + c + '"/>' +
            '<path d="M13.5 79 L17.5 83.5 L25 74" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    };
  }
};

export function character(explore, vibe, size){
  var c = AXIS_COLOR[explore];
  var po = POSE[explore + '-' + vibe](c);
  var inner =
    (po.arms || '') +
    '<ellipse cx="50" cy="62" rx="27" ry="25" fill="' + c + '"/>' +
    '<ellipse cx="50" cy="68" rx="17" ry="14" fill="#FFFFFF" opacity=".15"/>' +
    hatFor(explore, c) +
    '<circle cx="42" cy="58" r="2.8" fill="' + INK + '"/>' +
    '<circle cx="58" cy="58" r="2.8" fill="' + INK + '"/>' +
    '<circle cx="35.5" cy="64" r="3.4" fill="#FFFFFF" opacity=".24"/>' +
    '<circle cx="64.5" cy="64" r="3.4" fill="#FFFFFF" opacity=".24"/>' +
    '<path d="M44.5 66 Q50 71 55.5 66" stroke="' + INK + '" stroke-width="2.3" fill="none" stroke-linecap="round"/>';
  var bodyGroup = po.tilt ? '<g transform="rotate(' + po.tilt + ' 50 62)">' + inner + '</g>' : inner;
  return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">' +
    (po.back || '') + bodyGroup + (po.front || '') + '</svg>';
}
