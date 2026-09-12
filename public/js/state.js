/* 앱 상태 하나와 프로필 저장/불러오기 */

/* ============================================================
   상태
   ============================================================ */

export var STORE_KEY = 'tastematch.profile.v1';

export var state = {
  screen: 'intro',
  step: 0,
  editing: false,
  natQuery: '',
  algQuery: '',
  showNatCustom: false,
  showAlgCustom: false,
  activeMenu: null,
  previewCombo: null,
  openType: null,
  origin: { key:'myeongdong', label:'명동역', lat:37.5609, lng:126.9860, live:false },
  radiusKm: 2,
  selectedId: null,
  showLoc: false,
  showOff: false,
  geoMsg: '',
  lang: 'ko',
  rawCache: {},
  pool: { status:'idle', done:0, total:0, error:'', fromCache:false, filling:false },
  profile: {
    natKey: null, natCustom: '',
    explore: null, atmosphere: null, spice: null,
    allergens: [], customAllergens: [], noAllergy: false,
    vegan: [], veganNone: false, halal: false
  }
};

export function loadSaved(){
  try{
    var raw = localStorage.getItem(STORE_KEY);
    if(!raw) return null;
    var p = JSON.parse(raw);
    if(p && p.explore && p.atmosphere) return p;
  }catch(e){}
  return null;
}
export function saveProfile(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state.profile)); }catch(e){}
}
