const CACHE='calistenia-militar-final-v11';
const CORE=['./','./index.html','./manifest.webmanifest','./flexiones-de-pecho.jpg','./sentadillas.jpg','./remo-invertido.jpg','./fondos-en-silla.jpg','./plancha.jpg','./superman.jpg','./mountain-climbers.jpg','./burpees.jpg','./plancha-lateral.jpg','./abdominal-bicicleta.jpg','./referencia-general.jpg'];

const PATCH = `<style id="cal-v11-style">.pdf-caption{display:none!important}.exercise-visual img{image-rendering:auto!important}</style><script id="cal-v11-patch">(()=>{
'use strict';
let ctx=null,last=null,finished=false;
const enabled=()=>localStorage.getItem('cal_sound')!=='off';
function unlock(){try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();}catch(e){}}
function tone(f=720,d=.045,g=.028,type='sine'){if(!enabled())return;try{unlock();if(!ctx)return;const o=ctx.createOscillator(),a=ctx.createGain();o.type=type;o.frequency.value=f;a.gain.setValueAtTime(.0001,ctx.currentTime);a.gain.exponentialRampToValueAtTime(g,ctx.currentTime+.006);a.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.connect(a);a.connect(ctx.destination);o.start();o.stop(ctx.currentTime+d+.01);}catch(e){}}
function finish(){tone(880,.12,.06,'sine');setTimeout(()=>tone(1175,.18,.06,'sine'),130)}
function sync(){const b=document.getElementById('soundToggle');if(b)b.textContent=enabled()?'🔊 Sonido ON':'🔇 Sonido OFF'}
document.addEventListener('pointerdown',unlock,{passive:true});
document.addEventListener('touchstart',unlock,{passive:true});
document.addEventListener('click',e=>{const b=e.target?.closest?.('#soundToggle');if(!b)return;setTimeout(()=>{sync();if(enabled()){unlock();tone(660,.07,.045)}},30)},true);
function timerSound(){const el=document.getElementById('timerClock');if(!el)return;const v=el.textContent.trim();if(v===last)return;last=v;const m=v.match(/^(\\d+):([0-5]\\d)$/);if(!m)return;const n=Number(m[1])*60+Number(m[2]);const btn=document.getElementById('timerBtn');const running=!!btn&&btn.textContent.includes('Pausar');if(n===0){if(!finished){finished=true;finish();if(navigator.vibrate)navigator.vibrate([180,80,180])}return}finished=false;if(running){if(n<=3)tone(1100,.09,.05,'square');else tone(760,.045,.025,'sine')}}
function fix(){document.querySelectorAll('img[src*="/assets/exercises/"]').forEach(img=>{const u=new URL(img.getAttribute('src'),location.href);const marker='/assets/exercises/';const i=u.pathname.indexOf(marker);if(i>=0){u.pathname=u.pathname.slice(0,i+1)+u.pathname.slice(i+marker.length);img.src=u.pathname+u.search+u.hash;}});document.querySelectorAll('.pdf-caption').forEach(x=>x.remove());sync();timerSound()}
new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setInterval(fix,250);fix();
})();</script>`;

async function patch(response){
 const type=response.headers.get('content-type')||'';
 if(!type.includes('text/html'))return response;
 try{
  let text=await response.text();
  text=text.replaceAll('./assets/exercises/','./');
  text=text.replace(/<div class="pdf-caption">[\\s\\S]*?<\\/div>/g,'');
  if(!text.includes('cal-v11-patch'))text=text.replace('</body>',PATCH+'</body>');
  return new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
 }catch(e){return response}
}

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.pathname.endsWith('/sw.js')){e.respondWith(fetch(e.request,{cache:'no-store'}));return}
 if(url.pathname.includes('/assets/exercises/')){
  const marker='/assets/exercises/';const i=url.pathname.indexOf(marker);const fixed=new URL(url.href);fixed.pathname=url.pathname.slice(0,i+1)+url.pathname.slice(i+marker.length);
  e.respondWith(fetch(fixed,{cache:'no-store'}).catch(()=>caches.match(fixed)));
  return;
 }
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(patch).then(r=>{if(new URL(e.request.url).pathname.endsWith('/index.html')||new URL(e.request.url).pathname.endsWith('/')){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
