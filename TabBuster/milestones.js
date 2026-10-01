"use strict";
function isMilestone(total) {
 return [1,50,100,250,500].includes(total) || (total>=1000 && total%1000===0);
}

