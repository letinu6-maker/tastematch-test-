/* 다시 그리기 신호 (순환 참조를 피하기 위한 연결 고리) */

/* render()는 app.js에 있는데 api.js·map.js에서도 "다시 그려" 신호를 보내야 한다.
   서로를 import 하면 순환 참조가 되므로, app.js가 시작할 때 자기 render를 등록한다. */

var renderer = function(){};

export function setRenderer(fn){ renderer = fn; }
export function requestRender(){ renderer(); }
