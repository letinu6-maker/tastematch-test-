/* 지도 — Leaflet + OpenStreetMap, 그리고 원본 데이터 섹션 */

import { requestRender } from './render-hook.js';
import { esc } from './util.js';
import { state } from './state.js';
import { t, tpl } from './i18n.js';
import { activePersonaProfile } from './profile.js';
import { PLACES } from './api.js';
import { recommend } from './score.js';

var MAP_MAX_PINS = 80;  /* 지도에 찍는 최대 개수 */
/* ============================================================
   지도 — Leaflet + OpenStreetMap (API 키·도메인 등록이 필요 없음)
   ============================================================ */

var mapHost = null, mapObj = null, mapLayer = null;

function leafletReady(){ return !!(window.L && L.map); }

function getMapHost(){
  if(!mapHost){
    mapHost = document.createElement('div');
    mapHost.style.width = '100%';
    mapHost.style.height = '100%';
  }
  return mapHost;
}

function ensureMap(container){
  var host = getMapHost();
  if(host.parentNode !== container){
    container.innerHTML = '';
    container.appendChild(host);
  }
  if(!mapObj){
    mapObj = L.map(host, { zoomControl:true, scrollWheelZoom:false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; OpenStreetMap'
    }).addTo(mapObj);
    mapLayer = L.layerGroup().addTo(mapObj);
  }
  mapLayer.clearLayers();
  setTimeout(function(){ if(mapObj) mapObj.invalidateSize(); }, 0);
  return mapObj;
}

function pinIcon(label, color, wide){
  return L.divIcon({
    className:'',
    html:'<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center">' +
      '<div style="background:' + color + ';color:#fff;font:700 11px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;' +
      'padding:5px 8px;border-radius:13px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);white-space:nowrap;' +
      (wide ? 'max-width:150px;overflow:hidden;text-overflow:ellipsis;' : '') + '">' + label + '</div>' +
      '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ' + color + '"></div></div>',
    iconSize:[0,0], iconAnchor:[0,0]
  });
}
function meMarker(lat, lng){
  return L.marker([lat, lng], { icon: L.divIcon({ className:'',
    html:'<div style="transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#FFA300;' +
         'border:3px solid #26225B;box-shadow:0 0 0 4px rgba(255,163,0,.28)"></div>',
    iconSize:[0,0], iconAnchor:[0,0] }) });
}

function drawPlacesMap(){
  var el = document.getElementById('kmap-places');
  if(!el || !leafletReady()) return;
  var map = ensureMap(el);
  var p = activePersonaProfile();
  var rec = recommend(p);
  var o = state.origin;
  meMarker(o.lat, o.lng).addTo(mapLayer);
  L.circle([o.lat, o.lng], { radius:state.radiusKm * 1000, color:'#26225B', weight:1,
    opacity:.45, dashArray:'4 5', fillColor:'#26225B', fillOpacity:.05 }).addTo(mapLayer);
  /* 반경 안의 모든 곳을 지도에 표시한다.
     상위 10곳은 순위 핀으로, 나머지는 작은 점으로 찍어 랭킹은 유지하면서
     "이 동네에 이만큼 있다"는 밀도가 보이게 한다. */
  var pts = [[o.lat, o.lng]];
  var open = function(id){ return function(){ state.activeMenu = id; state.screen = 'menu'; requestRender(); }; };
  rec.list.slice(0, MAP_MAX_PINS).forEach(function(e, i){
    var m = e.menu;
    var sel = m.id === state.selectedId;
    var mk;
    if(i < 10 || sel){
      var col = sel ? '#26225B' : (i < 3 ? '#C8102E' : '#54585A');
      mk = L.marker([m.lat, m.lng], { icon: pinIcon(String(i + 1), col), zIndexOffset: sel ? 1000 : (500 - i) });
    } else {
      mk = L.circleMarker([m.lat, m.lng], {
        radius:5, color:'#FFFFFF', weight:2, fillColor:'#54585A', fillOpacity:.9
      });
      mk.bindTooltip(esc(m.name), { direction:'top', offset:[0, -4] });
    }
    mk.addTo(mapLayer);
    mk.on('click', open(m.id));
    pts.push([m.lat, m.lng]);
  });
  if(pts.length > 1) map.fitBounds(pts, { padding:[30, 30], maxZoom:16 });
  else map.setView([o.lat, o.lng], 15);
}

function drawMenuMap(){
  var m = PLACES.filter(function(x){ return x.id === state.activeMenu; })[0];
  var el = document.getElementById('kmap-menu');
  if(!m || !el || !leafletReady()) return;
  var map = ensureMap(el);
  var o = state.origin;
  meMarker(o.lat, o.lng).addTo(mapLayer);
  L.marker([m.lat, m.lng], { icon: pinIcon('🍽 ' + esc(m.name), '#C8102E', true) }).addTo(mapLayer);
  map.fitBounds([[o.lat, o.lng], [m.lat, m.lng]], { padding:[36, 36], maxZoom:16 });
}

