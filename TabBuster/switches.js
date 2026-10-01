"use strict";
// Native buttons provide Space/Enter behaviour. The checked accessor keeps
// storage binding shared with existing settings while exposing switch semantics.
for(const control of document.querySelectorAll('button[role="switch"]')){
 Object.defineProperty(control,"checked",{
  get(){return this.getAttribute("aria-checked")==="true";},
  set(value){this.setAttribute("aria-checked",String(Boolean(value)));}
 });
 if(control.dataset.permissionSwitch)continue;
 control.addEventListener("click",()=>{
  control.checked=!control.checked;
  control.dispatchEvent(new Event("change",{bubbles:true}));
 });
}

