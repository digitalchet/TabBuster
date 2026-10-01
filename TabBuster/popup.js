"use strict";
const add=document.getElementById("add"),choose=document.getElementById("choose"),feedback=document.getElementById("feedback"),closeCurrent=document.getElementById("close-current");
let currentTab;
async function refreshCounts(){
 const [local,session]=await Promise.all([chrome.storage.local.get({totalClosed:0}),chrome.storage.session.get({sessionClosed:0})]);
 document.getElementById("total").textContent=local.totalClosed.toLocaleString();
 document.getElementById("session").textContent=session.sessionClosed.toLocaleString();
}
closeCurrent.onchange=async()=>{
 try{await chrome.storage.local.set({closeOnAdd:closeCurrent.checked});}
 catch{feedback.textContent="Could not save your preference. Your choice still applies to this click.";}
};
async function addCurrent(mode){
 add.disabled=choose.disabled=closeCurrent.disabled=document.getElementById("add-site").disabled=true;
 try{
  const result=await chrome.runtime.sendMessage({type:"addCurrent",tabId:currentTab.id,mode,closeCurrent:closeCurrent.checked});
  if(!result?.ok)throw Error(result?.error||"Could not add this tab.");
  feedback.textContent=result.closed?"Added and closed. One more successful defense.":result.kept?"Added to your list. This tab stays open.":"Rule added, but the tab could not be closed.";
  document.getElementById("site-menu").hidden=true;choose.setAttribute("aria-expanded","false");
  await refreshCounts();
 }catch(error){feedback.textContent=error.message;add.disabled=choose.disabled=closeCurrent.disabled=document.getElementById("add-site").disabled=false;}
}
add.onclick=()=>addCurrent("page");
document.getElementById("add-site").onclick=()=>addCurrent("host");
choose.onclick=()=>{const menu=document.getElementById("site-menu");menu.hidden=!menu.hidden;choose.setAttribute("aria-expanded",String(!menu.hidden));};
document.addEventListener("keydown",event=>{if(event.key==="Escape"){document.getElementById("site-menu").hidden=true;choose.setAttribute("aria-expanded","false");choose.focus();}});
document.getElementById("options").onclick=event=>{event.preventDefault();chrome.runtime.openOptionsPage();};
chrome.storage.onChanged.addListener((changes,area)=>{
 refreshCounts().catch(()=>{});
 if(area==="local"&&changes.closeOnAdd)closeCurrent.checked=changes.closeOnAdd.newValue;
});
(async()=>{
 add.disabled=choose.disabled=closeCurrent.disabled=true;
 await refreshCounts();
 const {closeOnAdd=true,enabled=true}=await chrome.storage.local.get({closeOnAdd:true,enabled:true});
 closeCurrent.checked=closeOnAdd;
 [currentTab]=await chrome.tabs.query({active:true,currentWindow:true});
 const value=currentTab?.pendingUrl||currentTab?.url||"";
 if(!/^https?:\/\//i.test(value)){feedback.textContent="Open a website to add it, or enter a URL in Options.";return;}
 add.disabled=choose.disabled=closeCurrent.disabled=false;

})().catch(()=>{feedback.textContent="Could not read this tab. Try reopening the menu.";});

