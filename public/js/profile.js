/* 프로필에서 파생되는 값 — 국적 이름, 유형 조합, 미리보기 프로필 */

import { NATIONS, PERSONAS } from './data.js';
import { state } from './state.js';
import { t } from './i18n.js';

export function natLabel(p){
  if(p.natKey === 'custom') return p.natCustom || t('해당 국가');
  var f = NATIONS.filter(function(n){ return n.key === p.natKey; })[0];
  return f ? t(f.label) : t('해당 국가');
}
export function comboKey(p){ return (p.explore || 'trend') + '-' + (p.atmosphere || 'either'); }
function personaOf(p){ return PERSONAS[comboKey(p)]; }
export function activeCombo(){ return state.previewCombo || comboKey(state.profile); }
export function activePersonaProfile(){
  if(!state.previewCombo) return state.profile;
  var parts = state.previewCombo.split('-');
  var clone = JSON.parse(JSON.stringify(state.profile));
  clone.explore = parts[0]; clone.atmosphere = parts[1];
  return clone;
}
