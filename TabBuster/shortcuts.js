"use strict";
async function refreshShortcutStatus(){
 try {
  const commands=await chrome.commands.getAll();
  document.getElementById("shortcut-bindings").textContent=commands.filter(c=>c.name==="add-page"||c.name==="add-host").map(c=>(c.name==="add-page"?"Add page: ":"Add hostname: ")+(c.shortcut||"Not assigned")).join(" · ");
  const {lastShortcut}=await chrome.storage.session.get("lastShortcut");
  document.getElementById("shortcut-status").textContent=lastShortcut?new Date(lastShortcut.at).toLocaleTimeString()+" — "+lastShortcut.message:"No shortcut received this session. Focus a website, press the shortcut, then check here.";
 }catch{document.getElementById("shortcut-status").textContent="Could not read shortcut status. Check that TabBuster is enabled and reload this Settings page.";}
}
chrome.storage.onChanged.addListener((_changes,area)=>{if(area==="session")void refreshShortcutStatus();});
window.addEventListener("focus",()=>void refreshShortcutStatus());
void refreshShortcutStatus();
