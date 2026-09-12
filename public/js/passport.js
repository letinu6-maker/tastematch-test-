/* 서울 미식 여권 — 진입점 (passport.html)
   추천 엔진·비짓서울 수집·지도·다국어는 기본 화면과 같은 모듈을 그대로 쓴다. */

import { setRenderer } from './render-hook.js';
import { makeOnboarding } from './onboarding.js';
import { requestGeo } from './geo.js';
import { state, loadSaved } from './state.js';
import { t } from './i18n.js';
import { PLACES, loadRealPlaces, resetPlaces } from './api.js';
import { ORIGINS } from './score.js';
import { renderMaps, registerMapDrawer, drawOnePlaceMap } from './map.js';
import { screenAnalyzing, screenOnboarding } from './screens.js';
import { addStamp, clearStamps, CHECKIN_M } from './stamps.js';
import { screenCover, screenToday, screenStamped, screenBook, todayPick, checkinState } from './passport-screens.js';
import { downloadPassport } from './passport-export.js';

var root = document.getElementById('app');

/* 저장된 프로필이 있으면 바로 여권 표지로, 없으면 온보딩부터 */
state.screen = loadSaved() ? 'cover' : 'onboarding';
if(state.screen === 'onboarding') state.step = 0;
else state.profile = loadSaved();
state.todaySkip = 0;

function render(){
  var html;
  switch(state.screen){
    case 'onboarding': html = screenOnboarding(); break;
    case 'analyzing':  html = screenAnalyzing();  break;
    case 'today':      html = screenToday();      break;
    case 'stamped':    html = screenStamped();    break;
    case 'book':       html = screenBook();       break;
    default:           html = screenCover();
  }
  root.innerHTML = html;
  var sc = root.querySelector('.scroll');
  if(sc && state.keepScroll !== true) sc.scrollTop = 0;
  state.keepScroll = false;
  var focusId = state.focusAfter;
  state.focusAfter = null;
  if(focusId){
    var el = document.getElementById(focusId);
    if(el) el.focus();
  }
  renderMaps();
}

/* "오늘의 도장" 화면에서는 그 한 곳만 지도에 크게 그린다 */
registerMapDrawer('today', function(){
  var pick = todayPick();
  if(pick.entry) drawOnePlaceMap(pick.entry.menu, CHECKIN_M);
});

var onboarding = makeOnboarding({ render: render, done: 'cover', home: 'cover', editBack: 'cover' });

function stamp(cid, demo){
  var place = PLACES.filter(function(x){ return x.cid === cid; })[0];
  if(!place) return;
  addStamp(place, demo);
  state.lastStamp = cid;
  state.todaySkip = 0;
  state.screen = 'stamped';
  render();
}

root.addEventListener('click', function(ev){
  var btn = ev.target.closest('[data-action]');
  if(!btn) return;
  var a = btn.getAttribute('data-action');
  var key = btn.getAttribute('data-key');

  if(onboarding.handle(a, key, btn)) return;

  switch(a){
    case 'pgo':
      if(key === 'today') state.todaySkip = 0;
      state.screen = key;
      render(); break;

    case 'skip':
      state.todaySkip = (state.todaySkip || 0) + 1;
      render(); break;

    case 'stamp': {
      var pick = todayPick();
      if(pick.entry && checkinState(pick.entry).ok) stamp(key, false);
      break;
    }
    case 'stamp-demo':
      stamp(key, true); break;

    case 'clear-stamps':
      clearStamps(); state.lastStamp = null; state.todaySkip = 0;
      render(); break;

    case 'download':
      btn.disabled = true;
      btn.textContent = t('여권을 그리는 중…');
      downloadPassport(function(){ render(); });
      break;

    case 'geo':
      requestGeo(render); break;

    case 'pradius':
      state.radiusKm = parseFloat(key); state.todaySkip = 0;
      render(); break;

    case 'origin': {
      var o = ORIGINS.filter(function(x){ return x.key === key; })[0];
      if(o){
        state.origin = { key:o.key, label:o.label, lat:o.lat, lng:o.lng, live:false };
        state.todaySkip = 0;
      }
      render(); break;
    }

    case 'lang':
      if(state.lang === key) break;
      state.lang = key;
      try{ localStorage.setItem('tastematch.lang', key); }catch(e){}
      resetPlaces();
      state.pool = { status:'idle', done:0, total:0, error:'', fromCache:false, filling:false };
      state.rawCache = {};
      loadRealPlaces();
      render(); break;
  }
});

onboarding.attach(root);

try{
  var savedLang = localStorage.getItem('tastematch.lang');
  if(savedLang === 'en' || savedLang === 'ko') state.lang = savedLang;
}catch(e){}

setRenderer(render);
loadRealPlaces();
render();
