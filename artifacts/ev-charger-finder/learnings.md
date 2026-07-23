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
