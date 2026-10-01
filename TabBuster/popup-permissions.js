"use strict";
(async()=>{
 const {toastInviteSeen=false,pendingMilestone=0}=await chrome.storage.local.get({toastInviteSeen:false,pendingMilestone:0});
 if(toastInviteSeen||pendingMilestone)return;
 const allowed=await chrome.permissions.contains({permissions:["scripting"],origins:["http://*/*","https://*/*"]});
 if(allowed)return;
 document.getElementById("toast-invitation").hidden=false;
 await chrome.storage.local.set({toastInviteSeen:true});
})().catch(()=>{});
document.getElementById("toast-settings").onclick=event=>{
 event.preventDefault();chrome.runtime.openOptionsPage();
};
document.getElementById("dismiss-invitation").onclick=()=>{document.getElementById("toast-invitation").hidden=true;};

