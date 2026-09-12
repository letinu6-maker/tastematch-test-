/* 서울 미식 여권 — 화면 4개
   표지(cover) → 오늘 도장 찍을 곳(today) → 도장 찍힘(stamped) → 여권(book) */

import { esc, fmtDist, walkMin, distKm } from './util.js';
import { PERSONAS } from './data.js';
import { state } from './state.js';
import { t, tpl, langSwitchHtml } from './i18n.js';
import { natLabel, activeCombo, activePersonaProfile } from './profile.js';
import { character } from './character.js';
import { recommend, topReasons } from './score.js';
import { readStamps, hasStamp, titleOf, stampSvg, stampDate, passportNo,
         STAMP_GOAL, CHECKIN_M } from './stamps.js';
import { poolStillLoading } from './screens.js';

/* ---- 공통 조각 ---- */

export function pnav(active){
  var items = [
    { key:'cover', label:'여권' },
    { key:'today', label:'오늘의 도장' },
    { key:'book',  label:'스탬프' }
  ];
  return '<div class="tabs pnav">' + items.map(function(it){
    return '<button class="tab ' + (active === it.key ? 'on' : '') + '" data-action="pgo" data-key="' + it.key + '">' +
      '<span>' + esc(t(it.label)) + '</span></button>';
  }).join('') + '</div>';
}

/* 칭호를 얻은 이유 한 줄 */
function titleWhy(title){
  if(!title) return '';
  if(title.key === 'spice') return t('매운맛 7 이상인 곳을 세 번 이상');
  if(title.key === 'gu')    return t('서로 다른 자치구 네 곳 이상');
  return tpl('titleKind', { kind: t(title.kind), n: title.n });
}

function progressBar(n){
  var pct = Math.min(100, Math.round(n / STAMP_GOAL * 100));
  return '<div class="pbar"><i style="width:' + pct + '%"></i></div>';
}

/* 오늘 도장을 찍을 한 곳 — 점수가 가장 높고 아직 안 찍은 곳.
   "다른 곳" 버튼을 누른 횟수(state.todaySkip)만큼 다음 후보로 넘어간다. */
export function todayPick(){
  var p = activePersonaProfile();
  var rec = recommend(p);
  var left = rec.list.filter(function(e){ return !hasStamp(e.menu.cid); });
  if(!left.length) return { entry:null, rec:rec, remaining:0, profile:p };
  var i = (state.todaySkip || 0) % left.length;
  return { entry:left[i], rec:rec, remaining:left.length, profile:p };
}

export function checkinState(entry){
  if(!entry) return { ok:false, km:null, live:false };
  var o = state.origin;
  var km = distKm(o.lat, o.lng, entry.menu.lat, entry.menu.lng);
  return { ok: o.live && km * 1000 <= CHECKIN_M, km: km, live: !!o.live };
}

/* ---- 1. 표지 ---- */

export function screenCover(){
  var p = activePersonaProfile();
  var per = PERSONAS[activeCombo()];
  var parts = activeCombo().split('-');
  var list = readStamps();
  var title = titleOf(list);
  var issued = list.length ? stampDate(list[0].at) : stampDate(Date.now());

  return '<div class="screen pcover">' +
    '<div class="scroll">' +
      '<div class="langrow">' + langSwitchHtml() + '</div>' +
      '<div class="book">' +
        '<div class="book-top">' +
          '<span class="crest">✦</span>' +
          '<b>' + t('서울 미식 여권') + '</b>' +
          '<span class="sub">SEOUL TASTE PASSPORT</span>' +
        '</div>' +

        '<div class="book-photo">' +
          '<div class="photo">' + character(parts[0], parts[1], 108) + '</div>' +
          '<div class="book-id">' +
            '<div class="f"><span>' + t('유형 / TYPE') + '</span><b>' + esc(t(per.title)) + '</b></div>' +
            '<div class="f"><span>' + t('국적 / NATIONALITY') + '</span><b>' + esc(natLabel(p)) + '</b></div>' +
            '<div class="f"><span>' + t('매운맛 / SPICE') + '</span><b class="num">' + (p.spice === null ? '-' : p.spice) + ' / 10</b></div>' +
            '<div class="f"><span>' + t('발급 / ISSUED') + '</span><b class="num">' + issued + '</b></div>' +
          '</div>' +
        '</div>' +

        '<div class="book-title">' +
          (title
            ? '<b>' + esc(t(title.label)) + '</b><span>' + esc(titleWhy(title)) + '</span>'
            : '<b>' + esc(tpl('stampsToTitle', { n: Math.max(0, 3 - list.length) })) + '</b>' +
              '<span>' + t('도장 3개부터 칭호가 생겨요') + '</span>') +
        '</div>' +

        progressBar(list.length) +
        '<div class="book-count"><b class="num">' + list.length + '</b> / ' + STAMP_GOAL + ' ' + t('도장') + '</div>' +

        '<div class="mrz">P&lt;KOR' + esc((natLabel(p) || '').toUpperCase().replace(/[^A-Z]/g, '') || 'TRAVELLER') +
          '&lt;&lt;' + passportNo() + '&lt;&lt;&lt;&lt;&lt;&lt;</div>' +
      '</div>' +

      '<div class="pad" style="padding-top:18px">' +
        '<button class="cta" data-action="pgo" data-key="today">' +
          t('오늘의 도장 찍으러 가기') + '</button>' +
        '<button class="cta ghost" style="margin-top:9px" data-action="pgo" data-key="book">' +
          t('여권 펼쳐보기') + '</button>' +
        '<button class="cta ghost" style="margin-top:9px" data-action="start">' +
          t('취향 다시 진단하기') + '</button>' +
        t('<a class="cta ghost passport-link" style="margin-top:9px" href="index.html">주변 맛집 목록으로</a>') +
        '<p class="fine" style="margin-top:16px">' +
          t('도장을 찍은 곳은 모두 비짓서울 API에 등록된 실제 장소이고, 위치 확인은 API가 준 실제 좌표를 씁니다.') + '</p>' +
      '</div>' +
    '</div>' + pnav('cover') + '</div>';
}

