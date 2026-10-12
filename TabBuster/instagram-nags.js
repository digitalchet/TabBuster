"use strict";
(()=>{
 if(globalThis.__tabBusterInstagram)return;
 globalThis.__tabBusterInstagram=true;
 let observer,active=false,pending=false,previews=false,clicked=null,viewer=null,loading=false;
 const signature="|click||input||keydown||keyup||change|";
 function findOverlay(dialog,post=false){
  const text=e=>(e.textContent||"").trim();
  if(!post&&!dialog.querySelector('[role="img"][aria-label="Illustration of see this story upsell"]'))return;
  if(post&&(!dialog.querySelector('svg[aria-label="Close"]')||!dialog.querySelector('img[alt$="profile picture"]')))return;
  if(![...dialog.querySelectorAll('span')].some(e=>text(e)===(post?"See this post":"Continue watching")))return;
  const buttons=[...dialog.querySelectorAll('[role="button"],button')].map(text);
  if(!buttons.includes("Sign up")||!buttons.includes("Log in")||dialog.querySelector('input,textarea,form,video'))return;
  const wrapper=dialog.closest('[data-interactable]');
  if(!wrapper||wrapper.getAttribute('data-interactable')!==signature)return;
  const root=wrapper.parentElement;
  if(!root||root===document.body||root===document.documentElement||root.children.length!==2)return;
  const sibling=[...root.children].find(e=>e!==wrapper);
  if(sibling?.id!=="scrollview"||sibling.getAttribute('aria-hidden')!=="true")return;
  if(root.querySelectorAll('[role="dialog"]').length!==1||root.querySelector('main,article,nav,form,input,textarea,video'))return;
  return root;
 }
 function scan(){
  pending=false;if(!active)return;
  for(const dialog of document.querySelectorAll('[role="dialog"][aria-modal="true"]')){
   const root=findOverlay(dialog);
   if(!root){
    const postRoot=previews&&findOverlay(dialog,true);
    if(postRoot&&clicked&&Date.now()-clicked.at<8000&&!loading&&!viewer)void preview(postRoot,clicked);
    continue;
   }
   if(!root.isConnected)continue;
   root.remove();
   void chrome.runtime.sendMessage({type:"instagramNagDismissed"}).catch(()=>{});
  }
 }
 function stop(){active=false;observer?.disconnect();clicked=null;viewer?.();}
 async function refresh(){
  try{
   const s=await chrome.storage.local.get({instagramNags:false,instagramPreviews:false,enabled:true});
   stop();if(!s.instagramNags||!s.enabled)return;
   active=true;previews=s.instagramPreviews;
   observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(scan);}});
   observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['role','aria-modal','aria-label','aria-hidden','data-interactable'],characterData:true});
   scan();
  }catch{stop();}
 }

 function safeImage(value){
  try{const u=new URL(value,location.href);return u.protocol==='https:'&&(u.hostname==='cdninstagram.com'||u.hostname.endsWith('.cdninstagram.com')||u.hostname.endsWith('.fbcdn.net'))?u.href:null;}catch{return null;}
 }
 document.addEventListener('click',event=>{
  if(!active||!previews||!event.isTrusted||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  clicked=null;
  const link=event.target.closest?.('a[href]');if(!link||link.closest('[role="dialog"]'))return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||!/^\/(?:[^/]+\/)?p\/[^/]+\/$/.test(url.pathname))return;
  const images=[...link.querySelectorAll('img')].filter(img=>!img.alt.toLowerCase().includes('profile picture'));
  if(images.length!==1)return;
  const img=images[0],src=safeImage(img.currentSrc||img.src);if(!src)return;
  let best=src,bestSize=0;
  for(const part of (img.getAttribute('srcset')||'').split(',')){
   const match=part.trim().match(/^(\S+)\s+(\d+(?:\.\d+)?)(w|x)$/);
   if(match&&Number(match[2])>bestSize&&safeImage(match[1])){best=safeImage(match[1]);bestSize=Number(match[2]);}
  }
  clicked={src,best,alt:img.alt,at:Date.now(),link};
 },true);
 async function preview(root,item){
  loading=true;
  const image=new Image();image.alt=item.alt||'Instagram image preview';image.referrerPolicy='no-referrer';
  function load(src){return new Promise(resolve=>{
   const timer=setTimeout(()=>{image.onload=image.onerror=null;resolve(false);},6000);
   image.onload=()=>{clearTimeout(timer);resolve(true);};image.onerror=()=>{clearTimeout(timer);resolve(false);};image.src=src;
  });}
  let ready=await load(item.best);
  if(!ready&&item.best!==item.src)ready=await load(item.src);
  loading=false;
  if(clicked!==item||!active||!previews||!root.isConnected)return;
  clicked=null;
  if(!ready)return; // Keep Instagram's dialog if the supplied image is unavailable.
  const host=document.createElement('div');host.id='tabbuster-image-preview';
  const shadow=host.attachShadow({mode:'closed'}),style=document.createElement('style');
  style.textContent=`
   dialog{box-sizing:border-box;position:fixed;inset:0;margin:auto;width:100vw;height:100dvh;max-width:none;max-height:none;border:0;padding:0;background:transparent;color:#f4f8ff;font:14px system-ui;outline:none;overflow:hidden}
   dialog::backdrop{background:rgb(8 15 27 / 60%)}
   .viewport{position:absolute;inset:0;overflow:auto;display:grid;place-items:safe center}
   .image-toggle{display:block;flex:none;border:0;padding:0;background:transparent;max-width:100%;max-height:100%;cursor:zoom-in}
   img{display:block;max-width:100%;max-height:100dvh;width:auto;height:auto;object-fit:contain}
   .image-toggle[aria-pressed="true"]{max-width:none;max-height:none;cursor:zoom-out}
   .image-toggle[aria-pressed="true"] img{max-width:none;max-height:none}
   .close{position:absolute;right:20px;top:16px;border:1px solid #38536f;border-radius:50%;width:36px;height:36px;padding:0;display:grid;place-items:center;background:#0f1e31;color:#f4f8ff;cursor:pointer;z-index:1}
   .close::before,.close::after{content:"";position:absolute;width:16px;height:2px;background:currentColor;border-radius:1px;transform:rotate(45deg)}.close::after{transform:rotate(-45deg)}
   button:focus-visible,a:focus-visible{outline:2px solid #69b7ff;outline-offset:3px}
   aside{position:absolute;bottom:18px;right:18px;width:min(416px,calc(100% - 36px));box-sizing:border-box;padding:0;background:#0f1e31;border:1px solid #38536f;border-radius:10px;line-height:1.5;z-index:1;overflow:hidden}a{color:#69b7ff}
   .notice-content{box-sizing:border-box;padding:12px 48px 12px 16px}
   .notice-toggle{position:absolute;bottom:0;right:0;width:30px;height:30px;border:0;padding:0;background:transparent;color:#f4f8ff;font:18px system-ui;cursor:pointer;z-index:2;display:grid;place-items:center}
   .notice-toggle:focus-visible{outline-offset:-4px;border-radius:50%}
  `;
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','TabBuster Instagram image preview');
  const close=document.createElement('button');close.type='button';close.className='close';close.setAttribute('aria-label','Close image preview');
  const notice=document.createElement('aside'),noticeContent=document.createElement('div');noticeContent.className='notice-content';notice.append(noticeContent);noticeContent.append('Image preview only. ');
  const login=document.createElement('a');login.href='https://www.instagram.com/accounts/login/';login.textContent='Log in to Instagram';login.target='_blank';login.rel='noopener noreferrer';noticeContent.append(login,' for the full post and its features.');
  notice.id='preview-information';
  const info=document.createElement('button');info.type='button';info.className='notice-toggle';info.textContent='−';info.setAttribute('aria-controls',notice.id);info.setAttribute('aria-expanded','true');info.setAttribute('aria-label','Collapse image information');info.title='Collapse image information';
  let noticeCollapsed=false,noticeAnimating=false;
  async function animateNotice(element,frames,duration){
   await element.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'}).finished;
  }
  info.onclick=async()=>{
   if(noticeAnimating)return;noticeAnimating=true;
   const expanding=noticeCollapsed;
   const expandedWidth=Math.min(416,dialog.clientWidth-36);
   noticeContent.style.width=(expandedWidth-2)+'px';
   const expandedHeight=noticeContent.offsetHeight+2;
   const from=notice.getBoundingClientRect();
   info.textContent='';
   try{
    if(!expanding){
     noticeContent.inert=true;
     await animateNotice(noticeContent,[{opacity:1},{opacity:0}],140);
     noticeContent.style.visibility='hidden';
    }
    await animateNotice(notice,[{width:from.width+'px',height:from.height+'px',borderRadius:expanding?'50%':'10px'},{width:(expanding?expandedWidth:32)+'px',height:(expanding?expandedHeight:32)+'px',borderRadius:expanding?'10px':'50%'}],260);
    noticeCollapsed=!expanding;
    if(expanding){
     noticeContent.style.visibility='visible';
     await animateNotice(noticeContent,[{opacity:0},{opacity:1}],140);
     noticeContent.inert=false;
     notice.getAnimations().forEach(a=>a.cancel());noticeContent.style.width='';
    }
   }finally{
    info.textContent=noticeCollapsed?'i':'−';info.setAttribute('aria-expanded',String(!noticeCollapsed));info.setAttribute('aria-label',noticeCollapsed?'Show image information':'Collapse image information');info.title=info.getAttribute('aria-label');noticeAnimating=false;
   }
  };
  notice.append(info);
  const viewport=document.createElement('div');viewport.className='viewport';
  const zoom=document.createElement('button');zoom.type='button';zoom.className='image-toggle';zoom.setAttribute('aria-pressed','false');zoom.setAttribute('aria-label','Show image at natural size');zoom.title='Click to view natural size';
  zoom.append(image);viewport.append(zoom);
  let expanded=false;
  const sizeNote=document.createElement('span');sizeNote.style.display='block';noticeContent.prepend(sizeNote);
  function sizeImage(){
   const naturalWidth=image.naturalWidth,naturalHeight=image.naturalHeight;
   const fit=Math.min(1,viewport.clientWidth/naturalWidth,viewport.clientHeight/naturalHeight);
   const zoomScale=fit<0.98?1:2;
   const scale=expanded?zoomScale:fit;
   image.style.width=(naturalWidth*scale)+'px';image.style.height=(naturalHeight*scale)+'px';
   image.style.maxWidth='none';image.style.maxHeight='none';
   zoom.style.width=image.style.width;zoom.style.height=image.style.height;zoom.style.maxWidth='none';zoom.style.maxHeight='none';
   zoom.setAttribute('aria-pressed',String(expanded));
   const action=expanded?'Fit image to window':zoomScale===1?'Show image at natural size':'Enlarge image to 2×';
   zoom.setAttribute('aria-label',action);zoom.title=action;
   sizeNote.textContent=naturalWidth+' × '+naturalHeight+' px · '+(expanded?(zoomScale===1?'Natural size':'2× enlargement — no extra detail'):(fit<0.98?'Fit to window':'Natural size'));
  }
  zoom.onclick=()=>{expanded=!expanded;sizeImage();viewport.scrollTo(0,0);};
  const resize=new ResizeObserver(sizeImage);resize.observe(viewport);
  dialog.append(close,viewport,notice);shadow.append(style,dialog);document.body.append(host);
  function dismiss(){if(!host.isConnected)return;resize.disconnect();dialog.close();host.remove();viewer=null;if(item.link.isConnected)item.link.focus({preventScroll:true});}
  close.onclick=dismiss;dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  dialog.addEventListener('click',event=>{if(event.target===dialog||event.target===viewport)dismiss();});
  try{dialog.showModal();sizeImage();}catch{resize.disconnect();host.remove();return;}
  viewer=dismiss;root.remove();close.focus();
  void chrome.runtime.sendMessage({type:'instagramNagDismissed'}).catch(()=>{});
 }
 chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.instagramNags||changes.instagramPreviews||changes.enabled))void refresh();});
 chrome.runtime.onMessage.addListener(message=>{if(message?.type==='stopInstagramNags')stop();});
 void refresh();
})();
