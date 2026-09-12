import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_BASE = 'https://api-call.visitseoul.net/api/v1';
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
  try {
    const data = await callVisitSeoul('POST', '/contents/info', {
      body: { cid: req.params.cid },
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
