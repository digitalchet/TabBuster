"use strict";
// Self-contained: Chrome serializes this function into its isolated page world.
// It only creates its own UI; no page text, forms, cookies or storage are read.
function showClosureToast(site) {
 if(document.visibilityState !== "visible" || !document.documentElement) return false;
 const key="__tabBusterClosureToast";
 const previous=globalThis[key];
 const count=previous?.host?.isConnected ? previous.count+1 : 1;
 if(previous){clearTimeout(previous.timer);previous.host.remove();}
 const host=document.createElement("div");
 host.setAttribute("data-tabbuster-toast", "");
 const declarations={all:"initial",position:"fixed",inset:"auto 16px 16px auto",margin:"0",padding:"0",border:"0",width:"min(340px, calc(100vw - 32px))",height:"auto",background:"transparent",overflow:"visible","z-index":"2147483647","pointer-events":"auto","color-scheme":"dark"};
 for(const [property,value] of Object.entries(declarations))host.style.setProperty(property,value,"important");
 const shadow=host.attachShadow({mode:"closed"});
 const style=document.createElement("style");
 style.textContent=`
  :host{color-scheme:dark}
  *{box-sizing:border-box}
  .toast{position:relative;padding:14px 42px 14px 16px;border:1px solid #38536f;border-left:3px solid #69b7ff;border-radius:10px;background:#0f1e31;color:#f4f8ff;box-shadow:0 8px 28px #0006;font:13px/1.45 system-ui,sans-serif;text-align:left;direction:ltr;animation:arrive 160ms ease-out}
  .brand{color:#69b7ff;font-size:11px;font-weight:700;letter-spacing:.3px;margin:0 0 3px}
  .title{font-weight:650;margin:0 0 3px}
  .site{color:#b7c7dc;overflow-wrap:anywhere;margin:0;font-size:12px}
  button{position:absolute;top:9px;right:9px;width:26px;height:26px;border:0;border-radius:5px;background:transparent;color:#b7c7dc;font:20px/1 system-ui;cursor:pointer}
  button:hover{background:#18304a;color:#f4f8ff}button:focus-visible{outline:2px solid #69b7ff;outline-offset:2px}
  @keyframes arrive{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @media(prefers-reduced-motion:reduce){.toast{animation:none}}
 `;
 const toast=document.createElement("div");toast.className="toast";
 const status=document.createElement("div");status.setAttribute("role","status");status.setAttribute("aria-live","polite");status.setAttribute("aria-atomic","true");
 const brand=document.createElement("p");brand.className="brand";brand.textContent="TabBuster";
 const title=document.createElement("p");title.className="title";title.textContent=count===1?"Unwanted tab closed":count+" unwanted tabs closed";
 const detail=document.createElement("p");detail.className="site";detail.textContent=(count>1?"Latest: ":"")+site;
 const dismiss=document.createElement("button");dismiss.type="button";dismiss.textContent="×";dismiss.setAttribute("aria-label","Dismiss TabBuster notification");
 const state={host,count,timer:null};
 const remove=()=>{clearTimeout(state.timer);host.remove();if(globalThis[key]===state)delete globalThis[key];};
 dismiss.addEventListener("click",remove);
 status.append(brand,title,detail);toast.append(status,dismiss);shadow.append(style,toast);
 document.documentElement.append(host);
 // The top layer avoids most page overlays without stealing focus or being modal.
 try{host.setAttribute("popover","manual");host.showPopover();}catch{host.removeAttribute("popover");}
 state.timer=setTimeout(remove,5000);globalThis[key]=state;
 return true;
}

async function notifyClosure(current,url) {
 const site=current.incognito?"Private tab":url.hostname;
 let reason="The page was not ready to display the notice.", attempts=0;
 try {
  const allowed=await chrome.permissions.contains({permissions:["scripting"],origins:["http://*/*","https://*/*"]});
  if(!allowed){reason="In-browser website access is not enabled. Turn it on in Settings.";}
  else if(!chrome.scripting?.executeScript){reason="This browser did not expose the page-injection API.";}
  else {
   // Closing an active tab does not guarantee the next tab is visible yet.
   // Re-select each time; never inject into a tab that has become backgrounded.
   for(const delay of [0,150,300,500]){
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    attempts++;
    try {
     const window=await chrome.windows.getLastFocused({windowTypes:["normal"]});
     if(!window.focused||window.state==="minimized"){
      reason="The browser window was not focused or was minimized.";continue;
     }
     const [tab]=await chrome.tabs.query({active:true,windowId:window.id});
     if(!tab){reason="No active tab was available after the closure.";continue;}
     if(!/^https?:\/\//i.test(tab.url||"")){
      reason="The remaining tab is a browser page or another page that cannot host notices.";continue;
     }
     const results=await chrome.scripting.executeScript({target:{tabId:tab.id},func:showClosureToast,args:[site]});
     if(results?.some(item=>item.result===true)){
      await saveNoticeResult("In-browser notice displayed.",attempts);return;
     }
     reason="The page still reported itself as hidden or not ready after the tab closed.";
    }catch(error){
     const message=String(error?.message||error);
     if(/permission|cannot access|not allowed|extensions gallery|chrome web store/i.test(message)){
      reason="The browser denied access to this page. In Opera, check site access and Allow access to search page results.";
      break;
     }
     reason="The page changed or the browser could not insert the notice.";
    }
   }
  }
 }catch{reason="The browser could not check notification permissions.";}
 let delivery="Windows notification used.";
 try {
  await chrome.notifications.create("tabbuster-closed",{
   type:"basic",iconUrl:"assets/icon-128.png",title:"TabBuster closed a tab",
   message:current.incognito?"A matching private tab was closed.":site+" matched your closing list.",
   silent:true,requireInteraction:false
  });
 }catch{delivery="The desktop notification could not be delivered either.";}
 await saveNoticeResult(delivery+" "+reason,attempts);
}
async function saveNoticeResult(message,attempts){
 try{await chrome.storage.session.set({lastNoticeResult:{message,attempts,at:Date.now()}});}catch{}
}
