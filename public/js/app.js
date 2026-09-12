/* 진입점 — 화면 렌더링, 이벤트 처리, 언어 전환, 시작 */

import { setRenderer } from './render-hook.js';
import { STORE_KEY, loadSaved, saveProfile, state } from './state.js';
import { apiLang, t } from './i18n.js';
import { placeFromInfo } from './infer.js';
import { PLACES, loadRealPlaces, resetPlaces, writePoolCache } from './api.js';
import { ORIGINS } from './score.js';
import { renderMaps } from './map.js';
import { ANALYZE_STEP_KEYS, algChipsHTML, natChipsHTML, screenAnalyzing, screenGuide, screenIntro, screenMenu, screenOnboarding, screenPlaces, screenProfile, screenResult, screenType, stepValid } from './screens.js';

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

function toggleIn(arr, key){
  var i = arr.indexOf(key);
  if(i >= 0) arr.splice(i, 1); else arr.push(key);
}

function requestGeo(){
  if(!navigator.geolocation){
    state.geoMsg = t('이 브라우저에서는 위치를 가져올 수 없어요. 아래에서 거점을 골라주세요.');
    state.keepScroll = true; render(); return;
  }
  state.geoMsg = t('위치를 확인하는 중…');
  state.keepScroll = true; render();
  navigator.geolocation.getCurrentPosition(function(pos){
    var la = pos.coords.latitude, ln = pos.coords.longitude;
    var inSeoul = la > 37.41 && la < 37.71 && ln > 126.76 && ln < 127.19;
    state.origin = { key:'live', label:inSeoul ? t('현재 위치') : t('현재 위치 (서울 밖)'), lat:la, lng:ln, live:true };
    state.geoMsg = inSeoul ? '' : t('서울 밖이라 반경 안에 결과가 없을 수 있어요. 거점을 골라 데모로 볼 수 있습니다.');
    state.showLoc = !inSeoul;
    state.selectedId = null;
    state.keepScroll = true; render();
  }, function(){
    state.geoMsg = t('위치 권한이 없어요. 아래에서 거점을 골라주세요.');
    state.keepScroll = true; render();
  }, { timeout:8000, maximumAge:60000 });
}

function startAnalyze(){
  state.screen = 'analyzing';
  state.analyzeStep = 0;
  render();
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gap = reduced ? 180 : 480;
  var i = 1;
  var timer = setInterval(function(){
    state.analyzeStep = i;
    if(state.screen !== 'analyzing'){ clearInterval(timer); return; }
    render();
    i++;
    if(i > ANALYZE_STEP_KEYS.length){
      clearInterval(timer);
      setTimeout(function(){
        if(state.screen !== 'analyzing') return;
        saveProfile();
        state.screen = 'result';
        render();
      }, reduced ? 150 : 420);
    }
  }, gap);
}

