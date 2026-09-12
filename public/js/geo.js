/* 현재 위치 가져오기 — 메인 화면과 여권 화면이 함께 쓴다 */

import { state } from './state.js';
import { t } from './i18n.js';

export function requestGeo(render){
  if(!navigator.geolocation){
    state.geoMsg = t('이 브라우저에서는 위치를 가져올 수 없어요. 아래에서 거점을 골라주세요.');
    state.keepScroll = true; render(); return;
  }
  state.geoMsg = t('위치를 확인하는 중…');
  state.keepScroll = true; render();
  navigator.geolocation.getCurrentPosition(function(pos){
    var la = pos.coords.latitude, ln = pos.coords.longitude;
    var inSeoul = la > 37.41 && la < 37.71 && ln > 126.76 && ln < 127.19;
    state.origin = { key:'live', label:inSeoul ? t('현재 위치') : t('현재 위치 (서울 밖)'), lat:la, lng:ln, live:true };
    state.geoMsg = inSeoul ? '' : t('서울 밖이라 반경 안에 결과가 없을 수 있어요. 거점을 골라 데모로 볼 수 있습니다.');
    state.showLoc = !inSeoul;
    state.selectedId = null;
    state.keepScroll = true; render();
  }, function(){
    state.geoMsg = t('위치 권한이 없어요. 아래에서 거점을 골라주세요.');
    state.keepScroll = true; render();
  }, { timeout:8000, maximumAge:60000 });
}
