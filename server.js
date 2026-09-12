import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_BASE = process.env.API_BASE || 'https://api-call.visitseoul.net/api/v1';
const API_KEY = process.env.VISITSEOUL_API_KEY;

// 비짓서울 API로 요청을 대신 보내주는 얇은 프록시.
// 브라우저에서 직접 호출하면 API 키가 그대로 노출되기 때문에,
// 서버(이 파일)에서만 키를 붙여서 호출합니다.
async function callVisitSeoul(method, endpoint, { query, body } = {}) {
  if (!API_KEY || API_KEY === '여기에_발급받은_API_키를_입력하세요') {
    const err = new Error(
      'VISITSEOUL_API_KEY가 설정되지 않았습니다. .env 파일에 발급받은 API 키를 입력하세요.'
    );
    err.code = 'NO_API_KEY';
    throw err;
  }

  const url = new URL(API_BASE + endpoint);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json;charset=UTF-8',
      'VISITSEOUL-API-KEY': API_KEY,
      ...(body ? { 'Content-Type': 'application/json;charset=UTF-8' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(
      `비짓서울 API가 오류를 반환했습니다 (HTTP ${res.status}). result_message: ${
        data.result_message || '알 수 없음'
      }`
    );
    err.code = 'UPSTREAM_ERROR';
    err.status = res.status;
    err.upstream = data;
    throw err;
  }

  return data;
}

function handleError(res, err) {
  console.error(err);
  if (err.code === 'NO_API_KEY') {
    return res.status(400).json({ ok: false, message: err.message });
  }
  if (err.code === 'UPSTREAM_ERROR') {
    return res
      .status(err.status || 502)
      .json({ ok: false, message: err.message, upstream: err.upstream });
  }
  return res.status(500).json({ ok: false, message: err.message });
}

// 서버/키 상태 확인
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(API_KEY && API_KEY !== '여기에_발급받은_API_키를_입력하세요'),
  });
});

