{\rtf1\ansi\ansicpg949\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import 'dotenv/config';\
import express from 'express';\
import path from 'node:path';\
import \{ fileURLToPath \} from 'node:url';\
\
const __dirname = path.dirname(fileURLToPath(import.meta.url));\
const app = express();\
app.use(express.json());\
app.use(express.static(path.join(__dirname, 'public')));\
\
const API_BASE = 'https://api-call.visitseoul.net/api/v1';\
const API_KEY = process.env.VISITSEOUL_API_KEY;\
\
// \uc0\u48708 \u51667 \u49436 \u50872  API\u47196  \u50836 \u52397 \u51012  \u45824 \u49888  \u48372 \u45236 \u51452 \u45716  \u50567 \u51008  \u54532 \u47197 \u49884 .\
// \uc0\u48652 \u46972 \u50864 \u51200 \u50640 \u49436  \u51649 \u51217  \u54840 \u52636 \u54616 \u47732  API \u53412 \u44032  \u44536 \u45824 \u47196  \u45432 \u52636 \u46104 \u44592  \u46412 \u47928 \u50640 ,\
// \uc0\u49436 \u48260 (\u51060  \u54028 \u51068 )\u50640 \u49436 \u47564  \u53412 \u47484  \u48537 \u50668 \u49436  \u54840 \u52636 \u54633 \u45768 \u45796 .\
async function callVisitSeoul(method, endpoint, \{ query, body \} = \{\}) \{\
  if (!API_KEY || API_KEY === '\uc0\u50668 \u44592 \u50640 _\u48156 \u44553 \u48155 \u51008 _API_\u53412 \u47484 _\u51077 \u47141 \u54616 \u49464 \u50836 ') \{\
    const err = new Error(\
      'VISITSEOUL_API_KEY\uc0\u44032  \u49444 \u51221 \u46104 \u51648  \u50506 \u50520 \u49845 \u45768 \u45796 . .env \u54028 \u51068 \u50640  \u48156 \u44553 \u48155 \u51008  API \u53412 \u47484  \u51077 \u47141 \u54616 \u49464 \u50836 .'\
    );\
    err.code = 'NO_API_KEY';\
    throw err;\
  \}\
\
  const url = new URL(API_BASE + endpoint);\
  if (query) \{\
    for (const [k, v] of Object.entries(query)) \{\
      if (v !== undefined && v !== '') url.searchParams.set(k, v);\
    \}\
  \}\
\
  const res = await fetch(url, \{\
    method,\
    headers: \{\
      Accept: 'application/json;charset=UTF-8',\
      'VISITSEOUL-API-KEY': API_KEY,\
      ...(body ? \{ 'Content-Type': 'application/json;charset=UTF-8' \} : \{\}),\
    \},\
    body: body ? JSON.stringify(body) : undefined,\
  \});\
\
  const text = await res.text();\
  let data;\
  try \{\
    data = JSON.parse(text);\
  \} catch \{\
    data = \{ raw: text \};\
  \}\
\
  if (!res.ok) \{\
    const err = new Error(\
      `\uc0\u48708 \u51667 \u49436 \u50872  API\u44032  \u50724 \u47448 \u47484  \u48152 \u54872 \u54664 \u49845 \u45768 \u45796  (HTTP $\{res.status\}). result_message: $\{\
        data.result_message || '\uc0\u50508  \u49688  \u50630 \u51020 '\
      \}`\
    );\
    err.code = 'UPSTREAM_ERROR';\
    err.status = res.status;\
    err.upstream = data;\
    throw err;\
  \}\
\
  return data;\
\}\
\
function handleError(res, err) \{\
  console.error(err);\
  if (err.code === 'NO_API_KEY') \{\
    return res.status(400).json(\{ ok: false, message: err.message \});\
  \}\
  if (err.code === 'UPSTREAM_ERROR') \{\
    return res\
      .status(err.status || 502)\
      .json(\{ ok: false, message: err.message, upstream: err.upstream \});\
  \}\
  return res.status(500).json(\{ ok: false, message: err.message \});\
\}\
\
// \uc0\u49436 \u48260 /\u53412  \u49345 \u53468  \u54869 \u51064 \
app.get('/api/health', (req, res) => \{\
  res.json(\{\
    ok: true,\
    hasApiKey: Boolean(API_KEY && API_KEY !== '\uc0\u50668 \u44592 \u50640 _\u48156 \u44553 \u48155 \u51008 _API_\u53412 \u47484 _\u51077 \u47141 \u54616 \u49464 \u50836 '),\
  \});\
\});\
\
// 1) \uc0\u50616 \u50612  \u53076 \u46300  \u51312 \u54924 \
app.get('/api/lang', async (req, res) => \{\
  try \{\
    const data = await callVisitSeoul('GET', '/code/lang');\
    res.json(\{ ok: true, data \});\
  \} catch (err) \{\
    handleError(res, err);\
  \}\
\});\
\
// 2) \uc0\u52852 \u53580 \u44256 \u47532  \u47785 \u47197  \u51312 \u54924 \
app.get('/api/category', async (req, res) => \{\
  try \{\
    const data = await callVisitSeoul('GET', '/category/list');\
    res.json(\{ ok: true, data \});\
  \} catch (err) \{\
    handleError(res, err);\
  \}\
\});\
\
// 3) \uc0\u53080 \u53584 \u52768  \u47785 \u47197  \u51312 \u54924  (\u52852 \u53580 \u44256 \u47532 /\u50616 \u50612 /\u53412 \u50892 \u46300 /\u51221 \u47148 /\u54168 \u51060 \u51648 )\
app.get('/api/contents', async (req, res) => \{\
  const \{ com_ctgry_sn, lang_code_id, keyword, sort_type, page_no \} = req.query;\
  try \{\
    const data = await callVisitSeoul('POST', '/contents/list', \{\
      body: \{\
        ...(com_ctgry_sn ? \{ com_ctgry_sn \} : \{\}),\
        ...(lang_code_id ? \{ lang_code_id \} : \{\}),\
        ...(keyword ? \{ keyword \} : \{\}),\
        ...(sort_type ? \{ sort_type \} : \{\}),\
        ...(page_no ? \{ page_no \} : \{\}),\
      \},\
    \});\
    res.json(\{ ok: true, data \});\
  \} catch (err) \{\
    handleError(res, err);\
  \}\
\});\
\
// 4) \uc0\u53080 \u53584 \u52768  \u49345 \u49464  \u51221 \u48372  \u51312 \u54924  (cid)\
app.get('/api/contents/:cid', async (req, res) => \{\
  const \{ lang_code_id \} = req.query;\
  try \{\
    const data = await callVisitSeoul('POST', '/contents/info', \{\
      body: \{\
        cid: req.params.cid,\
        ...(lang_code_id ? \{ lang_code_id \} : \{\}),\
      \},\
    \});\
    res.json(\{ ok: true, data \});\
  \} catch (err) \{\
    handleError(res, err);\
  \}\
\});\
\
const PORT = process.env.PORT || 3000;\
app.listen(PORT, () => \{\
  console.log(`\\n\uc0\u9989  \u48708 \u51667 \u49436 \u50872  API \u53580 \u49828 \u53944  \u49436 \u48260 \u44032  http://localhost:$\{PORT\} \u50640 \u49436  \u49892 \u54665  \u51473 \u51077 \u45768 \u45796 .`);\
  console.log(\
    API_KEY && API_KEY !== '\uc0\u50668 \u44592 \u50640 _\u48156 \u44553 \u48155 \u51008 _API_\u53412 \u47484 _\u51077 \u47141 \u54616 \u49464 \u50836 '\
      ? '   API \uc0\u53412 \u44032  \u44048 \u51648 \u46104 \u50632 \u49845 \u45768 \u45796 .'\
      : '   \uc0\u9888 \u65039   .env \u50640  VISITSEOUL_API_KEY\u44032  \u50500 \u51649  \u49444 \u51221 \u46104 \u51648  \u50506 \u50520 \u49845 \u45768 \u45796 .'\
  );\
\});}