"use strict";
const pauseSwitch=document.getElementById("pause");
const pauseStatus=document.getElementById("pause-status");
let closingEnabled=true;
function renderPause(enabled){
 closingEnabled=enabled;pauseSwitch.checked=!enabled;
 pauseStatus.textContent=enabled?"Protection is active.":"Paused. Close current tab still works when adding.";
}
pauseSwitch.onchange=async()=>{
 const previous=closingEnabled;
 pauseSwitch.disabled=true;
 try{
  const enabled=!pauseSwitch.checked;
  await chrome.storage.local.set({enabled});renderPause(enabled);
 }catch{renderPause(previous);pauseStatus.textContent="Could not save the change. Please try again.";}
 finally{pauseSwitch.disabled=false;}
};
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==="local"&&changes.enabled)renderPause(changes.enabled.newValue!==false);
});
chrome.storage.local.get({enabled:true}).then(({enabled})=>{
 renderPause(enabled);pauseSwitch.disabled=false;
}).catch(()=>{pauseStatus.textContent="Could not read protection status. Reopen the menu to retry.";});