// 1) 언어 코드 조회
app.get('/api/lang', async (req, res) => {
  try {
    const data = await callVisitSeoul('GET', '/code/lang');
    res.json({ ok: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

// 2) 카테고리 목록 조회
app.get('/api/category', async (req, res) => {
  try {
    const data = await callVisitSeoul('GET', '/category/list');
    res.json({ ok: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

// 3) 콘텐츠 목록 조회 (카테고리/언어/키워드/정렬/페이지)
app.get('/api/contents', async (req, res) => {
  const { com_ctgry_sn, lang_code_id, keyword, sort_type, page_no } = req.query;
  try {
    const data = await callVisitSeoul('POST', '/contents/list', {
      body: {
        ...(com_ctgry_sn ? { com_ctgry_sn } : {}),
        ...(lang_code_id ? { lang_code_id } : {}),
        ...(keyword ? { keyword } : {}),
        ...(sort_type ? { sort_type } : {}),
        ...(page_no ? { page_no } : {}),
      },
    });
    res.json({ ok: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

// 4) 콘텐츠 상세 정보 조회 (cid)
app.get('/api/contents/:cid', async (req, res) => {
  const { lang_code_id } = req.query;
  try {
    const data = await callVisitSeoul('POST', '/contents/info', {
      body: {
        cid: req.params.cid,
        ...(lang_code_id ? { lang_code_id } : {}),
      },
    });
    res.json({ ok: true, data });
  } catch (err) {
    handleError(res, err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ 비짓서울 API 테스트 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(
    API_KEY && API_KEY !== '여기에_발급받은_API_키를_입력하세요'
      ? '   API 키가 감지되었습니다.'
      : '   ⚠️  .env 에 VISITSEOUL_API_KEY가 아직 설정되지 않았습니다.'
  );
});

/* ============================================================
   장소 풀 — 서버가 비짓서울 API에서 한 번만 모아 메모리에 두고,
   브라우저에는 한 번의 요청으로 통째로 내려준다.
   (브라우저가 수백 번 호출하면 무료 인스턴스가 버티지 못한다)
   ============================================================ */

const POOL_TTL_MS = 6 * 60 * 60 * 1000;   // 6시간
const POOL_TARGET = 300;                  // 수집 목표
const POOL_CONCURRENCY = 3;               // 상세 조회 동시 실행 수
const pools = {};                         // lang -> { status, done, total, places, at }

function foodCategoryCodes(catJson) {
  const out = [];
  const seen = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    const code = node.com_ctgry_sn;
    if (code && !seen.has(code)) {
      const label = [node.cate_depth, node.ctgry_nm, node.ctgry_name, node.name].join(' ');
      const isFood = /음식|맛집|식당|카페|주점|cuisine|restaurant|food|cafe|tea\s*shop|dining/i.test(label);
      const isNightlife = /club|나이트|클럽/i.test(label);
      if (isFood && !isNightlife) { seen.add(code); out.push(code); }
    }
    Object.keys(node).forEach((k) => walk(node[k]));
  };
  walk(catJson);
  return out;
}

/* 클라이언트가 쓰는 필드만 추려서 응답 크기를 줄인다 */
function slimPlace(info) {
  if (!info) return null;
  const tr = info.traffic || {};
  if (!tr.map_position_x || !tr.map_position_y) return null;
  const r = info.restaurant || {};
  return {
    cid: info.cid,
    post_sj: info.post_sj,
    sumry: info.sumry,
    cate_depth: info.cate_depth,
    tag: info.tag || [],
    main_img: info.main_img || '',
    traffic: {
      map_position_x: tr.map_position_x,
      map_position_y: tr.map_position_y,
      new_adres: tr.new_adres || '',
      adres: tr.adres || '',
      subway_info: tr.subway_info || '',
    },
    restaurant: {
      fd_reprsnt_menu: r.fd_reprsnt_menu || '',
      type: r.type || [],
      kind: r.kind || [],
      dietary: r.dietary || [],
      halal: r.halal || [],
      muslim: r.muslim || [],
      salam: r.salam || [],
    },
    extra: {
      cmmn_telno: (info.extra && info.extra.cmmn_telno) || '',
      cmmn_use_time: (info.extra && info.extra.cmmn_use_time) || '',
      closed_days: (info.extra && info.extra.closed_days) || '',
    },
  };
}

async function infoWithRetry(cid, lang, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      const d = await callVisitSeoul('POST', '/contents/info', {
        body: { cid, lang_code_id: lang },
      });
      const info = d && d.data;
      if (info) return info;
    } catch (err) {
      if (i === attempts - 1) return null;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  return null;
}

async function buildPool(lang) {
  const pool = pools[lang];
  try {
    let codes = ['Cz9d1h6'];
    try {
      const cats = await callVisitSeoul('GET', '/category/list');
      foodCategoryCodes(cats).forEach((c) => { if (!codes.includes(c)) codes.push(c); });
    } catch { /* 카테고리 조회 실패 시 기본 코드로 진행 */ }
    codes = codes.slice(0, 8);

    const cids = [];
    const seen = new Set();
    for (const code of codes) {
      for (const page of [1, 2, 3]) {
        try {
          const d = await callVisitSeoul('POST', '/contents/list', {
            body: { com_ctgry_sn: code, lang_code_id: lang, page_no: page },
          });
          const items = (d && d.data) || [];
          if (!Array.isArray(items) || !items.length) break;
          items.forEach((it) => {
            if (it && it.cid && !seen.has(it.cid)) { seen.add(it.cid); cids.push(it.cid); }
          });
        } catch { /* 한 페이지 실패는 건너뛴다 */ }
        if (cids.length >= POOL_TARGET) break;
      }
      if (cids.length >= POOL_TARGET) break;
    }

    pool.total = Math.min(cids.length, POOL_TARGET);
    const queue = cids.slice(0, POOL_TARGET);

    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const cid = queue[cursor++];
        const info = await infoWithRetry(cid, lang);
        const slim = slimPlace(info);
        if (slim) pool.places.push(slim);
        pool.done++;
      }
    };
    await Promise.all(
      Array.from({ length: POOL_CONCURRENCY }, () => worker())
    );

    pool.status = pool.places.length ? 'ready' : 'error';
    pool.at = Date.now();
    console.log(`[pool:${lang}] 완료 — ${pool.places.length}곳 / 시도 ${pool.done}건`);
  } catch (err) {
    pool.status = pool.places.length ? 'ready' : 'error';
    pool.at = Date.now();
    pool.error = String((err && err.message) || err);
    console.error(`[pool:${lang}] 실패`, err);
  }
}

const POOL_RETRY_MS = 60 * 1000;   // 실패 후 재시도까지 최소 간격

function ensurePool(lang) {
  const cur = pools[lang];
  const stale = cur && cur.status === 'ready' && Date.now() - cur.at > POOL_TTL_MS;
  // 업스트림이 죽었을 때 요청마다 재수집이 몰리지 않도록 쿨다운을 둔다
  const retryable = cur && cur.status === 'error' && Date.now() - cur.at > POOL_RETRY_MS;
  if (!cur || stale || retryable) {
    pools[lang] = { status: 'building', done: 0, total: 0, places: [], at: Date.now(), error: '' };
    buildPool(lang);
  }
  return pools[lang];
}

// 장소 풀 조회 — 아직 수집 중이면 지금까지 모은 만큼 함께 돌려준다
app.get('/api/places', (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'ko';
  const pool = ensurePool(lang);
  res.json({
    ok: true,
    status: pool.status,
    done: pool.done,
    total: pool.total,
    count: pool.places.length,
    places: pool.places,
    message: pool.error || '',
  });
});
