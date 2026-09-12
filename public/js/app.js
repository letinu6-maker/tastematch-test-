/* 진입점 — 화면 렌더링, 이벤트 처리, 언어 전환, 시작 */

import { setRenderer } from './render-hook.js';
import { makeOnboarding } from './onboarding.js';
import { requestGeo } from './geo.js';
import { state } from './state.js';
import { apiLang, t } from './i18n.js';
import { placeFromInfo } from './infer.js';
import { PLACES, loadRealPlaces, resetPlaces, writePoolCache } from './api.js';
import { ORIGINS } from './score.js';
import { renderMaps } from './map.js';
import { screenAnalyzing, screenGuide, screenIntro, screenMenu, screenOnboarding, screenPlaces, screenProfile, screenResult, screenType } from './screens.js';

function setLang(next){
  if(state.lang === next) return;
  state.lang = next;
  try{ localStorage.setItem('tastematch.lang', next); }catch(e){}
  resetPlaces();
  state.pool = { status:'idle', done:0, total:0, error:'', fromCache:false, filling:false };
  state.rawCache = {};
  loadRealPlaces();
  render();
}
/* ============================================================
   렌더 & 이벤트
   ============================================================ */

var root = document.getElementById('app');

function render(){
  var html;
  switch(state.screen){
    case 'intro': html = screenIntro(); break;
    case 'onboarding': html = screenOnboarding(); break;
    case 'analyzing': html = screenAnalyzing(); break;
    case 'result': html = screenResult(); break;
    case 'places': html = screenPlaces(); break;
    case 'menu': html = screenMenu(); break;
    case 'guide': html = screenGuide(); break;
    case 'type': html = screenType(); break;
    case 'profile': html = screenProfile(); break;
    default: html = screenIntro();
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
  if(state.scrollToSel && state.selectedId){
    var card = document.getElementById('card-' + state.selectedId);
    if(card) card.scrollIntoView({ block:'center', behavior:'smooth' });
  }
  state.scrollToSel = false;
  renderMaps();
}

/* 온보딩 7문항은 여권 화면(passport.js)과 공유한다 */
var onboarding = makeOnboarding({ render: render, done: 'result', home: 'intro', editBack: 'profile' });

root.addEventListener('click', function(ev){
  var btn = ev.target.closest('[data-action]');
  if(!btn) return;
  var a = btn.getAttribute('data-action');
  var key = btn.getAttribute('data-key');

  if(onboarding.handle(a, key, btn)) return;

  switch(a){
    case 'go':
      if(key === 'result' || key === 'places' || key === 'guide' || key === 'profile'){
        state.screen = key; render();
      }
      break;
    case 'toggle-off':
      state.showOff = !state.showOff; state.keepScroll = true; render(); break;
    case 'toggle-loc':
      state.showLoc = !state.showLoc; state.keepScroll = true; render(); break;
    case 'origin':
      var o = ORIGINS.filter(function(x){ return x.key === key; })[0];
      state.origin = { key:o.key, label:o.label, lat:o.lat, lng:o.lng, live:false };
      state.showLoc = false; state.geoMsg = ''; state.selectedId = null;
      state.keepScroll = true; render(); break;
    case 'geo':
      requestGeo(render); break;
    case 'radius':
      state.radiusKm = parseFloat(key); state.selectedId = null;
      state.keepScroll = true; render(); break;
    case 'pin':
      state.selectedId = state.selectedId === key ? null : key;
      state.scrollToSel = !!state.selectedId;
      state.keepScroll = true; render(); break;

    case 'menu':
      state.activeMenu = key; state.screen = 'menu'; render(); break;
    case 'type':
      state.openType = key; state.screen = 'type'; render(); break;
    case 'preview':
      state.previewCombo = key; state.screen = 'places'; render(); break;
    case 'clear-preview':
      state.previewCombo = null; render(); break;

    case 'lang':
      setLang(key); break;

    case 'reload-pool':
      state.pool.status = 'idle';
      loadRealPlaces(true);
      state.keepScroll = true; render();
      break;

    case 'reload-raw':
      state.rawCache[key] = { loading:true };
      state.keepScroll = true; render();
      fetch('/api/contents/' + encodeURIComponent(key) + '?lang_code_id=' + apiLang())
        .then(function(r){ return r.json(); })
        .then(function(d){
          var info = d && d.ok && d.data && d.data.data;
          if(info){
            var fresh = placeFromInfo(info);
            if(fresh){
              for(var i=0;i<PLACES.length;i++){ if(PLACES[i].cid === key) PLACES[i] = fresh; }
              writePoolCache(PLACES);
            }
            var now = new Date();
            state.rawCache[key] = { ok:true, name:info.post_sj || key,
              at: now.getHours() + t('시 ') + ('0' + now.getMinutes()).slice(-2) + t('분') };
          } else {
            state.rawCache[key] = { ok:false, message:(d && d.message) || t('응답에 데이터가 없어요') };
          }
          state.keepScroll = true; render();
        })
        .catch(function(err){
          state.rawCache[key] = { ok:false, message:String((err && err.message) || err) };
          state.keepScroll = true; render();
        });
      break;
  }
});

onboarding.attach(root);

try{
  var savedLang = localStorage.getItem('tastematch.lang');
  if(savedLang === 'en' || savedLang === 'ko') state.lang = savedLang;
}catch(e){}
/* api.js·map.js가 "다시 그려" 라고 부를 수 있도록 render를 등록한다 */
setRenderer(render);

loadRealPlaces();
render();
