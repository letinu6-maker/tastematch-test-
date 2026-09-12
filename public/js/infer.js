/* 비짓서울 API 응답 → 앱이 쓰는 장소 객체로 변환 (매운맛·알레르기 추정 포함) */

import { ALLERGEN_RULES, SPICE_RULES } from './data.js';
import { t } from './i18n.js';

function textOfInfo(info){
  var r = info.restaurant || {};
  var tags = (info.tag || []).join(' ');
  return [info.post_sj || '', info.sumry || '', r.fd_reprsnt_menu || '',
          tags, info.cate_depth || ''].join(' ');
}
function inferSpice(txt){
  for(var i=0;i<SPICE_RULES.length;i++){ if(SPICE_RULES[i].re.test(txt)) return SPICE_RULES[i].v; }
  return 3;
}
function inferAllergens(txt){
  var out = [];
  ALLERGEN_RULES.forEach(function(r){ if(r.re.test(txt)) out.push(r.key); });
  return out;
}
function inferVibe(txt){
  if(/오래가게|노포|골목|3대|원조|백반|전통|old\s*shop|alley|traditional|since\s*19/i.test(txt)) return 'local';
  if(/핫플|인스타|루프탑|브런치|팝업|디저트|카페|신상|트렌드|rooftop|brunch|pop-?up|dessert|cafe|trendy/i.test(txt)) return 'trendy';
  return 'mixed';
}
function inferNovelty(txt){
  if(/사찰|보양|전통주|한정식|육회|산낙지|과메기|홍어|곱창|막창|선지|순대|추어|보리굴비|temple|raw\s*beef|intestine|skate|offal/i.test(txt)) return 'exotic';
  if(/치킨|카페|빵|피자|파스타|햄버거|김밥|비빔밥|불고기|만두|커피|chicken|cafe|bread|pizza|pasta|burger|gimbap|bibimbap|bulgogi|dumpling|coffee/i.test(txt)) return 'familiar';
  return 'mid';
}
function cuisineKind(info, txt){
  var r = info.restaurant || {};
  var kinds = (r.kind || []).map(function(k){ return k.code_nm || ''; }).join(' ');
  var all = kinds + ' ' + (info.cate_depth || '');
  if(/중식|chinese/i.test(all)) return '중식';
  if(/일식|japanese|sushi/i.test(all)) return '일식';
  if(/양식|서양|이탈|프렌치|western|italian|french/i.test(all)) return '양식';
  if(/카페|디저트|베이커리|cafe|dessert|bakery|coffee/i.test(all) ||
     /카페|커피|베이커리|디저트|cafe|coffee|bakery|dessert/i.test(txt)) return '카페';
  if(/분식|snack|street\s*food/i.test(all) || /떡볶이|김밥|분식|tteokbokki|gimbap/i.test(txt)) return '분식';
  if(/한식|korean/i.test(all)) return '한식';
  return '기타';
}
function guFromAddress(addr){
  var m = /(\S+구)\s/.exec(addr || '');
  return m ? m[1] : t('서울');
}

/* 비짓서울 contents/info 응답 → 앱 내부 장소 객체 */
export function placeFromInfo(info){
  if(!info) return null;
  var tr = info.traffic || {};
  var lat = parseFloat(tr.map_position_y), lng = parseFloat(tr.map_position_x);
  if(!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
  var r = info.restaurant || {};
  var txt = textOfInfo(info);
  var addr = tr.new_adres || tr.adres || '';
  var dietary = (r.dietary || []).map(function(d){ return d.code_nm || String(d); });
  var halalCodes = [].concat(r.halal || [], r.muslim || [], r.salam || [])
                     .map(function(d){ return d.code_nm || String(d); });
  var halal = halalCodes.length > 0 || /할랄|halal|무슬림/i.test(txt);
  var veganOk = [];
  if(dietary.length || /채식|비건|사찰음식|베지테리언|vegan/i.test(txt)){
    veganOk = ['vegan', 'lacto', 'ovo', 'pesco'];
  }
  var kind = cuisineKind(info, txt);
  return {
    id: info.cid,
    cid: info.cid,
    name: info.post_sj || t('이름 없음'),
    place: (tr.subway_info || addr || t('서울')).split(',')[0],
    gu: guFromAddress(addr),
    addr: addr,
    kind: kind,
    cat: (info.cate_depth || (' 음식 > ' + kind)).replace(/^\s*/, '').replace(/>/g, '·'),
    spice: inferSpice(txt),
    vibe: inferVibe(txt),
    novelty: inferNovelty(txt),
    allergens: inferAllergens(txt),
    veganOk: veganOk,
    dietaryLabels: dietary,
    halal: halal,
    halalLabels: halalCodes,
    blurb: info.sumry || t('비짓서울 API에 등록된 장소입니다.'),
    tip: r.fd_reprsnt_menu || '',
    tel: (info.extra && info.extra.cmmn_telno) || '',
    hours: (info.extra && info.extra.cmmn_use_time) || '',
    closed: (info.extra && info.extra.closed_days) || '',
    img: info.main_img || '',
    subway: tr.subway_info || '',
    tags: info.tag || [],
    lat: lat, lng: lng
  };
}
