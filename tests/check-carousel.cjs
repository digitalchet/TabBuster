const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
const source=fs.readFileSync((process.env.TABBUSTER_APP||process.cwd()+'/TabBuster')+'/carousel-background.js','utf8');
 let connect,handler,disconnect,removed=[],resolveScript;const responses=[];
 const chrome={runtime:{onMessage:{addListener:()=>{},removeListener:()=>{}},id:'test',onConnect:{addListener:fn=>connect=fn}},storage:{local:{get:async()=>({instagramNags:true,instagramPreviews:true,enabled:true})}},permissions:{contains:async()=>true},tabs:{create:async options=>{assert.equal(options.active,false);return {id:77};},get:async()=>({status:'complete'}),remove:async id=>removed.push(id)},scripting:{executeScript:async()=>[{result:{slides:[{src:'https://scontent.cdninstagram.com/a.jpg'}]}}]}};
 vm.runInNewContext(source,{chrome,URL,setTimeout,clearTimeout,setInterval,clearInterval,instagramAccess:{}});
 const port=()=>({name:'instagram-carousel',sender:{id:'test',frameId:0,url:'https://www.instagram.com/example/',tab:{id:1,windowId:2}},onMessage:{addListener:fn=>handler=fn},onDisconnect:{addListener:fn=>disconnect=fn},postMessage:m=>responses.push(m),disconnect:()=>{}});
 connect(port());await handler({url:'https://www.instagram.com/example/p/ABC/'});assert.deepEqual(removed,[77]);assert(responses[0].ok);
 removed=[];chrome.scripting.executeScript=async()=>{throw Error('failed');};connect(port());await handler({url:'https://www.instagram.com/example/p/ABC/'});assert.deepEqual(removed,[77]);assert.equal(responses.at(-1).ok,false);
 removed=[];chrome.scripting.executeScript=()=>new Promise(resolve=>resolveScript=resolve);connect(port());const running=handler({url:'https://www.instagram.com/example/p/ABC/'});while(!resolveScript)await new Promise(r=>setTimeout(r,5));disconnect();resolveScript([]);await running;assert.deepEqual(removed,[77]);
 console.log('PASS: inactive carousel tab and cleanup on success, failure and disconnect.');
})().catch(e=>{console.error(e);process.exitCode=1;});
