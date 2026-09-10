# 비짓서울 API 테스트 서버 (TasteMatch Seoul 준비용)

비짓서울(VISIT SEOUL) API가 정상적으로 연동되는지 확인하기 위한 최소한의 테스트 프로젝트입니다.
언어 코드 조회 / 카테고리 목록 조회 / 콘텐츠 목록 조회 / 콘텐츠 상세 조회, 이렇게 4개 API를 브라우저에서 버튼 클릭으로 테스트할 수 있습니다.

API 키는 브라우저(클라이언트)가 아니라 이 안에 포함된 작은 서버(`server.js`)가 대신 호출해주는 구조라서, 키가 브라우저에 노출되지 않습니다.

전체 흐름은 이렇습니다: **① 실제 URL 먼저 확보(GitHub + Render 배포) → ② 그 URL로 비짓서울 API 키 신청 → ③ 발급받은 키를 등록하고 테스트.**
(로컬 `localhost`만으로 신청이 반려되는 경우가 있어서, 처음부터 실제 URL로 진행하는 순서로 안내합니다.)

---

## 0. 준비물

- Node.js 18 이상 (터미널에서 `node --version`으로 확인)
- GitHub 계정 (무료, 배포에 필요)
- Render 계정 (무료, GitHub 계정으로 바로 가입 가능)

## 1. 실제 URL 만들기 (GitHub + Render 배포)

이 zip 안에는 이미 `git init` + 첫 커밋이 되어 있어서, GitHub에 저장소만 만들면 바로 올릴 수 있습니다.

### 1-1. GitHub 계정 만들기 (이미 있다면 건너뛰기)

1. https://github.com/signup 접속 → 이메일·비밀번호·아이디로 가입 (무료)

### 1-2. 새 저장소 만들기

1. https://github.com/new 접속
2. Repository name: `tastematch-test` (다른 이름도 가능)
3. Public/Private 아무거나 선택, **"Add a README file" 등 초기화 옵션은 모두 체크 해제**
4. **Create repository** 클릭 → 생성된 저장소 주소 확인 (예: `https://github.com/내계정/tastematch-test.git`)

### 1-3. 이 프로젝트를 방금 만든 저장소로 push

압축을 푼 `visitseoul-api-test` 폴더에서 터미널을 열고 (이미 git 저장소로 초기화되어 있습니다):

```bash
git remote add origin https://github.com/내계정/tastematch-test.git
git push -u origin main
```

`내계정` 부분을 실제 GitHub 아이디로 바꿔서 실행하세요. GitHub 로그인 창이 뜨면 로그인합니다.

### 1-4. Render에 배포하기

1. https://render.com 접속 → **Get Started** → GitHub 계정으로 로그인/가입 (권한 요청 승인)
2. 대시보드에서 **New + → Web Service**
3. 방금 만든 `tastematch-test` 저장소 선택 → **Connect**
4. 설정 화면에서 (이 프로젝트에 포함된 `render.yaml` 덕분에 대부분 자동으로 채워집니다):
   - Name: `tastematch-test` (원하는 이름으로 변경 가능 — 실제 URL에 그대로 쓰입니다)
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**
5. **Environment Variables**에 아래 하나 추가 (지금은 임시 값이어도 됩니다, 나중에 실제 키로 교체):
   - Key: `VISITSEOUL_API_KEY` / Value: `temp-placeholder`
6. **Create Web Service** 클릭 → 2~3분 정도 빌드/배포 대기
7. 배포가 끝나면 화면 상단에 실제 URL이 생깁니다: `https://tastematch-test.onrender.com` 형태
   (이름이 이미 다른 사람이 쓰고 있으면 Render가 자동으로 `-xxxx` 같은 접미사를 붙입니다 — 뜬 주소를 그대로 사용하면 됩니다)
8. 그 주소로 접속해서 테스트 페이지가 뜨는지 확인합니다. (API 키가 아직 진짜 값이 아니라서 노란/빨간 경고가 뜨는 게 정상입니다)

> 무료 플랜은 15분 이상 요청이 없으면 서버가 잠들고, 다음 요청 때 다시 깨어나는 데 30초~1분 정도 걸립니다. 테스트 용도로는 문제없습니다.

이제 **1-4에서 확인한 실제 URL**을 2단계 API 키 신청에 사용합니다.

## 2. 비짓서울 API 키 발급받기

이미 비짓서울 개발자센터 회원가입은 하신 상태이니, 2단계부터 진행하시면 됩니다.

