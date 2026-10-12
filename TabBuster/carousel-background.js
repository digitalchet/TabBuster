"use strict";
// Executed only in the temporary tab for the exact requested post.
async function collectPostCarousel(expectedUrl){
 const expected=new URL(expectedUrl);
 const deadline=Date.now()+20000,slides=new Map();let clicks=0,reason='No supported carousel appeared.';
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const safe=src=>{try{const u=new URL(src);return u.protocol==='https:'&&(u.hostname.endsWith('.cdninstagram.com')||u.hostname.endsWith('.fbcdn.net'))?u:null;}catch{return null;}};
 let selected=null;
 while(Date.now()<deadline){
  if(location.origin!==expected.origin||location.pathname!==expected.pathname)return {slides:[],reason:'The post redirected to another page.'};
  // Dismiss only the verified post-page signup dialog via its own close action.
  for(const dialog of document.querySelectorAll('[role="dialog"][aria-modal="true"]')){
   if(dialog.textContent.includes('Never miss a post from ')&&dialog.textContent.includes('Sign up for Instagram to stay in the loop.')&&dialog.querySelector('a[href="/accounts/emailsignup/"]')&&dialog.querySelector('a[href="/accounts/login/?source=desktop_dynamic_landing_dialog"]'))dialog.querySelector('svg[aria-label="Close"]')?.closest('[role="button"],button')?.click();
  }
  if(!selected||!selected.isConnected){
   const candidates=[];
   for(const list of document.querySelectorAll('ul')){
    if(list.closest('[role="dialog"]')||!list.querySelector('li[style*="translateX"] img'))continue;
    let ancestor=list.parentElement;
    for(let depth=0;depth<6&&ancestor&&ancestor!==document.body;depth++,ancestor=ancestor.parentElement){
     if(ancestor.querySelectorAll('ul').length!==1)break;
     if(ancestor.querySelector('button[aria-label="Go forward"],button[aria-label="Next"],button[aria-label="Go back"],button[aria-label="Previous"]')){candidates.push(ancestor);break;}
    }
   }
   if(candidates.length!==1){await sleep(400);continue;}
   selected=candidates[0];
  }
  const lists=[...selected.querySelectorAll('ul')].filter(ul=>ul.querySelector('li[style*="translateX"] img'));
  if(lists.length!==1){reason='Carousel structure was not recognized.';break;}
  for(const li of lists[0].children){
   const position=li.style.transform.match(/translateX\((-?[\d.]+)px\)/)?.[1];
   const img=li.querySelector('img');if(!img||position===undefined||li.querySelector('video')||/profile picture/i.test(img.alt))continue;
   const url=safe(img.currentSrc||img.src);if(!url)continue;
   const key=url.origin+url.pathname;
   if(!slides.has(key))slides.set(key,{src:url.href,alt:img.alt||'Instagram post image',position:Number(position)});
  }
  const next=selected.querySelector('button[aria-label="Go forward"],button[aria-label="Next"]');
  if(!next||next.disabled||next.getAttribute('aria-disabled')==='true'){reason='Reached the end of the available carousel.';break;}
  if(clicks>=20){reason='Stopped at the 20-step limit.';break;}
  const before=lists[0].innerHTML;next.click();clicks++;
  let changed=false;
  for(let i=0;i<12&&Date.now()<deadline;i++){await sleep(150);if(lists[0].innerHTML!==before){changed=true;break;}}
  if(!changed){reason='Instagram did not advance in the background tab.';break;}
  await sleep(300);
 }
 if(Date.now()>=deadline)reason='Stopped at the 20-second collection limit.';
 return {slides:[...slides.values()].sort((a,b)=>a.position-b.position).map(({src,alt})=>({src,alt})),reason};
}
chrome.runtime.onConnect.addListener(port=>{
 if(port.name!=='instagram-carousel')return;
 const sender=port.sender;
 if(sender?.id!==chrome.runtime.id||sender.frameId!==0||!sender.tab||!sender.url?.startsWith('https://www.instagram.com/')){port.disconnect();return;}
 let tabId=null,stopped=false,started=false;
 async function cleanup(){stopped=true;if(tabId!==null){const id=tabId;tabId=null;try{await chrome.tabs.remove(id);}catch{}}}
 port.onDisconnect.addListener(()=>void cleanup());
 port.onMessage.addListener(async message=>{
  if(started)return;started=true;
  const timeout=setTimeout(()=>void cleanup(),28000);
  try{
   const url=new URL(message.url);
   if(url.origin!=='https://www.instagram.com'||!/^\/(?:[^/]+\/)?p\/[A-Za-z0-9_-]+\/$/.test(url.pathname))throw Error('Unsupported post link.');
   url.search='';url.hash='';
   const settings=await chrome.storage.local.get({instagramNags:false,instagramPreviews:false,enabled:true});
   if(!settings.instagramNags||!settings.instagramPreviews||!settings.enabled||!await chrome.permissions.contains(instagramAccess))throw Error('Preview access is disabled.');
   if(stopped)return;
   const tab=await chrome.tabs.create({url:url.href,active:false,windowId:sender.tab.windowId});tabId=tab.id;
   if(stopped){await cleanup();return;}
   // Wait for the target document, without selecting or focusing the temporary tab.
   for(let i=0;i<35&&!stopped;i++){
    const current=await chrome.tabs.get(tabId);
    if(current.status==='complete')break;
    await new Promise(resolve=>setTimeout(resolve,150));
   }
   if(stopped)return;
   const result=await chrome.scripting.executeScript({target:{tabId},func:collectPostCarousel,args:[url.href]});
   if(!stopped)port.postMessage({ok:true,...result[0]?.result});
  }catch{if(!stopped){try{port.postMessage({ok:false,reason:'The temporary post tab could not supply its carousel.'});}catch{}}}
  finally{clearTimeout(timeout);await cleanup();try{port.disconnect();}catch{}}
 });
});
