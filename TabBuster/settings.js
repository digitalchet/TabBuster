"use strict";
const list=document.getElementById("rules"),status=document.getElementById("status"),enabled=document.getElementById("enabled");
async function render(){
 const settings=await chrome.storage.local.get(DEFAULT_SETTINGS);
 enabled.checked=settings.enabled;list.replaceChildren();
 if(!settings.rules.length){const empty=document.createElement("li");empty.textContent="Your list is empty. Add an address above.";list.append(empty);}
 for(const rule of settings.rules){
  const item=document.createElement("li"),label=document.createElement("span"),mode=document.createElement("small"),remove=document.createElement("button");
  const name=rule.mode==="embedded"?"Embedded page · "+rule.fingerprint.slice(0,12):rule.host+rule.path;
  mode.textContent=rule.mode==="embedded"?"Exact embedded page":rule.mode==="host"?"Every page on hostname":"One page";
  label.append(mode,document.createTextNode(name));
  remove.textContent="Remove";remove.setAttribute("aria-label","Remove "+name);
  remove.onclick=async()=>{try{
   const current=await chrome.storage.local.get(DEFAULT_SETTINGS);
   await chrome.storage.local.set({rules:current.rules.filter(r=>JSON.stringify(r)!==JSON.stringify(rule))});
   await render();status.textContent="Removed from your list.";
  }catch{status.textContent="Could not save the change. Please try again.";}};
  item.append(label,remove);list.append(item);
 }
}
document.getElementById("add-form").onsubmit=async event=>{
 event.preventDefault();
 try{
  const address=document.getElementById("address"),rule=makeRule(address.value,document.getElementById("mode").value);
  const current=await chrome.storage.local.get(DEFAULT_SETTINGS);
  if(current.rules.some(r=>JSON.stringify(r)===JSON.stringify(rule))){status.textContent="That entry is already on your list.";return;}
  await chrome.storage.local.set({rules:[...current.rules,rule]});
  address.value="";await render();status.textContent="Added. Matching tabs will close while enabled.";
 }catch(error){status.textContent=error instanceof TypeError?"Enter a valid website address.":error.message;}
};
enabled.onchange=async()=>{try{await chrome.storage.local.set({enabled:enabled.checked});status.textContent=enabled.checked?"Automatic closing is on.":"Paused. Your list is saved.";}catch{status.textContent="Could not save the change.";await render();}};
chrome.storage.onChanged.addListener(()=>render().catch(()=>{}));
render().catch(()=>{status.textContent="Could not load settings. Reopen the extension to try again.";});
