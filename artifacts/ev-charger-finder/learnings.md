---
triggers: [next/script, "onLoad", vitest, jsdom, "script[src", Script component, kakao maps sdk, dispatchEvent load]
status: verified
scope: this-repo (next@16.1.6, vitest 4.x, jsdom)
date: 2026-07-23
---
## next/script는 테스트 파일 안에서 src/cacheKey를 전역 캐시하고, 이전 script 태그를 DOM에서 지우지 않는다

**지시문**: `next/script`(`strategy="afterInteractive"`)로 로드하는 컴포넌트를 Vitest+jsdom+Testing Library로 테스트할 때:
1. `document.querySelector('script[src*=...]')`로 스크립트를 찾지 말고 `querySelectorAll`로 찾아 **마지막 요소**를 써라 — next/script는 unmount 시 이전 script 태그를 제거하지 않으므로(재탐색 방지를 위한 의도적 설계) 같은 파일의 이전 테스트가 만든 태그가 계속 DOM에 남아 `querySelector`가 항상 그 첫 번째(오래된) 태그를 반환한다.
2. 여러 테스트가 같은 `src`로 `<Script onLoad>`를 렌더하면, 두 번째 테스트부터 `onLoad`가 아예 호출되지 않는다 — `next/dist/client/script.js`의 모듈 레벨 `ScriptCache`(Map, src 기준)·`LoadCache`(Set, id||src 기준)가 테스트 파일 전체 생명주기 동안 유지되기 때문. 각 테스트가 `src`를 유니크하게 만들어야 한다(예: env var 값에 테스트별 접미사를 붙임).

**에피소드**: `components/charger-map.tsx`(Task 3)에서 `next/script`로 카카오맵 SDK를 로드하고 `onLoad`에서 지도·마커를 초기화하는 로직을 테스트하는데, `dispatchEvent(new Event("load"))`로 로드를 시뮬레이션해도 `initializeMap`이 호출되지 않았다. 디버그용 단일 테스트로는 재현되지 않아서(그 파일엔 테스트가 하나뿐이라 캐시 충돌이 없었음), 처음엔 dispatchEvent 자체가 next/script와 안 맞는 줄 알았다. 실제 원인은 같은 파일의 앞선 테스트들이 이미 같은 src로 스크립트를 "로드 완료" 상태로 캐시해놨고, 그 오래된 `<script>` 태그가 여전히 DOM에 남아 `querySelector`에 잡혔던 것.

**증거**: `components/charger-map.test.tsx` — `lastKakaoScript()` 헬퍼(querySelectorAll + 마지막 요소)와 테스트별 `uniqueJsKey()`로 4개 테스트(`[S1-1]`, `[S1-2]` 포함) 전부 통과. `node_modules/next/dist/client/script.js`의 `ScriptCache`/`LoadCache` 선언(36~37번 줄)에서 직접 확인.

---
triggers: [search-bar, useStationSearch, "onLocationFound", 지오코딩 중복 호출, SearchBar refactor]
status: verified
scope: this-repo (ev-charger-finder feature)
date: 2026-07-23
---
## Task 1에서 "smart" 컴포넌트로 만든 SearchBar를, 오케스트레이션 훅이 생기는 Task에서 presentational로 되돌려야 했다

**지시문**: plan.md에서 초기 Task가 컴포넌트에 자체 fetch/에러 상태를 넣도록 기술했더라도(아직 훅이 없어서), 이후 Task가 동일한 흐름(지오코딩 등)을 오케스트레이션하는 훅을 도입한다면 **그 시점에 컴포넌트를 presentational로 리팩터링**하라. 두 곳이 같은 API를 각자 호출하게 두면 안 된다 — CLAUDE.md Architecture 표의 "components는 hooks에 의존" 순서를 어기게 된다.

**에피소드**: Task 1에서 `components/search-bar.tsx`가 `/api/geocode`를 직접 fetch하고 자체 에러 상태를 표시하도록 만들었다(그 시점엔 `hooks/`가 없었으므로 plan.md도 이렇게 기술했음). Task 3에서 `hooks/useStationSearch.ts`가 "주소 검색 → 지오코딩 → 충전소 조회"를 오케스트레이션하게 되자, SearchBar가 계속 자체 지오코딩을 하면 같은 API를 두 번 호출하는 구조가 됐다. `SearchBar`를 `onSubmit(query)`/`error`/`isLoading` prop만 받는 presentational 컴포넌트로 리팩터링하고, `search-bar.test.tsx`도 fetch mock 없이 prop 기반으로 다시 썼다.

**증거**: `components/search-bar.tsx`, `components/search-bar.test.tsx`, `hooks/useStationSearch.ts` — 리팩터링 후 전체 테스트 20개 통과, commit 4b784f5.

