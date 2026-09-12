/* 작은 공용 도구 — HTML 이스케이프, 해시, 거리·시간 계산 */

var KM_PER_LAT = 111.0, KM_PER_LNG = 88.3;   /* 위도 37.5° 기준 */

export function distKm(aLat, aLng, bLat, bLng){
  var dy = (aLat - bLat) * KM_PER_LAT;
  var dx = (aLng - bLng) * KM_PER_LNG;
  return Math.sqrt(dx * dx + dy * dy);
}
export function fmtDist(km){
  return km < 1 ? Math.round(km * 1000) + 'm' : km.toFixed(1) + 'km';
}
export function walkMin(km){ return Math.max(1, Math.round(km / 4.5 * 60)); }
export function fmtRadius(km){ return km < 1 ? Math.round(km * 1000) + 'm' : km + 'km'; }
export function hash(str){
  var h = 2166136261, i;
  for(i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
export function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
export function esc(s){
  return String(s).replace(/[&<>"]/g, function(ch){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch];
  });
}
