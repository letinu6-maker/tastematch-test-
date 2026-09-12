/* 온보딩 7문항(국적·탐색 성향·분위기·매운맛·알레르기·채식·할랄)은
   기본 화면과 여권 화면이 똑같이 쓴다. 두 곳에 같은 코드를 두지 않으려고 여기 모았다.
   done     — 진단이 끝난 뒤 갈 화면
   home     — 처음부터 다시 하기를 눌렀을 때 갈 화면
   editBack — 한 문항만 수정하고 돌아갈 화면 */

import { state, loadSaved, saveProfile, STORE_KEY } from './state.js';
import { ANALYZE_STEP_KEYS, stepValid, natChipsHTML, algChipsHTML } from './screens.js';

function toggleIn(arr, key){
  var i = arr.indexOf(key);
  if(i >= 0) arr.splice(i, 1); else arr.push(key);
}

export function makeOnboarding(opts){
  var render   = opts.render;
  var done     = opts.done     || 'result';
  var home     = opts.home     || 'intro';
  var editBack = opts.editBack || 'profile';

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
          state.screen = done;
          render();
        }, reduced ? 150 : 420);
      }
    }, gap);
  }

  /* 처리했으면 true, 아니면 false를 돌려줘서 호출한 쪽이 이어서 처리하게 한다 */
  function handle(a, key, btn){
    var p = state.profile;
    switch(a){
      case 'start':
        state.profile = { natKey:null, natCustom:'', explore:null, atmosphere:null, spice:null,
          allergens:[], customAllergens:[], noAllergy:false, vegan:[], veganNone:false, halal:false };
        state.step = 0; state.natQuery = ''; state.algQuery = '';
        state.showNatCustom = false; state.showAlgCustom = false;
        state.screen = 'onboarding'; render(); return true;

      case 'resume':
        var saved = loadSaved();
        if(saved){ state.profile = saved; state.screen = done; }
        else state.screen = 'onboarding';
        render(); return true;

      case 'nat':
        p.natKey = key; p.natCustom = ''; state.showNatCustom = false;
        state.keepScroll = true; render(); return true;
      case 'nat-clear':
        p.natKey = null; p.natCustom = ''; state.keepScroll = true; render(); return true;
      case 'nat-custom-toggle':
        state.showNatCustom = !state.showNatCustom;
        state.focusAfter = state.showNatCustom ? 'natCustom' : null;
        state.keepScroll = true; render(); return true;
      case 'nat-custom-add':
        var nv = (document.getElementById('natCustom') || {}).value || '';
        nv = nv.trim();
        if(nv){ p.natKey = 'custom'; p.natCustom = nv; state.showNatCustom = false; state.natQuery = ''; }
        state.keepScroll = true; render(); return true;

      case 'explore': p.explore = key; state.keepScroll = true; render(); return true;
      case 'atmos':   p.atmosphere = key; state.keepScroll = true; render(); return true;
      case 'spice':   p.spice = parseInt(key, 10); state.keepScroll = true; render(); return true;

      case 'alg':
        p.noAllergy = false; toggleIn(p.allergens, key); state.keepScroll = true; render(); return true;
      case 'alg-none':
        p.noAllergy = !p.noAllergy;
        if(p.noAllergy){ p.allergens = []; p.customAllergens = []; }
        state.keepScroll = true; render(); return true;
      case 'alg-custom-toggle':
        state.showAlgCustom = !state.showAlgCustom;
        state.focusAfter = state.showAlgCustom ? 'algCustom' : null;
        state.keepScroll = true; render(); return true;
      case 'alg-custom-add':
        var av = (document.getElementById('algCustom') || {}).value || '';
        av = av.trim();
        if(av && p.customAllergens.indexOf(av) < 0){ p.customAllergens.push(av); p.noAllergy = false; }
        state.showAlgCustom = false; state.algQuery = '';
        state.keepScroll = true; render(); return true;
      case 'alg-remove':
        p.customAllergens.splice(parseInt(btn.getAttribute('data-idx'), 10), 1);
        state.keepScroll = true; render(); return true;

      case 'vegan':
        p.veganNone = false; toggleIn(p.vegan, key); state.keepScroll = true; render(); return true;
      case 'vegan-none':
        p.veganNone = !p.veganNone;
        if(p.veganNone) p.vegan = [];
        state.keepScroll = true; render(); return true;

      case 'halal': p.halal = !p.halal; state.keepScroll = true; render(); return true;

      case 'prev':
        if(state.step > 0) state.step--;
        render(); return true;
      case 'next':
        if(!stepValid()) return true;
        if(state.editing){ state.editing = false; saveProfile(); state.screen = editBack; render(); return true; }
        if(state.step < 6){ state.step++; render(); }
        else startAnalyze();
        return true;
      case 'cancel-edit':
        state.editing = false; state.screen = editBack; render(); return true;
      case 'edit':
        state.editing = true; state.step = parseInt(key, 10);
        state.screen = 'onboarding'; render(); return true;
      case 'reset':
        try{ localStorage.removeItem(STORE_KEY); }catch(e){}
        state.previewCombo = null; state.screen = home; render(); return true;
    }
    return false;
  }

  /* 검색창 입력과 Enter 키 */
  function attach(root){
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
  }

  return { handle: handle, attach: attach, startAnalyze: startAnalyze };
}
