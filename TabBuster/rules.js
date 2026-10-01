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
