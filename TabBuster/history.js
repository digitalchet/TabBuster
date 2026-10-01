"use strict";
const notifications=document.getElementById("notifications");
async function renderHistory(){
 const {notify=true,recentClosed=[]}=await chrome.storage.local.get({notify:true,recentClosed:[]});
 notifications.checked=notify;
 const list=document.getElementById("history");list.replaceChildren();
 if(!recentClosed.length){const item=document.createElement("li");item.textContent="No tabs closed yet.";list.append(item);}
 for(const entry of recentClosed){
  const item=document.createElement("li"),text=document.createElement("span"),time=document.createElement("small");
  time.textContent=new Date(entry.at).toLocaleString();text.append(time,document.createTextNode(entry.url));item.append(text);list.append(item);
 }
}
notifications.onchange=()=>chrome.storage.local.set({notify:notifications.checked}).catch(()=>{document.getElementById("status").textContent="Could not save notification preference.";});
document.getElementById("clear-history").onclick=()=>chrome.storage.local.set({recentClosed:[]}).catch(()=>{document.getElementById("status").textContent="Could not clear recent history.";});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==="local"&&(changes.notify||changes.recentClosed))renderHistory().catch(()=>{});});
renderHistory().catch(()=>{document.getElementById("status").textContent="Could not load recent closures.";});
const closeOnAdd=document.getElementById("close-on-add");
chrome.storage.local.get({closeOnAdd:true}).then(s=>{closeOnAdd.checked=s.closeOnAdd;});
closeOnAdd.onchange=()=>chrome.storage.local.set({closeOnAdd:closeOnAdd.checked}).catch(()=>{document.getElementById("status").textContent="Could not save close-on-add preference.";});
const celebrate=document.getElementById("celebrate");
chrome.storage.local.get({celebrate:true}).then(s=>{celebrate.checked=s.celebrate;});
celebrate.onchange=()=>chrome.storage.local.set({celebrate:celebrate.checked}).catch(()=>{document.getElementById("status").textContent="Could not save celebration preference.";});
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area!=="local")return;
 if(changes.closeOnAdd)closeOnAdd.checked=changes.closeOnAdd.newValue;
 if(changes.celebrate)celebrate.checked=changes.celebrate.newValue;
});
