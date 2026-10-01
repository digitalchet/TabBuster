"use strict";
let displayedMilestone=0;
const celebration=document.getElementById("celebration");
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
function buildCelebrationEffects(){
 const confetti=document.getElementById("confetti");
 const number=document.getElementById("milestone-number");
 confetti.replaceChildren();number.replaceChildren();
 const value=document.createElement("span");value.className="milestone-value";
 value.textContent=displayedMilestone.toLocaleString();number.append(value);
 if(reducedMotion.matches||!displayedMilestone||celebration.hidden)return;
 // A fixed particle pool loops entirely in CSS; no ongoing DOM growth or timers.
 for(let i=0;i<36;i++){
  const piece=document.createElement("i");
  piece.style.setProperty("--x",(Math.random()*100)+"%");
  piece.style.setProperty("--delay",(-Math.random()*3.8)+"s");
  piece.style.setProperty("--duration",(2.8+Math.random()*1.4)+"s");
  piece.style.setProperty("--drift",(Math.random()*90-45)+"px");
  piece.style.setProperty("--turn",(Math.random()*720-360)+"deg");
  piece.className="confetti-piece color-"+i%4;
  confetti.append(piece);
 }
 const sparks=document.createElement("span");sparks.className="milestone-sparks";sparks.setAttribute("aria-hidden","true");
 for(let i=0;i<10;i++){
  const angle=i*Math.PI/5;
  const spark=document.createElement("i");spark.className="milestone-spark";
  spark.style.setProperty("--spark-x",Math.cos(angle)*76+"px");
  spark.style.setProperty("--spark-y",Math.sin(angle)*40+"px");
  spark.style.setProperty("--spark-angle",angle+"rad");
  sparks.append(spark);
 }
 number.append(sparks);
}
async function refreshCelebration(){
 const {pendingMilestone=0,celebrate=true}=await chrome.storage.local.get({pendingMilestone:0,celebrate:true});
 if(!celebrate||!pendingMilestone){
  celebration.hidden=true;displayedMilestone=0;
  document.getElementById("confetti").replaceChildren();
  document.getElementById("milestone-number").replaceChildren();return;
 }
 if(displayedMilestone===pendingMilestone)return;
 displayedMilestone=pendingMilestone;celebration.hidden=false;
 document.getElementById("milestone-label").textContent=pendingMilestone===1?"Your first successful defense!":"Successful defenses. A quieter browser.";
 buildCelebrationEffects();
}
reducedMotion.addEventListener("change",()=>{if(displayedMilestone)buildCelebrationEffects();});
document.getElementById("dismiss-milestone").onclick=async()=>{
 try{
  await chrome.runtime.sendMessage({type:"dismissMilestone",milestone:displayedMilestone});
  await refreshCelebration();
 }catch{document.getElementById("feedback").textContent="Could not dismiss the milestone. Try again.";}
};
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==="local"&&(changes.pendingMilestone||changes.celebrate))refreshCelebration().catch(()=>{});
});
refreshCelebration().catch(()=>{});
