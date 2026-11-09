/* ══════════════════════════════════════════════════
   둥지 런처 · 한 달 리뷰 제출 알림 배지
   ══════════════════════════════════════════════════
   ↓ 아래 두 줄만 채우면 끝입니다.
     review.html 안에 있는 SUPABASE_URL / SUPABASE_ANON 과 같은 값
   ══════════════════════════════════════════════════ */

const RV_URL  = 'https://YOUR_PROJECT.supabase.co';
const RV_ANON = 'YOUR_ANON_KEY';
const RV_PAGE = 'review.html';

/* ───── 여기서부터는 수정할 필요 없습니다 ───── */
(function(){
  const BASE = String(RV_URL).trim()
    .replace(/\/+$/,'').replace(/\/(rest|auth)\/v1$/,'').replace(/\/+$/,'');

  /* 스타일 주입 */
  const css = `
  .rv-badge{position:absolute;top:-9px;right:-9px;min-width:24px;height:24px;padding:0 7px;
    display:none;align-items:center;justify-content:center;background:#e03131;color:#fff;
    font-size:12.5px;font-weight:800;line-height:1;border-radius:999px;border:2px solid #fff;
    box-shadow:0 2px 8px rgba(224,49,49,.4);z-index:5}
  .rv-badge.on{display:flex;animation:rvPop .35s ease}
  @keyframes rvPop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
  .rv-bar{display:none;align-items:center;gap:10px;flex-wrap:wrap;max-width:960px;
    margin:18px auto 0;padding:12px 16px;background:#fff5f5;border:1px solid #ffc9c9;
    border-left:4px solid #e03131;border-radius:8px;color:#9b2c2c;font-size:14px}
  .rv-bar.on{display:flex}
  .rv-bar b{font-weight:800}
  .rv-bar .rv-names{color:#6d3030;font-size:13px}
  .rv-bar a{margin-left:auto;background:#e03131;color:#fff;text-decoration:none;
    padding:7px 14px;border-radius:6px;font-size:13.5px;font-weight:700}`;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function rpc(fn, body){
    return fetch(BASE + '/rest/v1/rpc/' + fn, {
      method:'POST',
      headers:{ 'apikey':RV_ANON, 'Authorization':'Bearer '+RV_ANON, 'Content-Type':'application/json' },
      body: JSON.stringify(body || {})
    }).then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)));
  }

  function findCard(){
    const links = document.querySelectorAll('a[href*="' + RV_PAGE + '"]');
    if(links.length) return links[0];
    const all = document.querySelectorAll('a, .card, [class*="card"]');
    for(const el of all){
      if((el.textContent || '').indexOf('한 달 리뷰') > -1) return el;
    }
    return null;
  }

  function fmt(ts){
    const d = new Date(ts);
    if(isNaN(d)) return '';
    return (d.getMonth()+1) + '/' + d.getDate();
  }

  let barEl = null;

  function render(data){
    const n = (data && data.count) ? data.count : 0;

    const card = findCard();
    const host = card ? (card.closest('a') || card) : null;

    if(host){
      if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
      let b = host.querySelector('.rv-badge');
      if(!b){
        b = document.createElement('span');
        b.className = 'rv-badge';
        host.appendChild(b);
        host.addEventListener('click', markRead);
      }
      b.textContent = n > 99 ? '99+' : n;
      b.classList.toggle('on', n > 0);
    }

    if(barEl){ barEl.remove(); barEl = null; }
    if(!n) return;

    const names = (data.recent || [])
      .map(r => r.building_name + '(' + fmt(r.submitted_at) + ')').join(' · ');

    barEl = document.createElement('div');
    barEl.className = 'rv-bar on';
    barEl.innerHTML =
      '<span>한 달 리뷰 설문에 <b>새 응답 ' + n + '건</b>이 도착했습니다.</span>'
      + (names ? '<span class="rv-names">' + names + '</span>' : '')
      + '<a href="' + RV_PAGE + '" id="rvGo">확인하기 →</a>';

    const main = document.querySelector('main') || document.body;
    if(main.firstElementChild) main.insertBefore(barEl, main.firstElementChild);
    else main.appendChild(barEl);

    const go = document.getElementById('rvGo');
    if(go) go.addEventListener('click', markRead);
  }

  function markRead(){
    try{ rpc('review_mark_read'); }catch(e){}
  }

  function check(){
    if(RV_URL.indexOf('YOUR_PROJECT') > -1) return;
    rpc('review_unread_summary').then(render).catch(function(){});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();

  setInterval(check, 120000);
})();
