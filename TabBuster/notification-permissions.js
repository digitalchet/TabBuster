"use strict";
const toastAccess={permissions:["scripting"],origins:["http://*/*","https://*/*"]};
const toastSwitch=document.getElementById("in-browser");
const permissionStatus=document.getElementById("permission-status");
let changingPermission=false;
async function refreshToastPermission(){
 const allowed=await chrome.permissions.contains(toastAccess);
 toastSwitch.checked=allowed;
 permissionStatus.textContent=allowed
  ?"Enabled. Website access can be revoked by turning this switch off."
  :"Off. Windows notifications remain available. Turn on to request website access.";
}
// The callback form supports browsers with differing Promise implementations.
// Invoke request synchronously in the actual user click, without awaiting storage.
function changeToastPermission(enabling){
 return new Promise((resolve,reject)=>{
  const callback=granted=>{
   const error=chrome.runtime.lastError;
   if(error)reject(new Error(error.message));else resolve(granted);
  };
  try{
   if(enabling)chrome.permissions.request(toastAccess,callback);
   else chrome.permissions.remove(toastAccess,callback);
  }catch(error){reject(error);}
 });
}
toastSwitch.disabled=true;
toastSwitch.addEventListener("click",()=>{
 if(changingPermission)return;
 changingPermission=true;toastSwitch.disabled=true;
 const enabling=!toastSwitch.checked;
 changeToastPermission(enabling).then(async granted=>{
  await refreshToastPermission();
  if(enabling&&!granted)permissionStatus.textContent="Permission was not granted. Windows notifications and tab closing still work.";
 }).catch(async()=>{
  try{await refreshToastPermission();}catch{}
  permissionStatus.textContent="Could not change access. Try again from this Settings tab; check TabBuster's details on the browser Extensions page if no prompt appears.";
 }).finally(()=>{changingPermission=false;toastSwitch.disabled=false;});
});
chrome.permissions.onAdded.addListener(()=>{if(!changingPermission)refreshToastPermission().catch(()=>{});});
chrome.permissions.onRemoved.addListener(()=>{if(!changingPermission)refreshToastPermission().catch(()=>{});});
refreshToastPermission().catch(()=>{permissionStatus.textContent="Could not check website access. Reopen Settings to retry.";}).finally(()=>{toastSwitch.disabled=false;});
async function refreshNoticeResult(){
 const {lastNoticeResult}=await chrome.storage.session.get("lastNoticeResult");
 document.getElementById("notice-diagnostic").textContent=lastNoticeResult
  ?"Last notification ("+new Date(lastNoticeResult.at).toLocaleTimeString()+"): "+lastNoticeResult.message
  :"No notification result recorded this session. Try closing a listed page, then check here.";
}
chrome.storage.onChanged.addListener((changes,area)=>{if(area==="session"&&changes.lastNoticeResult)refreshNoticeResult().catch(()=>{});});
refreshNoticeResult().catch(()=>{});
