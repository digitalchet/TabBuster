"use strict";
const helpButton=document.getElementById("help-button");
const helpPanel=document.getElementById("help-panel");
const helpClose=document.getElementById("help-close");
let previousOverflow="";
function openHelp(){
 if(helpPanel.open)return;
 previousOverflow=document.documentElement.style.overflow;
 document.documentElement.style.overflow="hidden";
 helpPanel.showModal();helpPanel.scrollTop=0;
 helpButton.setAttribute("aria-expanded","true");helpClose.focus();
}
function restoreHelpState(){
 document.documentElement.style.overflow=previousOverflow;
 helpButton.setAttribute("aria-expanded","false");helpButton.focus({preventScroll:true});
}
function closeHelp(){if(helpPanel.open){helpPanel.close();restoreHelpState();}}
helpPanel.addEventListener("cancel",event=>{event.preventDefault();closeHelp();});
helpButton.addEventListener("click",openHelp);
helpClose.addEventListener("click",closeHelp);
helpPanel.addEventListener("close",()=>{
 if(!helpPanel.open)restoreHelpState();
});
let backdropDown=false;
function outsidePanel(event){const r=helpPanel.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;}
helpPanel.addEventListener("pointerdown",event=>{backdropDown=event.target===helpPanel&&outsidePanel(event);});
helpPanel.addEventListener("click",event=>{if(backdropDown&&event.target===helpPanel&&outsidePanel(event))closeHelp();backdropDown=false;});
// Native modal dialog supplies Escape, focus containment and inert background.
