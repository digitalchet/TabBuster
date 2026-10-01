"use strict";
importScripts("rules.js", "milestones.js", "toast.js");
// Serialize removals and writes: duplicate tab events cannot count twice,
// and simultaneous closures cannot overwrite one another's totals.
let queue = Promise.resolve();
function schedule(task) {
 const result = queue.then(task);
 queue = result.catch(error => console.debug("TabBuster:", error.message));
 return result;
}
async function closeIfUnwanted(tab, manual = false) {
 const settings = await chrome.storage.local.get({...DEFAULT_SETTINGS, notify:true, celebrate:true});
 if ((!settings.enabled && !manual) || !Number.isInteger(tab.id) || tab.id < 0) return false;
 let current;
 try { current = await chrome.tabs.get(tab.id); } catch { return; }
 const value = current.pendingUrl || current.url;
 const {keptTabs={}} = await chrome.storage.session.get({keptTabs:{}});
 if (!manual && keptTabs[current.id]) {
  if (keptTabs[current.id] === value) return;
  delete keptTabs[current.id];
  await chrome.storage.session.set({keptTabs});
 }
 if (!settings.rules.some(rule => matchesRule(value, rule))) return;
 try { await chrome.tabs.remove(tab.id); } catch { return; }
 const [local, session] = await Promise.all([
  chrome.storage.local.get({totalClosed:0, recentClosed:[]}),
  chrome.storage.session.get({sessionClosed:0})
 ]);
 const url = new URL(value);
 // Store no query strings, fragments, titles, credentials or private-window URLs.
 const entry = {url:current.incognito ? "Private tab" : url.origin + url.pathname, at:Date.now()};
 const total=local.totalClosed+1;
 const milestone=settings.celebrate && isMilestone(total);
 await chrome.storage.local.set({totalClosed:total,recentClosed:[entry,...local.recentClosed].slice(0,50),...(milestone?{pendingMilestone:total}:{})});
 await chrome.storage.session.set({sessionClosed:session.sessionClosed+1});
 if(milestone) {
  await updateMilestoneBadge();
  // Failure to open never loses the pending celebration or interrupts counting.
  void openMilestonePopup(current.windowId);
 }
 if (settings.notify) await notifyClosure(current,url);
 return true;
}
async function updateMilestoneBadge() {
 try {
  const {pendingMilestone=0,celebrate=true}=await chrome.storage.local.get({pendingMilestone:0,celebrate:true});
  await chrome.action.setBadgeBackgroundColor({color:"#69b7ff"});
  await chrome.action.setBadgeText({text:celebrate&&pendingMilestone?"★":""});
 }catch(error){console.debug("Badge unavailable:",error.message);}
}
async function openMilestonePopup(windowId) {
 try {
  const window=await chrome.windows.get(windowId);
  if(window.focused)await chrome.action.openPopup({windowId});
 }catch(error){console.debug("Celebration saved for next popup:",error.message);}
}
async function scanTabs() {
 for (const tab of await chrome.tabs.query({})) await closeIfUnwanted(tab);
}
chrome.tabs.onCreated.addListener(tab => { schedule(()=>closeIfUnwanted(tab)); });
chrome.tabs.onUpdated.addListener((_id,changes,tab)=>{
 if(changes.url||changes.status==="loading") schedule(()=>closeIfUnwanted(tab));
});
chrome.runtime.onInstalled.addListener(()=>{schedule(scanTabs);});
// storage.session survives worker suspension but clears on browser restart,
// extension reload, disable or update. Do not reset it on worker startup.
chrome.runtime.onStartup.addListener(()=>{schedule(scanTabs);});
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==="local" && (changes.rules||changes.enabled)) schedule(scanTabs);
});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(sender.id!==chrome.runtime.id) return;
 if(message?.type==="dismissMilestone") {
  schedule(async()=>{
   const {pendingMilestone=0}=await chrome.storage.local.get({pendingMilestone:0});
   if(pendingMilestone===message.milestone)await chrome.storage.local.set({pendingMilestone:0});
   await updateMilestoneBadge();return {ok:true};
  }).then(respond,error=>respond({ok:false,error:error.message}));
  return true;
 }
 if(message?.type!=="addCurrent")return;
 schedule(async()=>{
  const tab=await chrome.tabs.get(message.tabId);
  const rule=makeRule(tab.pendingUrl||tab.url,message.mode);
  const settings=await chrome.storage.local.get({...DEFAULT_SETTINGS,closeOnAdd:true});
  const {keptTabs={}}=await chrome.storage.session.get({keptTabs:{}});
  const closeNow=typeof message.closeCurrent==="boolean"?message.closeCurrent:settings.closeOnAdd;
  if(!closeNow) keptTabs[tab.id]=tab.pendingUrl||tab.url;
  else delete keptTabs[tab.id];
  await chrome.storage.session.set({keptTabs});
  if(!settings.rules.some(r=>r.mode===rule.mode&&r.host===rule.host&&r.path===rule.path))
   await chrome.storage.local.set({rules:[...settings.rules,rule]});
  const closed=closeNow?Boolean(await closeIfUnwanted(tab,true)):false;
  return {ok:true,closed,paused:!settings.enabled,kept:!closeNow};
 }).then(respond,error=>respond({ok:false,error:error.message}));
 return true;
});


chrome.tabs.onRemoved.addListener(id=>{schedule(async()=>{
 const {keptTabs={}}=await chrome.storage.session.get({keptTabs:{}});
 if(Object.hasOwn(keptTabs,id)){delete keptTabs[id];await chrome.storage.session.set({keptTabs});}
});});
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==="local" && (changes.celebrate||changes.pendingMilestone)) void updateMilestoneBadge();
});
void updateMilestoneBadge();