root.addEventListener('click', function(ev){
  var btn = ev.target.closest('[data-action]');
  if(!btn) return;
  var a = btn.getAttribute('data-action');
  var key = btn.getAttribute('data-key');
  var p = state.profile;

  switch(a){
    case 'start':
      state.profile = { natKey:null, natCustom:'', explore:null, atmosphere:null, spice:null,
        allergens:[], customAllergens:[], noAllergy:false, vegan:[], veganNone:false, halal:false };
      state.step = 0; state.natQuery = ''; state.algQuery = '';
      state.showNatCustom = false; state.showAlgCustom = false;
      state.screen = 'onboarding'; render(); break;

    case 'resume':
      var saved = loadSaved();
      if(saved){ state.profile = saved; state.screen = 'result'; }
      else state.screen = 'onboarding';
      render(); break;

    case 'nat':
      p.natKey = key; p.natCustom = ''; state.showNatCustom = false;
      state.keepScroll = true; render(); break;
    case 'nat-clear':
      p.natKey = null; p.natCustom = ''; state.keepScroll = true; render(); break;
    case 'nat-custom-toggle':
      state.showNatCustom = !state.showNatCustom;
      state.focusAfter = state.showNatCustom ? 'natCustom' : null;
      state.keepScroll = true; render(); break;
    case 'nat-custom-add':
      var nv = (document.getElementById('natCustom') || {}).value || '';
      nv = nv.trim();
      if(nv){ p.natKey = 'custom'; p.natCustom = nv; state.showNatCustom = false; state.natQuery = ''; }
      state.keepScroll = true; render(); break;

    case 'explore': p.explore = key; state.keepScroll = true; render(); break;
    case 'atmos': p.atmosphere = key; state.keepScroll = true; render(); break;
    case 'spice': p.spice = parseInt(key, 10); state.keepScroll = true; render(); break;

    case 'alg':
      p.noAllergy = false; toggleIn(p.allergens, key); state.keepScroll = true; render(); break;
    case 'alg-none':
      p.noAllergy = !p.noAllergy;
      if(p.noAllergy){ p.allergens = []; p.customAllergens = []; }
      state.keepScroll = true; render(); break;
    case 'alg-custom-toggle':
      state.showAlgCustom = !state.showAlgCustom;
      state.focusAfter = state.showAlgCustom ? 'algCustom' : null;
      state.keepScroll = true; render(); break;
    case 'alg-custom-add':
      var av = (document.getElementById('algCustom') || {}).value || '';
      av = av.trim();
      if(av && p.customAllergens.indexOf(av) < 0){ p.customAllergens.push(av); p.noAllergy = false; }
      state.showAlgCustom = false; state.algQuery = '';
      state.keepScroll = true; render(); break;
    case 'alg-remove':
      p.customAllergens.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
      state.keepScroll = true; render(); break;

    case 'vegan':
      p.veganNone = false; toggleIn(p.vegan, key); state.keepScroll = true; render(); break;
    case 'vegan-none':
      p.veganNone = !p.veganNone;
      if(p.veganNone) p.vegan = [];
      state.keepScroll = true; render(); break;

    case 'halal': p.halal = !p.halal; state.keepScroll = true; render(); break;

    case 'prev':
      if(state.step > 0) state.step--;
      render(); break;
    case 'next':
      if(!stepValid()) return;
      if(state.editing){ state.editing = false; saveProfile(); state.screen = 'profile'; render(); return; }
      if(state.step < 6){ state.step++; render(); }
      else startAnalyze();
      break;
    case 'cancel-edit':
      state.editing = false; state.screen = 'profile'; render(); break;
    case 'edit':
      state.editing = true; state.step = parseInt(key, 10);
      state.screen = 'onboarding'; render(); break;
    case 'reset':
      try{ localStorage.removeItem(STORE_KEY); }catch(e){}
      state.previewCombo = null; state.screen = 'intro'; render(); break;

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
      requestGeo(); break;
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

root.addEventListener('input', function(ev){
  var el = ev.target;
  if(el.id === 'natSearch'){
    state.natQuery = el.value;
    var box = document.getElementById('natChips');
    if(box) box.innerHTML = natChipsHTML();
  } else if(el.id === 'algSearch'){
    state.algQuery = el.value;
    var box2 = document.getElementById('algChips');
    if(box2) box2.innerHTML = algChipsHTML();
  }
});

root.addEventListener('keydown', function(ev){
  if(ev.key !== 'Enter') return;
  if(ev.target.id === 'natCustom'){
    ev.preventDefault();
    var b = root.querySelector('[data-action="nat-custom-add"]');
    if(b) b.click();
  } else if(ev.target.id === 'algCustom'){
    ev.preventDefault();
    var b2 = root.querySelector('[data-action="alg-custom-add"]');
    if(b2) b2.click();
  }
});

try{
  var savedLang = localStorage.getItem('tastematch.lang');
  if(savedLang === 'en' || savedLang === 'ko') state.lang = savedLang;
}catch(e){}
/* api.js·map.js가 "다시 그려" 라고 부를 수 있도록 render를 등록한다 */
setRenderer(render);

loadRealPlaces();
render();
