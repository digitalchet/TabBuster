"use strict";
(()=>{
 if(globalThis.__tabBusterInstagram)return;
 globalThis.__tabBusterInstagram=true;
 let observer,active=false,pending=false;
 const signature="|click||input||keydown||keyup||change|";
 function findOverlay(dialog){
  const text=e=>(e.textContent||"").trim();
  if(!dialog.querySelector('[role="img"][aria-label="Illustration of see this story upsell"]'))return;
  if(![...dialog.querySelectorAll('span')].some(e=>text(e)==="Continue watching"))return;
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
   const root=findOverlay(dialog);if(!root||!root.isConnected)continue;
   root.remove();
   void chrome.runtime.sendMessage({type:"instagramNagDismissed"}).catch(()=>{});
  }
 }
 function stop(){active=false;observer?.disconnect();}
 async function refresh(){
  try{
   const s=await chrome.storage.local.get({instagramNags:false,enabled:true});
   stop();if(!s.instagramNags||!s.enabled)return;
   active=true;
   observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(scan);}});
   observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['role','aria-modal','aria-label','aria-hidden','data-interactable'],characterData:true});
   scan();
  }catch{stop();}
 }
 chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.instagramNags||changes.enabled))void refresh();});
 chrome.runtime.onMessage.addListener(message=>{if(message?.type==='stopInstagramNags')stop();});
 void refresh();
})();
