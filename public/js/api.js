/* 비짓서울 API 호출과 장소 풀 수집 (서버 풀 우선, 막히면 브라우저가 직접) */

import { requestRender } from './render-hook.js';
import { state } from './state.js';
import { apiLang, t } from './i18n.js';
import { placeFromInfo } from './infer.js';

export var PLACES = [];   /* 비짓서울 API 콘텐츠에서 변환된 실제 장소 목록 */
var POOL_CACHE_KEY = 'tastematch.pool.v4';
/* ---- 비짓서울 API에서 실제 장소 풀을 채워 넣기 ---- */
function readPoolCache(){
  try{
    var raw = localStorage.getItem(POOL_CACHE_KEY + '.' + state.lang);
    if(!raw) return null;
    var o = JSON.parse(raw);
    if(!o || !o.at || !o.places || !o.places.length) return null;
    if(Date.now() - o.at > 1000 * 60 * 60 * 12) return null;   /* 12시간 캐시 */
    return o.places;
  }catch(e){ return null; }
}
export function writePoolCache(places){
  try{ localStorage.setItem(POOL_CACHE_KEY + '.' + state.lang, JSON.stringify({ at:Date.now(), places:places })); }catch(e){}
}


/* 모든 호출에 타임아웃을 건다.
   응답 없는 요청 하나가 동시 실행 슬롯을 영원히 붙잡으면
   수집 파이프라인 전체가 그대로 멈춰 버린다. */
function fetchJson(url, timeoutMs){
  var ms = timeoutMs || 12000;
  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = setTimeout(function(){ if(ctrl) ctrl.abort(); }, ms);
  var opts = ctrl ? { signal: ctrl.signal } : {};
  return fetch(url, opts)
    .then(function(r){ return r.json(); })
    .catch(function(){ return null; })
    .then(function(v){ clearTimeout(timer); return v; });
}

var POOL_TARGET = 260;         /* 모을 장소 수 상한 */
var DETAIL_CONCURRENCY = 4;    /* 상세 조회 동시 실행 수 */

/* 카테고리 트리에서 음식 관련 코드만 골라낸다(응답이 영문일 수도 있다) */
function foodCategoryCodes(catJson){
  var out = [], seen = {};
  function walk(node){
    if(!node || typeof node !== 'object') return;
    if(Object.prototype.toString.call(node) === '[object Array]'){
      for(var i=0;i<node.length;i++) walk(node[i]);
      return;
    }
    var code = node.com_ctgry_sn;
    if(code && !seen[code]){
      var label = [node.cate_depth, node.ctgry_nm, node.ctgry_name, node.name].join(' ');
      if(/음식|맛집|식당|카페|주점|cuisine|restaurant|food|cafe|tea\s*shop|dining/i.test(label)
         && !/club|나이트|클럽/i.test(label)){
        seen[code] = 1; out.push(code);
      }
    }
    for(var k in node){ if(Object.prototype.hasOwnProperty.call(node, k)) walk(node[k]); }
  }
  walk(catJson);
  return out;
}

/* 장소 풀 채우기
   1순위 — 서버가 미리 모아 둔 /api/places (요청 한 번이면 끝)
   2순위 — 서버 풀이 없거나 진척이 없으면 브라우저가 직접 모은다
            (카테고리 → 콘텐츠 목록 → 콘텐츠 상세, 전부 타임아웃·동시 실행 제한) */
