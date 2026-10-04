"use strict";
const DEFAULT_SETTINGS = {enabled:true,rules:["www.chromeactions.com","chromeactions.com"].map(host=>({mode:"page",host,path:"/scan-update-and-protect-your-browser.html"}))};
function makeRule(value,mode) {
 const text=value.trim();
 if(!text) throw new Error("Enter an address first.");
 const url=new URL(text.includes("://")?text:"https://"+text);
 if(!["http:","https:"].includes(url.protocol)||url.username||url.password||text.includes("*")||!url.hostname.includes(".")) throw new Error("Use a full HTTP or HTTPS website address without passwords or wildcards.");
 if(!["page","host"].includes(mode)) throw new Error("Choose a matching mode.");
 return {mode,host:url.host,path:mode==="page"?url.pathname:""};
}
function matchesRule(value,rule) {
 try {const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&url.host===rule.host&&(rule.mode==="host"||(rule.mode==="page"&&url.pathname===rule.path));}catch{return false;}
}

function isEmbeddedPage(value){return /^data:/i.test(value||"");}
async function embeddedFingerprint(value){
 // Match the exact serialized data URL, excluding navigation fragments.
 const canonical=new URL(value).href.split("#")[0];
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
async function tabIdentity(value){return isEmbeddedPage(value)?"data-sha256:"+await embeddedFingerprint(value):value;}
async function makeTabRule(value,mode){
 if(isEmbeddedPage(value)){
  if(mode!=="page")throw Error("Embedded pages have no hostname. Use Add page instead.");
  return {mode:"embedded",fingerprint:await embeddedFingerprint(value)};
 }
 return makeRule(value,mode);
}
async function matchesTabRules(value,rules){
 if(isEmbeddedPage(value)){
  if(!rules.some(r=>r.mode==="embedded"))return false;
  const fingerprint=await embeddedFingerprint(value);
  return rules.some(r=>r.mode==="embedded"&&r.fingerprint===fingerprint);
 }
 return rules.some(rule=>matchesRule(value,rule));
}
function sameRule(a,b){return a.mode===b.mode&&(a.mode==="embedded"?a.fingerprint===b.fingerprint:a.host===b.host&&a.path===b.path);}