/* ---- 2. 오늘 도장 찍을 곳 (한 곳만) ---- */

export function screenToday(){
  var pick = todayPick();
  var p = pick.profile;

  if(!pick.entry){
    var waiting = poolStillLoading();
    return '<div class="screen">' +
      '<div class="scroll"><div class="pad">' +
        '<h2 class="display" style="font-size:21px;margin:0 0 10px">' + t('오늘의 도장') + '</h2>' +
        '<div class="empty-state">' +
          (waiting
            ? '<b>' + t('주변 식당을 찾고 있어요') + '</b><br>' +
              esc(tpl('loadProgress', { done:state.pool.done, total:state.pool.total }))
            : '<b>' + esc(tpl('emptyRadius', { r: state.radiusKm + 'km' })) + '</b><br>' +
              t('반경을 넓히거나 거점을 바꿔보세요.')) +
        '</div>' +
        '<button class="cta ghost" style="margin-top:12px" data-action="pradius" data-key="5">' +
          t('반경 5km로 넓히기') + '</button>' +
      '</div></div>' + pnav('today') + '</div>';
  }

  var e = pick.entry, m = e.menu;
  var chk = checkinState(e);
  var reasons = topReasons(e, p, 2);

  var gate = chk.ok
    ? '<div class="gate ok"><b>' + t('도장을 찍을 수 있어요') + '</b><span>' +
        esc(tpl('withinM', { m: Math.round(chk.km * 1000) })) + '</span></div>'
    : '<div class="gate"><b>' + esc(tpl('needCloser', { m: CHECKIN_M })) + '</b><span>' +
        (chk.live ? esc(tpl('nowAway', { dist: fmtDist(chk.km) }))
                  : t('현재 위치를 켜면 실제로 도장을 찍을 수 있어요')) + '</span></div>';

  return '<div class="screen">' +
    '<div class="scroll">' +
      '<div class="today-head">' +
        '<span class="eyebrow">' + t('오늘의 한 곳') + '</span>' +
        '<h2 class="display">' + esc(m.name) + '</h2>' +
        '<p class="muted">' + esc(m.place) + ' · ' + esc(m.gu) + ' · ' + esc(t(m.kind)) + '</p>' +
      '</div>' +

      '<div class="mapwrap"><div id="kmap-one" style="width:100%;height:230px"></div></div>' +

      '<div class="pad">' +
        '<div class="today-facts">' +
          '<div><span>' + t('거리') + '</span><b class="num">' + fmtDist(e.km) + '</b></div>' +
          '<div><span>' + t('도보') + '</span><b class="num">' + walkMin(e.km) + t('분') + '</b></div>' +
          '<div><span>' + t('매치') + '</span><b class="num">' + e.total + '</b></div>' +
        '</div>' +

        (m.tip ? '<div class="tipbox" style="margin-top:14px"><b>' + t('대표 메뉴') + '</b> · ' + esc(m.tip) + '</div>' : '') +

        '<div class="sect" style="padding:18px 0 6px;border:none">' +
          '<h3 class="sect-title">' + t('왜 여기냐면') + '</h3>' +
          reasons.map(function(r){
            return '<div class="why"><span class="b">→</span><span>' + esc(r) + '</span></div>';
          }).join('') +
        '</div>' +

        gate +

        '<button class="cta stampbtn" data-action="stamp" data-key="' + esc(m.cid) + '"' +
          (chk.ok ? '' : ' disabled') + '>' + t('여기에 도장 찍기') + '</button>' +
        '<button class="cta ghost" style="margin-top:9px" data-action="stamp-demo" data-key="' + esc(m.cid) + '">' +
          t('데모로 찍어보기 (심사용)') + '</button>' +
        '<button class="cta ghost" style="margin-top:9px" data-action="skip">' +
          esc(tpl('otherPlace', { n: pick.remaining })) + '</button>' +
        '<button class="cta ghost" style="margin-top:9px" data-action="geo">' + t('현재 위치 켜기') + '</button>' +
        (state.geoMsg ? '<p class="fine" style="margin-top:10px">' + esc(state.geoMsg) + '</p>' : '') +
      '</div>' +
    '</div>' + pnav('today') + '</div>';
}