---
triggers: [독립 코드 리뷰, code-review, findNearbyStations, useStationSearch, 에러 스와핑, "no stations", 반경 내 결과 없음]
status: hypothesis
scope: this-repo (ev-charger-finder feature)
date: 2026-07-23
---
## Task 1~6 구현 후 독립 리뷰에서, 백엔드 실패를 "결과 없음"으로 뭉개는 부분을 발견했으나 spec 범위 밖으로 기각했다

**지시문**: `services/chargerStations.ts`(`!response.ok` → `[]` 반환)와 `hooks/useStationSearch.ts`(`!stationsResponse.ok` → `stations: []`)는 공공데이터포털 API가 진짜로 실패했을 때도 "반경 내 충전소 없음"(S4) 화면과 똑같이 보여준다. 사용자는 서비스 장애와 "그냥 근처에 충전소가 없음"을 구분할 수 없다. spec.md에 이 시나리오(충전소 조회 자체의 실패)가 정의되어 있지 않아 지금은 고치지 않았다 — 나중에 이 feature를 확장하거나 관련 버그 리포트가 들어오면, 먼저 spec.md에 시나리오를 추가할지부터 사용자와 확인하라. 코드만 고치고 spec을 안 바꾸면 판정 기준의 원본이 흔들린다.

**에피소드**: `/code-review` 스킬은 `disable-model-invocation`으로 에이전트가 직접 호출할 수 없어서, execute-plan Step 4의 독립 리뷰를 직접 diff를 읽는 방식으로 수행했다. 그 과정에서 이 문제와 함께 두 가지 Important 이슈(ChargerPopup의 `role="dialog"`가 포커스 관리 없이 오용됨, SearchBar가 로딩 중 Enter 키 재제출을 막지 않음)를 발견해 그 두 개는 바로 고쳤다(commit 871d1d5). 이 항목만 spec 범위 밖이라 판단해 기각했다.

**증거**: `services/chargerStations.ts`, `hooks/useStationSearch.ts` 코드 리딩. 재현 테스트는 작성하지 않았다(기각한 항목이라 hypothesis로 남김) — 검증하려면 `findNearbyStations`의 fetch가 network error를 throw하도록 mock한 뒤 `/api/stations` 응답과 화면 메시지를 확인하면 된다.

---
triggers: [Browser MCP, 미리보기 브라우저, 카카오맵, next/script, "Failed to fetch", onerror, 외부 스크립트, third-party script, 지도 SDK]
status: verified
scope: this-tooling (Claude Code Browser MCP 미리보기 브라우저)
date: 2026-07-23
---
## 세션 내장 미리보기 브라우저(Browser MCP)는 원격 서드파티 `<script>` 실행을 차단한다 — 지도 SDK 등 시각 확인은 사용자의 실제 브라우저에서 해야 한다

**지시문**: 카카오맵·구글맵처럼 외부 도메인에서 `<script>` 태그로 로드하는 SDK가 들어간 feature는, Browser MCP(이 세션의 내장 미리보기 브라우저)로 실제 렌더링을 확인하려 하지 마라. 대신: (1) 백엔드/API 호출 체인은 Browser MCP의 `read_network_requests`로 충분히 검증 가능하다(실제로 우리 API 라우트와 외부 API 왕복은 정상 동작함), (2) 시각적 확인(지도 렌더링, 마커, SDK 콜백)은 사용자에게 로컬에서 `bun dev` 실행 후 일반 브라우저로 직접 열어보라고 안내하라.

**에피소드**: ev-charger-finder 최종 체크포인트에서 카카오맵 JS SDK가 `window.kakao`를 정의하지 않아 지도가 렌더되지 않았다. 처음엔 카카오 앱 설정(제품 비활성화) 문제로 착각했으나, 그건 사용자가 이미 고쳤었다. 재확인을 위해 페이지 컨텍스트에서 `fetch(kakaoScriptUrl)`을 실행하니 `"Failed to fetch"`가 났고, `document.createElement('script')`로 같은 URL을 직접 로드해도 `onerror`가 발생했다. 반면 같은 URL을 `curl`이나 `node`로 직접 요청하면 200 OK와 정상 JS 본문이 돌아왔다. 즉 서버·키·설정은 모두 정상이고, Browser MCP 자체가 원격 스크립트 실행을 막고 있었다. `/api/geocode`, `/api/stations`는 실제 카카오/공공데이터 API를 정상 호출했으므로(read_network_requests로 확인), 백엔드 체인 검증에는 지장이 없었다.

**증거**: 브라우저 콘솔에서 `fetch('https://dapi.kakao.com/...')` → `"Failed to fetch"`; 수동 `<script>` 태그 로드 → `onerror` 콜백 실행. 동일 URL의 `curl -sv` 응답은 `HTTP/1.1 200 OK` + 정상 JS 본문. `read_network_requests`로 확인한 `/api/geocode`(200, 실제 좌표), `/api/stations`(200, 반경 5km 이내 실제 충전소 86곳) 왕복은 정상.
