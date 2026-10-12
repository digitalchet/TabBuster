"use strict";
const nagToggle=document.getElementById('instagram-nags');
const nagStatus=document.getElementById('nag-status');
const nagAccess={permissions:['scripting'],origins:['https://www.instagram.com/*']};
let nagBusy=false;
async function refreshNags(){
 const [s,allowed]=await Promise.all([chrome.storage.local.get({instagramNags:false,nagsDismissed:0,enabled:true}),chrome.permissions.contains(nagAccess)]);
 nagToggle.checked=s.instagramNags&&allowed;
 document.getElementById('nag-count').textContent=s.nagsDismissed.toLocaleString();
 nagStatus.textContent=nagToggle.checked?(s.enabled?'Enabled for the recognized English Instagram prompt.':'Paused with automatic tab closing.'):'Off. Enable to approve Instagram access.';
}
nagToggle.addEventListener('click',()=>{
 if(nagBusy)return;nagBusy=true;nagToggle.disabled=true;
 const enabling=!nagToggle.checked;
 const request=enabling?new Promise((resolve,reject)=>chrome.permissions.request(nagAccess,granted=>chrome.runtime.lastError?reject(Error(chrome.runtime.lastError.message)):resolve(granted))):Promise.resolve(true);
 request.then(async granted=>{
  if(granted)await chrome.storage.local.set({instagramNags:enabling});
  await refreshNags();if(!granted)nagStatus.textContent='Access was not approved. Nothing changed.';
 }).catch(()=>{nagStatus.textContent='Could not enable this feature. Check extension access and try again.';}).finally(()=>{nagBusy=false;nagToggle.disabled=false;});
});
chrome.storage.onChanged.addListener(()=>{if(!nagBusy)void refreshNags();});
chrome.permissions.onRemoved.addListener(()=>void refreshNags());
void refreshNags();