export function loadRealPlaces(force){
  if(state.pool.status === 'loading') return;
  if(state.pool.status === 'ready' && !force) return;

  if(!force){
    var cached = readPoolCache();
    if(cached && cached.length){
      PLACES = cached;
      state.pool.status = 'ready';
      state.pool.total = cached.length;
      state.pool.done = cached.length;
      state.pool.fromCache = true;
      return;
    }
  }

  state.pool.status = 'loading';
  state.pool.done = 0;
  state.pool.total = 0;
  state.pool.error = '';
  state.pool.filling = false;
  PLACES = [];

  var stopped = false;
  var serverTries = 0;
  var serverStalled = 0;
  var collecting = false;

  function maybeRender(){
    if(state.screen === 'places' || state.screen === 'result' || state.screen === 'menu'){
      state.keepScroll = true; requestRender();
    }
  }

  function finish(list, message){
    if(stopped) return;
    stopped = true;
    PLACES = list || [];
    state.pool.filling = false;
    state.pool.status = PLACES.length ? 'ready' : 'error';
    if(!PLACES.length) state.pool.error = message || t('좌표가 있는 음식 콘텐츠를 찾지 못했어요.');
    if(PLACES.length) writePoolCache(PLACES);
    maybeRender();
  }

  /* ---- 1순위: 서버 풀 ---- */
  function pollServer(){
    if(stopped) return;
    serverTries++;
    fetchJson('/api/places?lang=' + apiLang(), 15000).then(function(d){
      if(stopped) return;
      if(!d || !d.ok){ collectHere(); return; }

      var next = [];
      (d.places || []).forEach(function(info){
        var place = placeFromInfo(info);
        if(place) next.push(place);
      });

      if(next.length){
        PLACES = next;
        state.pool.done = d.done || next.length;
        state.pool.total = d.total || next.length;
      }

      if(d.status === 'building'){
        if(!next.length && !d.total && !d.done){
          /* 서버 수집이 한 발짝도 못 나가고 있다 → 브라우저가 직접 모은다 */
          serverStalled++;
          if(serverStalled >= 3){ collectHere(); return; }
        }else{
          serverStalled = 0;
          state.pool.status = next.length ? 'ready' : 'loading';
          state.pool.filling = true;
          maybeRender();
        }
        /* 처음 몇 번은 짧게 물어봐서, 서버가 멈춰 있을 때 빨리 넘어간다 */
        if(serverTries < 40){ setTimeout(pollServer, serverTries < 4 ? 1200 : 2500); return; }
        collectHere();
        return;
      }

      if(!next.length){ collectHere(); return; }
      finish(next, d.message);
    });
  }

  /* ---- 2순위: 브라우저가 직접 수집 ---- */
  function collectHere(){
    if(stopped || collecting) return;
    collecting = true;
    state.pool.filling = true;
    state.pool.done = 0;
    state.pool.total = 0;
    maybeRender();

    var lang = apiLang();

    fetchJson('/api/category', 12000).then(function(d){
      if(stopped) return null;
      var codes = ['Cz9d1h6'];
      foodCategoryCodes(d && d.data).forEach(function(c){
        if(codes.indexOf(c) < 0) codes.push(c);
      });
      return listPages(codes.slice(0, 8), lang);
    }).then(function(cids){
      if(stopped || !cids) return null;
      if(!cids.length){
        finish([], t('비짓서울 API에서 음식 콘텐츠를 찾지 못했어요.'));
        return null;
      }
      return details(cids.slice(0, POOL_TARGET), lang);
    });
  }

  function listPages(codes, lang){
    var cids = [], seen = {};
    var ci = 0, page = 1;
    function step(){
      if(stopped || ci >= codes.length || cids.length >= POOL_TARGET){
        return Promise.resolve(cids);
      }
      var url = '/api/contents?com_ctgry_sn=' + encodeURIComponent(codes[ci])
              + '&lang_code_id=' + encodeURIComponent(lang)
              + '&page_no=' + page;
      return fetchJson(url, 12000).then(function(d){
        var items = (d && d.data) || [];
        var i, it;
        if(items && items.length){
          for(i = 0; i < items.length; i++){
            it = items[i];
            if(it && it.cid && !seen[it.cid]){ seen[it.cid] = 1; cids.push(it.cid); }
          }
        }
        state.pool.total = Math.min(cids.length, POOL_TARGET);
        maybeRender();
        if(!items || !items.length || page >= 3){ ci++; page = 1; }
        else page++;
        return step();
      });
    }
    return step();
  }

  function details(cids, lang){
    var out = [], cursor = 0;
    state.pool.total = cids.length;
    state.pool.done = 0;

    function worker(){
      if(stopped || cursor >= cids.length) return Promise.resolve();
      var cid = cids[cursor++];
      var url = '/api/contents/' + encodeURIComponent(cid)
              + '?lang_code_id=' + encodeURIComponent(lang);
      return fetchJson(url, 10000).then(function(d){
        var place = placeFromInfo(d && d.data);
        if(place) out.push(place);
        state.pool.done++;
        if(out.length && (out.length <= 12 || state.pool.done % 15 === 0)){
          PLACES = out.slice();
          state.pool.status = 'ready';
          maybeRender();
        }
        return worker();
      });
    }

    var jobs = [], i;
    for(i = 0; i < DETAIL_CONCURRENCY; i++) jobs.push(worker());
    return Promise.all(jobs).then(function(){
      finish(out, t('좌표가 있는 음식 콘텐츠를 찾지 못했어요.'));
    });
  }

  pollServer();
}

/* 언어를 바꿀 때 풀을 비운다 (다른 모듈에서는 PLACES에 직접 대입할 수 없다) */
export function resetPlaces(){ PLACES = []; }