1. **회원가입** — 완료됨 ✅
2. **마이페이지 > API 키 관리에서 발급 신청**
   - 로그인 후 마이페이지로 이동 → **API 키 관리** 메뉴 진입
   - API 키 발급 신청 화면에서 서비스에 대한 간단한 설명과 **API 사용 목적**을 작성
     - 예시: "서울관광재단 비짓서울 API 데이터·AI 활용 아이디어 공모전 제출용 프로토타입(TasteMatch Seoul, 외국인 관광객 대상 음식 추천 서비스) 개발 및 테스트"
3. **API를 호출할 사이트 URL 등록**
   - 위 1단계에서 확보한 실제 URL을 입력합니다 (예: `https://tastematch-test.onrender.com`)
   - 신청 후에는 관리자 승인을 기다려야 합니다(반려되면 사유 확인 후 보완하여 재신청).
4. 승인이 완료되면 **마이페이지 > API 키 관리**에서 발급된 키를 확인할 수 있습니다.

## 3. 발급받은 API 키 등록하기

**Render(배포된 서버)에 등록:**

1. Render 대시보드 → `tastematch-test` 서비스 → **Environment** 탭
2. `VISITSEOUL_API_KEY` 값을 임시값에서 실제 발급받은 키로 교체 → 저장하면 자동 재배포됩니다.

**로컬에서도 테스트하고 싶다면:**

폴더 안의 `.env.example` 파일을 복사해서 `.env` 파일을 만들고, 발급받은 키를 붙여넣습니다.

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래처럼 수정:

```
VISITSEOUL_API_KEY=발급받은_실제_API_키
PORT=3000
```

그다음 설치 및 실행:

```bash
npm install
npm start
```

터미널에 아래처럼 뜨면 정상입니다.

```
✅ 비짓서울 API 테스트 서버가 http://localhost:3000 에서 실행 중입니다.
   API 키가 감지되었습니다.
```

## 4. 테스트 페이지 사용법

배포된 URL(`https://tastematch-test.onrender.com`)이나 로컬(`http://localhost:3000`)에 접속 → 화면 상단에 "API 키가 감지되었습니다" 초록 메시지가 뜨는지 확인 → 각 섹션의 "호출" 버튼을 눌러 실제 응답을 확인합니다.

- API 키를 아직 안 넣었다면 노란/빨간 경고가 뜨고, 각 API 호출 시 안내 메시지가 표시됩니다(에러는 나지만 서버가 죽지는 않습니다).
- 카테고리 조회 결과에서 `com_ctgry_sn` 값을 복사해 "콘텐츠 목록 조회"에 넣으면 카테고리 필터링도 테스트할 수 있습니다.
- 콘텐츠 목록 조회 결과의 `cid` 값을 "콘텐츠 상세 조회"에 넣으면 상세 정보(주소, 좌표, 설명 등)를 확인할 수 있습니다.

## 5. 확인된 API 스펙 요약

| API | 메서드 | 엔드포인트 | 주요 파라미터 |
|---|---|---|---|
| 언어 코드 조회 | GET | `/api/v1/code/lang` | 없음 |
| 카테고리 목록 조회 | GET | `/api/v1/category/list` | 없음 |
| 콘텐츠 목록 조회 | POST | `/api/v1/contents/list` | `com_ctgry_sn`, `lang_code_id`, `keyword`, `sort_type`, `page_no` (모두 선택) |
| 콘텐츠 상세 조회 | POST | `/api/v1/contents/info` | `cid` (필수) |

- 인증: 모든 요청에 HTTP 헤더 `VISITSEOUL-API-KEY: <발급받은 키>` 필요
- Base URL: `https://api-call.visitseoul.net`
- 응답 포맷: JSON, 공통적으로 `{ data, result_code, result_message }` 형태

(출처: [api.visitseoul.net API 안내](https://api.visitseoul.net/apiinfo/apiovr/view/3?lang=ko) 및 API 상세 문서 페이지)

## 6. 다음 단계 (TasteMatch Seoul로 확장)

이 프로젝트는 "API가 정상적으로 붙는지" 확인하는 최소 뼈대입니다. 실제 TasteMatch Seoul 프로토타입으로 확장할 때는:

- `/api/contents`(음식 카테고리로 필터) 결과를 온보딩에서 받은 국적·매운맛·알레르기 정보와 매칭하는 로직 추가
- `contents/info`의 위치 좌표를 매치 지도 화면에 연결
- 클로드 프로젝트에 저장된 `tastematch-wireframe.md`, `tastematch-expansion.md`, `tastematch-evaluation.md` 문서의 화면 구성·스코어링 공식을 참고해 기능 붙이기
- 기능이 늘어나면 `git add -A && git commit -m "..." && git push` 후 Render가 자동으로 재배포합니다.

문의사항 있으면 언제든 이어서 요청해 주세요.
