const CACHE='calistenia-militar-final-v8';
const ASSETS=['./','./index.html','./manifest.webmanifest','./flexiones-de-pecho.jpg','./sentadillas.jpg','./remo-invertido.jpg','./fondos-en-silla.jpg','./plancha.jpg','./superman.jpg','./mountain-climbers.jpg','./burpees.jpg','./plancha-lateral.jpg','./abdominal-bicicleta.jpg','./referencia-general.jpg'];

// Small client-side upgrade injected into the existing app so the update can
// be applied without rebuilding the whole large HTML file.
const PATCH=`<script id="calistenia-v8-patch">(()=>{
'use strict';
let audioCtx=null, lastSec=null, zeroPlayed=false;
function unlockAudio(){
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
  }catch(e){}
}
function tone(freq=880,duration=.055,type='sine',gain=.035){
  try{
    unlockAudio(); if(!audioCtx) return;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0,audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(gain,audioCtx.currentTime+.008);
    g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+duration+.01);
  }catch(e){}
}
function finishTone(){ tone(660,.12,'sine',.055); setTimeout(()=>tone(990,.18,'sine',.05),120); }
function watchTimer(){
  const el=document.querySelector('.timer-clock'); if(!el) return;
  const value=el.textContent.trim();
  if(value===lastSec) return;
  lastSec=value;
  const m=value.match(/^(\d+):([0-5]\d)$/);
  if(!m) return;
  const total=Number(m[1])*60+Number(m[2]);
  if(total>0){
    zeroPlayed=false;
    if(total<=3) tone(1100,.07,'square',.028); else tone(760,.035,'sine',.018);
  }else if(!zeroPlayed){ zeroPlayed=true; finishTone(); }
}
function removeCaption(){
  document.querySelectorAll('body *').forEach(el=>{
    if(el.children.length===0 && /l[aá]mina original del manual pdf/i.test(el.textContent||'')){
      const parent=el.parentElement;
      if(parent && parent.children.length<=2) parent.remove(); else el.remove();
    }
  });
}
function enhanceImages(){
  document.querySelectorAll('img').forEach(img=>{
    if(img.dataset.v8) return;
    img.dataset.v8='1';
    img.style.cursor='zoom-in';
    img.style.maxWidth='100%';
    img.style.height='auto';
    img.addEventListener('click',()=>{
      const overlay=document.createElement('div');
      overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.94);z-index:9999;display:flex;align-items:center;justify-content:center;padding:12px;overflow:auto;cursor:zoom-out';
      const big=document.createElement('img');
      big.src=img.currentSrc||img.src; big.alt=img.alt||'';
      big.style.cssText='max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;image-rendering:auto;cursor:zoom-out';
      overlay.appendChild(big); document.body.appendChild(overlay);
      overlay.addEventListener('click',()=>overlay.remove());
    });
  });
}
function run(){
  removeCaption(); enhanceImages();
  const clock=document.querySelector('.timer-clock');
  if(clock && !clock.dataset.v8watch){
    clock.dataset.v8watch='1';
    new MutationObserver(watchTimer).observe(clock,{childList:true,subtree:true,characterData:true});
    watchTimer();
  }
}
window.addEventListener('pointerdown',unlockAudio,{once:false,passive:true});
window.addEventListener('touchstart',unlockAudio,{once:false,passive:true});
new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
setInterval(run,700); run();
})();</script>`;

async function inject(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  try{
    const text=await response.text();
    if(text.includes('calistenia-v8-patch')) return new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
    const patched=text.replace('</body>',PATCH+'</body>');
    return new Response(patched,{status:response.status,statusText:response.statusText,headers:response.headers});
  }catch(e){return response;}
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  const marker='/assets/exercises/';
  if(url.pathname.includes(marker)){
    const filename=url.pathname.split(marker).pop();
    const fixed=new URL(url.href);
    fixed.pathname=url.pathname.substring(0,url.pathname.indexOf(marker))+'/'+filename;
    event.respondWith(fetch(fixed.toString()).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}return r;}).catch(()=>caches.match(fixed.toString()).then(r=>r||caches.match(event.request))));
    return;
  }
  event.respondWith(fetch(event.request).then(async r=>{
    if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(event.request,c));}
    return inject(r);
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
