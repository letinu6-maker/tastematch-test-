/* 완성된 여권을 이미지 한 장으로 저장한다.
   SVG를 직접 만들어 캔버스에 구워 PNG로 내려받는다 — 외부 라이브러리가 필요 없다. */

import { esc } from './util.js';
import { PERSONAS } from './data.js';
import { state } from './state.js';
import { t } from './i18n.js';
import { natLabel, activeCombo, activePersonaProfile } from './profile.js';
import { character } from './character.js';
import { readStamps, titleOf, stampInner, stampDate, passportNo, STAMP_GOAL } from './stamps.js';

var W = 760, PAD = 44;

function row(x, y, k, v){
  return '<text x="' + x + '" y="' + y + '" font-size="12" letter-spacing="1.4" fill="#8B8FB0">' + esc(k) + '</text>' +
         '<text x="' + x + '" y="' + (y + 22) + '" font-size="19" font-weight="700" fill="#FFFFFF">' + esc(v) + '</text>';
}

function passportSvg(){
  var p = activePersonaProfile();
  var per = PERSONAS[activeCombo()];
  var parts = activeCombo().split('-');
  var list = readStamps();
  var title = titleOf(list);

  var cols = 3, cell = 200, gapY = 34;
  var rows = Math.ceil(Math.max(list.length, 3) / cols);
  var gridTop = 400;
  var H = gridTop + rows * (cell + gapY) + 120;

  var stamps = '';
  list.forEach(function(st, i){
    var cx = PAD + (i % cols) * ((W - PAD * 2) / cols);
    var cy = gridTop + Math.floor(i / cols) * (cell + gapY);
    var boxW = (W - PAD * 2) / cols;
    stamps +=
      '<svg x="' + (cx + (boxW - 150) / 2) + '" y="' + cy + '" width="150" height="150" viewBox="0 0 120 120">' +
        stampInner(st, 'x' + i) +
      '</svg>' +
      '<text x="' + (cx + boxW / 2) + '" y="' + (cy + 174) + '" text-anchor="middle" font-size="14" ' +
        'font-weight="700" fill="#26225B">' + esc(String(st.name).slice(0, 12)) + '</text>' +
      '<text x="' + (cx + boxW / 2) + '" y="' + (cy + 193) + '" text-anchor="middle" font-size="12" ' +
        'fill="#8B9093">' + esc(st.gu || '') + ' · ' + stampDate(st.at) + '</text>';
  });

  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="sans-serif">' +
    '<rect width="' + W + '" height="' + H + '" fill="#F4F5F6"/>' +

    /* 표지 블록 */
    '<rect x="0" y="0" width="' + W + '" height="340" fill="#26225B"/>' +
    '<text x="' + PAD + '" y="' + (PAD + 18) + '" font-size="15" letter-spacing="5" fill="#FFCD00" ' +
      'font-weight="700">SEOUL TASTE PASSPORT</text>' +
    '<text x="' + PAD + '" y="' + (PAD + 62) + '" font-size="34" font-weight="800" fill="#FFFFFF">' +
      esc(t('서울 미식 여권')) + '</text>' +

    '<svg x="' + (W - PAD - 150) + '" y="96" width="150" height="150" viewBox="0 0 100 100">' +
      character(parts[0], parts[1], 100).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') +
    '</svg>' +

    row(PAD, 150, 'TYPE', t(per.title)) +
    row(PAD, 214, 'NATIONALITY', natLabel(p)) +
    row(PAD + 250, 214, 'SPICE', (p.spice === null ? '-' : p.spice) + ' / 10') +
    row(PAD, 278, 'PASSPORT NO.', passportNo()) +
    row(PAD + 250, 278, 'STAMPS', list.length + ' / ' + STAMP_GOAL) +

    /* 칭호 */
    (title
      ? '<rect x="' + PAD + '" y="352" width="' + (W - PAD * 2) + '" height="34" rx="17" fill="#FFF6D6"/>' +
        '<text x="' + (W / 2) + '" y="375" text-anchor="middle" font-size="16" font-weight="700" ' +
          'fill="#A76D11">' + esc(t(title.label)) + '</text>'
      : '') +

    stamps +

    '<text x="' + (W / 2) + '" y="' + (H - 46) + '" text-anchor="middle" font-size="13" fill="#8B9093">' +
      esc(t('모든 장소는 비짓서울 API에 등록된 실제 콘텐츠입니다')) + '</text>' +
    '<text x="' + (W / 2) + '" y="' + (H - 24) + '" text-anchor="middle" font-size="13" fill="#8B9093">' +
      'TasteMatch Seoul · 2026 서울관광재단 비짓서울 API 공모전</text>' +
    '</svg>';
}

function saveBlob(blob, filename){
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
}

export function downloadPassport(onDone){
  var svg = passportSvg();
  var svgBlob = new Blob([svg], { type:'image/svg+xml;charset=utf-8' });
  var url = URL.createObjectURL(svgBlob);
  var img = new Image();

  img.onload = function(){
    try{
      var scale = 2;
      var c = document.createElement('canvas');
      c.width = img.width * scale; c.height = img.height * scale;
      var ctx = c.getContext('2d');
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      c.toBlob(function(b){
        if(b) saveBlob(b, 'seoul-taste-passport.png');
        else saveBlob(svgBlob, 'seoul-taste-passport.svg');
        if(onDone) onDone(true);
      }, 'image/png');
    }catch(e){
      URL.revokeObjectURL(url);
      saveBlob(svgBlob, 'seoul-taste-passport.svg');
      if(onDone) onDone(true);
    }
  };
  img.onerror = function(){
    URL.revokeObjectURL(url);
    saveBlob(svgBlob, 'seoul-taste-passport.svg');   /* 캔버스가 막히면 SVG 그대로 */
    if(onDone) onDone(true);
  };
  img.src = url;
}
