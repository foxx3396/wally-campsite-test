const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),ctx=new Proxy({},{get:()=>()=>{}});
function element(s){if(!elements.has(s))elements.set(s,{textContent:'',hidden:true,setAttribute(){},addEventListener(){},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1000,height:675}),setPointerCapture(){}});return elements.get(s)}
const box={document:{querySelector:element,querySelectorAll:()=>[],hidden:false},Image:class {set src(v){this.onload()}},ResizeObserver:class{constructor(fn){this.fn=fn}observe(){this.fn()}},matchMedia:()=>({matches:false}),performance:{now:()=>1000},devicePixelRatio:1,requestAnimationFrame:()=>{}};
vm.createContext(box);vm.runInContext(fs.readFileSync('app.js','utf8'),box);
const run=s=>vm.runInContext(s,box);
run('zoom(3);ox-=120;oy-=70;clamp()');
let p=run('({x:target.x*scale+ox,y:target.y*scale+oy})');
const c=element('#scene');c.onpointerdown({pointerId:1,clientX:p.x,clientY:p.y});c.onpointerup({pointerId:1,clientX:p.x,clientY:p.y});assert.equal(run('found'),true);assert.equal(element('#score').textContent,'1 / 1');
run('reset();pick(20,20)');assert.equal(run('found'),false);
run('zoom(100)');assert.equal(run('scale/base'),5);run('zoom(.0001)');assert.equal(run('scale/base'),1);
element('#hint').onclick();element('#hint').onclick();assert.equal(run('hints'),2);assert.equal(run('scale/base'),2.2);
run('reset();moving=false;draw(1100)');assert.equal(run('phase'),0);run('moving=true;draw(1200)');assert.ok(run('phase')>0);
run('reset()');p=run('({x:target.x*scale+ox,y:target.y*scale+oy})');c.onpointerdown({pointerId:1,clientX:p.x,clientY:p.y});c.onpointermove({pointerId:1,clientX:p.x+30,clientY:p.y});c.onpointerup({pointerId:1,clientX:p.x,clientY:p.y});assert.equal(run('found'),false);
console.log('PASS: transformed hit, miss, zoom limits, hints, motion pause, drag exclusion');
for(let n=0;n<4;n++){const frames=new Set();for(let i=0;i<60;i++)frames.add(run(`phase=${i}/10;actorFrame(actors[${n}])`));assert.ok(frames.size>=5)}
run("focusActor('coffee')");assert.equal(run('scale/base'),3.2);assert.equal(run('moving'),true);
run('reset();pick(679,540)');assert.equal(run('found'),false);assert.equal(run('activeActor'),'coffee');
assert.ok(!fs.readFileSync('app.js','utf8').includes('function flutter'));
element('#compare').onclick();assert.equal(run('original'),true);element('#compare').onclick();assert.equal(run('original'),false);
console.log('PASS: 4 distinct pose sequences, character focus/interaction, original comparison, no warp');
