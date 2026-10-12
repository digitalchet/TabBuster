"use strict";
const instagramAccess={permissions:["scripting"],origins:["https://www.instagram.com/*"]};
let nagSync=Promise.resolve();
function syncInstagramNags(){
 nagSync=nagSync.catch(()=>{}).then(async()=>{
  const s=await chrome.storage.local.get({instagramNags:false});
  const allowed=await chrome.permissions.contains(instagramAccess);
  const usable=s.instagramNags&&allowed;
  if(s.instagramNags&&!allowed)await chrome.storage.local.set({instagramNags:false});
  if(!chrome.scripting)return;
  const registered=await chrome.scripting.getRegisteredContentScripts({ids:['instagram-nags']});
  if(!usable&&registered.length)await chrome.scripting.unregisterContentScripts({ids:['instagram-nags']});
  if(usable&&!registered.length)await chrome.scripting.registerContentScripts([{id:'instagram-nags',matches:instagramAccess.origins,js:['instagram-nags.js'],runAt:'document_idle',persistAcrossSessions:true}]);
  for(const tab of await chrome.tabs.query({url:instagramAccess.origins})){
   try{
    if(usable)await chrome.scripting.executeScript({target:{tabId:tab.id},files:['instagram-nags.js']});
    else await chrome.tabs.sendMessage(tab.id,{type:'stopInstagramNags'});
   }catch{}
  }
 });
 void nagSync.catch(()=>console.debug('TabBuster: Instagram access could not be updated.'));
}
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.instagramNags)syncInstagramNags();});
chrome.permissions.onAdded.addListener(syncInstagramNags);
chrome.permissions.onRemoved.addListener(syncInstagramNags);
chrome.runtime.onMessage.addListener((message,sender)=>{
 if(message?.type!=='instagramNagDismissed'||sender.id!==chrome.runtime.id||sender.frameId!==0||!sender.tab)return;
 try{if(new URL(sender.url).origin!=='https://www.instagram.com')return;}catch{return;}
 void schedule(async()=>{
  const s=await chrome.storage.local.get({instagramNags:false,enabled:true,nagsDismissed:0});
  if(s.instagramNags&&s.enabled)await chrome.storage.local.set({nagsDismissed:s.nagsDismissed+1});
 });
});
syncInstagramNags();
