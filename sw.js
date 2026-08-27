const CACHE='calistenia-militar-final-v10';
const ASSETS=['./','./index.html','./manifest.webmanifest','./flexiones-de-pecho.jpg','./sentadillas.jpg','./remo-invertido.jpg','./fondos-en-silla.jpg','./plancha.jpg','./superman.jpg','./mountain-climbers.jpg','./burpees.jpg','./plancha-lateral.jpg','./abdominal-bicicleta.jpg','./referencia-general.jpg'];

const PATCH = `<script id="calistenia-v10-patch">
(()=>{
  'use strict';
  let audioCtx=null;
  let lastTimerValue=null;
  let zeroPlayed=false;
  function soundOn(){return localStorage.getItem('cal_sound')!=='off';}
  function unlockAudio(){
    try{
      audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended')audioCtx.resume();
    }catch(e){}
  }
  function tone(freq,duration=.055,gain=.035,type='sine'){
    if(!soundOn())return;
    try{
      unlockAudio();
      if(!audioCtx||audioCtx.state==='suspended')return;
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);
      g.gain.setValueAtTime(.0001,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(gain,audioCtx.currentTime+.008);
      g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
      o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration+.015);
    }catch(e){}
  }
  function finishTone(){tone(880,.12,.055,'sine');setTimeout(()=>tone(1175,.18,.055,'sine'),140);}

  // Unlock audio only; do not play a sound for ordinary taps.
  document.addEventListener('pointerdown',unlockAudio,{passive:true});
  document.addEventListener('touchstart',unlockAudio,{passive:true});

  function syncSoundButton(){
    const b=document.getElementById('soundToggle');
    if(b)b.textContent=soundOn()?'🔊 Sonido ON':'🔇 Sonido OFF';
  }
  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest('#soundToggle'):null;
    if(b){
      setTimeout(()=>{syncSoundButton();if(soundOn()){unlockAudio();tone(660,.07,.04);}},20);
    }
  },true);

  // The original app's timer is kept intact. We monitor its visible value and
  // add one tick per second plus a distinct completion signal.
  function checkTimer(){
    const el=document.getElementById('timerClock');
    if(!el)return;
    const value=el.textContent.trim();
    if(value===lastTimerValue)return;
    const previous=lastTimerValue;
    lastTimerValue=value;
    const match=value.match(/^(\\d+):([0-5]\\d)$/);
    if(!match)return;
    const total=Number(match[1])*60+Number(match[2]);
    const button=document.getElementById('timerBtn');
    const running=button&&button.textContent.includes('Pausar');
    if(total===0){
      if(!zeroPlayed&&(running||previous!==null)){
        zeroPlayed=true;finishTone();
        if(navigator.vibrate)navigator.vibrate([180,80,180]);
      }
      return;
    }
    zeroPlayed=false;
    if(running){
      if(total<=3)tone(1040,.09,.05,'square');
      else tone(720,.04,.028,'sine');
    }
  }

  function cleanCaptions(){document.querySelectorAll('.pdf-caption').forEach(el=>el.remove());}
  function fixImages(){
    document.querySelectorAll('img[src*="/assets/exercises/"]').forEach(img=>{
      const marker='/assets/exercises/';
      const idx=img.src.indexOf(marker);
      if(idx>=0)img.src=img.src.substring(0,idx+1)+img.src.substring(idx+marker.length);
    });
  }
  function run(){cleanCaptions();fixImages();syncSoundButton();checkTimer();}
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  setInterval(run,100);
  run();
})();
</script>`;

async function patchHtml(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  try{
    const text=await response.text();
    if(text.includes('calistenia-v10-patch'))return new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
    const patched=text.replaceAll('./assets/exercises/','./').replace(/<div class="pdf-caption">[\\s\\S]*?<\\/div>/g,'').replace(/<script>if\("serviceWorker" in navigator[\\s\S]*?<\\/script>/,'').replace('</body>',PATCH+'</body>');
    return new Response(patched,{status:response.status,statusText:response.statusText,headers:response.headers});
  }catch(e){return response;}
}

self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.pathname.includes('/assets/exercises/')){
    const filename=url.pathname.split('/assets/exercises/').pop();
    const fixed=new URL(url.href);fixed.pathname=url.pathname.substring(0,url.pathname.indexOf('/assets/exercises/'))+'/'+filename;
    event.respondWith(fetch(fixed).catch(()=>caches.match(fixed).then(r=>r||caches.match(event.request))));
    return;
  }
  event.respondWith(fetch(event.request).then(r=>patchHtml(r)).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