function mapFallback(el){
  if(!document.body.contains(el)) return;
  el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;' +
    'color:var(--ink-3);font-size:12px;text-align:center;padding:0 16px;line-height:1.5">' +
    t('지도를 불러오지 못했어요.<br>잠시 후 다시 열어보세요.') + '</div>';
}
function waitForLeaflet(el, tries){
  if(leafletReady()){ renderMaps(); return; }
  if(tries > 14){ mapFallback(el); return; }
  setTimeout(function(){ waitForLeaflet(el, tries + 1); }, 400);
}
/* 다른 페이지(여권 등)가 자기 화면의 지도 그리는 법을 등록해 둔다 */
var drawers = {};
export function registerMapDrawer(screen, fn){ drawers[screen] = fn; }

export function renderMaps(){
  var el = document.getElementById('kmap-places')
        || document.getElementById('kmap-menu')
        || document.getElementById('kmap-one');
  if(!el) return;
  if(!leafletReady()){ waitForLeaflet(el, 0); return; }
  if(drawers[state.screen]) drawers[state.screen]();
  else if(state.screen === 'places') drawPlacesMap();
  else if(state.screen === 'menu') drawMenuMap();
}

/* 한 곳만 크게 — 여권의 "오늘 도장 찍을 곳" 화면.
   주황 원은 도장이 찍히는 반경이다. */
export function drawOnePlaceMap(place, radiusM){
  var el = document.getElementById('kmap-one');
  if(!place || !el) return;
  if(!leafletReady()){ waitForLeaflet(el, 0); return; }
  var map = ensureMap(el);
  var o = state.origin;
  meMarker(o.lat, o.lng).addTo(mapLayer);
  L.circle([place.lat, place.lng], { radius: radiusM || 300, color:'#FFA300',
    weight:2, fillColor:'#FFA300', fillOpacity:.13 }).addTo(mapLayer);
  L.marker([place.lat, place.lng], { icon: pinIcon('🍽 ' + esc(place.name), '#C8102E', true) }).addTo(mapLayer);
  map.fitBounds([[o.lat, o.lng], [place.lat, place.lng]], { padding:[38, 38], maxZoom:16 });
}

/* 이 장소의 비짓서울 원본 데이터 — 화면에 보이는 값이 어디서 왔는지 그대로 보여줍니다 */
export function rawDataSectionHtml(m){
  function row(k, v){
    if(!v) return '';
    return '<div class="kv"><span class="k">' + esc(k) + '</span><span class="v">' + esc(String(v)) + '</span></div>';
  }
  var rows = '';
  rows += row(t('콘텐츠 ID (cid)'), m.cid);
  rows += row(t('분류'), t(m.cat));
  rows += row(t('주소'), m.addr);
  rows += row(t('가까운 역'), m.subway);
  rows += row(t('전화'), m.tel);
  rows += row(t('영업시간'), (m.hours || '').split(/[\r\n]/)[0]);
  rows += row(t('휴무'), m.closed);
  rows += row(t('대표 메뉴'), m.tip);
  if(m.halalLabels && m.halalLabels.length) rows += row(t('할랄 표기'), m.halalLabels.join(', '));
  if(m.dietaryLabels && m.dietaryLabels.length) rows += row(t('채식 표기'), m.dietaryLabels.join(', '));
  if(m.tags && m.tags.length) rows += row(t('태그'), m.tags.join(', '));

  var live = state.rawCache[m.cid];
  var note = '';
  if(live && live.loading) note = '<p class="muted" style="margin-top:8px">' + t('비짓서울 API를 호출하는 중…') + '</p>';
  else if(live && live.ok) note = '<p class="fine" style="margin-top:8px">' + esc(tpl('reloadedAt', { at:live.at, name:live.name })) + '</p>';
  else if(live) note = '<p class="muted" style="margin-top:8px">⚠️ ' + esc(live.message || t('호출에 실패했어요')) + '</p>';

  return rows +
    '<button class="cta ghost" style="margin-top:10px" data-action="reload-raw" data-key="' + esc(m.cid) + '">' + t('🔄 지금 비짓서울 API에서 다시 불러오기') + '</button>' +
    note +
    '<p class="fine" style="margin-top:8px">' + t('이 화면의 이름·주소·좌표·영업정보는 모두 비짓서울 API 콘텐츠 상세(contents/info) 응답에서 그대로 가져온 값입니다.') + '</p>';
}