/* ---- 3. 도장이 찍히는 순간 ---- */

export function screenStamped(){
  var list = readStamps();
  var st = list.filter(function(s){ return s.cid === state.lastStamp; })[0] || list[list.length - 1];
  if(!st) return screenCover();
  var title = titleOf(list);

  return '<div class="screen stamped">' +
    '<div class="scroll"><div class="pad" style="text-align:center">' +
      '<div class="stamp-drop">' + stampSvg(st, 168) + '</div>' +
      '<h2 class="display" style="font-size:23px;margin:18px 0 6px">' + t('도장을 찍었어요') + '</h2>' +
      '<p class="muted" style="margin:0 0 2px">' + esc(st.name) + '</p>' +
      (st.demo ? '<p class="fine" style="margin:6px 0 0">' + t('데모로 찍은 도장입니다') + '</p>' : '') +

      '<div class="done-card">' +
        '<div class="kv"><span class="k">' + t('메뉴') + '</span><span class="v">' + esc(st.menu || '-') + '</span></div>' +
        '<div class="kv"><span class="k">' + t('종류') + '</span><span class="v">' + esc(t(st.kind)) + '</span></div>' +
        '<div class="kv"><span class="k">' + t('지역') + '</span><span class="v">' + esc(st.gu) + '</span></div>' +
        '<div class="kv"><span class="k">' + t('날짜') + '</span><span class="v num">' + stampDate(st.at) + '</span></div>' +
      '</div>' +

      progressBar(list.length) +
      '<div class="book-count" style="margin-bottom:16px"><b class="num">' + list.length + '</b> / ' + STAMP_GOAL + ' ' + t('도장') + '</div>' +

      (title ? '<div class="title-win"><span>' + t('칭호 획득') + '</span><b>' + esc(t(title.label)) + '</b></div>' : '') +

      '<button class="cta" data-action="pgo" data-key="book">' + t('여권에서 보기') + '</button>' +
      '<button class="cta ghost" style="margin-top:9px" data-action="pgo" data-key="today">' + t('다음 도장 찍으러 가기') + '</button>' +
    '</div></div>' + pnav('today') + '</div>';
}

/* ---- 4. 여권 펼치기 ---- */

export function screenBook(){
  var list = readStamps();
  var title = titleOf(list);
  var p = activePersonaProfile();

  var cells = '';
  var total = Math.max(STAMP_GOAL, list.length);
  for(var i = 0; i < total; i++){
    cells += list[i]
      ? '<div class="cell filled">' + stampSvg(list[i], 104) +
          '<span class="nm">' + esc(list[i].name) + '</span></div>'
      : '<div class="cell"><span class="slot">' + (i + 1) + '</span></div>';
  }

  return '<div class="screen">' +
    '<div class="scroll">' +
      '<div class="page-head">' +
        '<span class="eyebrow">' + t('서울 미식 여권') + '</span>' +
        '<h2 class="display">' + esc(natLabel(p)) + t(' 여행자의 기록') + '</h2>' +
        (title ? '<div class="title-chip">' + esc(t(title.label)) + '</div>' : '') +
      '</div>' +

      '<div class="pad" style="padding-top:4px">' +
        progressBar(list.length) +
        '<div class="book-count" style="margin-bottom:14px"><b class="num">' + list.length + '</b> / ' + STAMP_GOAL + ' ' + t('도장') + '</div>' +
        '<div class="stamp-grid">' + cells + '</div>' +

        (list.length
          ? '<button class="cta" style="margin-top:18px" data-action="download">' + t('여권 이미지로 저장하기') + '</button>'
          : '<div class="empty-state" style="margin-top:16px">' + t('아직 도장이 없어요. 오늘의 한 곳부터 시작해보세요.') + '</div>') +
        '<button class="cta ghost" style="margin-top:9px" data-action="pgo" data-key="today">' + t('오늘의 도장 찍으러 가기') + '</button>' +
        (list.length ? '<button class="cta ghost" style="margin-top:9px" data-action="clear-stamps">' + t('도장 전부 지우기') + '</button>' : '') +
        '<p class="fine" style="margin-top:16px">' + t('도장은 이 브라우저에만 저장됩니다. 실제 서비스에서는 방문 기록이 추천 엔진의 학습 데이터가 됩니다.') + '</p>' +
      '</div>' +
    '</div>' + pnav('book') + '</div>';
}
