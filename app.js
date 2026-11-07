'use strict';
const $=s=>document.querySelector(s),canvas=$('#scene'),ctx=canvas.getContext('2d'),img=new Image();
const atlas=new Image();let atlasReady=false;atlas.onload=()=>{atlasReady=true};atlas.src='actors.png';
const W=1400,H=945,target={x:397,y:694,rx:14,ry:20};
let width=1,height=1,base=1,scale=1,ox=0,oy=0,moving=!matchMedia('(prefers-reduced-motion: reduce)').matches,found=false,ready=false,elapsed=0,last=performance.now(),phase=0,hints=0,hintUntil=0,miss=null;
const pointers=new Map();let gesture=null;
function fit(){base=Math.min(width/W,height/H);scale=base;ox=(width-W*scale)/2;oy=(height-H*scale)/2;label()}
function label(){$('#zoom').textContent=Math.round(scale/base*100)+'%'}
function clamp(){ox=W*scale<=width?(width-W*scale)/2:Math.max(width-W*scale,Math.min(0,ox));oy=H*scale<=height?(height-H*scale)/2:Math.max(height-H*scale,Math.min(0,oy))}
function zoom(f,x=width/2,y=height/2){const n=Math.max(base,Math.min(base*5,scale*f));ox=x-(x-ox)*n/scale;oy=y-(y-oy)*n/scale;scale=n;clamp();label()}
function resize(){const b=canvas.getBoundingClientRect();width=b.width;height=b.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);fit()}
new ResizeObserver(resize).observe(canvas);
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function pair(){const p=[...pointers.values()];return{distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}}
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);const p=point(e);pointers.set(e.pointerId,p);gesture={start:p,last:p,travel:0,multi:pointers.size>1};if(pointers.size===2)gesture.pair=pair()};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId)||!gesture)return;const p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const n=pair(),old=gesture.pair||n;zoom(n.distance/Math.max(1,old.distance),old.x,old.y);ox+=n.x-old.x;oy+=n.y-old.y;clamp();gesture.pair=n;gesture.multi=true}else{const dx=p.x-gesture.last.x,dy=p.y-gesture.last.y;gesture.travel+=Math.hypot(dx,dy);ox+=dx;oy+=dy;clamp()}gesture.last=p};
canvas.onpointerup=e=>{if(!gesture)return;const g=gesture,p=point(e);pointers.delete(e.pointerId);if(!g.multi&&g.travel<7&&ready)pick((p.x-ox)/scale,(p.y-oy)/scale);if(!pointers.size)gesture=null;else{gesture.multi=true;gesture.last=[...pointers.values()][0]}};
canvas.onpointercancel=e=>{pointers.delete(e.pointerId);gesture=null};
canvas.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoom(Math.exp(-e.deltaY*.0015),p.x,p.y)},{passive:false});
canvas.onkeydown=e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')zoom(1.25);else if(e.key==='-')zoom(.8);else{ox+=e.key==='ArrowLeft'?60:e.key==='ArrowRight'?-60:0;oy+=e.key==='ArrowUp'?60:e.key==='ArrowDown'?-60:0;clamp()}}};
function say(t){$('#message').textContent=t}
function fmt(t){const s=Math.floor(t);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function pick(x,y){if(interactActor(x,y))return;if(found)return;if(((x-target.x)/target.rx)**2+((y-target.y)/target.ry)**2<=1){found=true;$('#score').textContent='1 / 1';$('#result').textContent=fmt(elapsed)+' 만에 발견 · 힌트 '+hints+'회';$('#win').hidden=false;say('월리를 찾았습니다! 움직이는 캠핑장을 더 둘러보세요.')}else if(x>=0&&x<=W&&y>=0&&y<=H){miss={x,y,until:performance.now()+700};say('아직 월리가 아니에요. 모자와 안경을 함께 찾아보세요.')}}
function reset(){found=false;elapsed=0;hints=0;hintUntil=0;miss=null;$('#score').textContent='0 / 1';$('#win').hidden=true;fit();say('그림을 확대해 작은 표정을 살펴보세요.')}
$('#plus').onclick=()=>zoom(1.4);$('#minus').onclick=()=>zoom(1/1.4);$('#fit').onclick=fit;$('#reset').onclick=reset;$('#again').onclick=reset;$('#continue').onclick=()=>$('#win').hidden=true;
function motionLabel(){$('#motion').textContent=moving?'❚❚ 움직임 멈추기':'▶ 움직임 재생';$('#motion').setAttribute('aria-pressed',String(moving))}motionLabel();$('#motion').onclick=()=>{moving=!moving;motionLabel()};
$('#hint').onclick=()=>{if(found)return;hints++;if(hints===1)say('힌트: 강 아래쪽, 텐트들이 모여 있는 곳을 살펴보세요.');else{say('힌트: 파란 텐트 뒤에서 모자가 살짝 보입니다.');hintUntil=performance.now()+5000;scale=base*2.2;ox=width/2-target.x*scale;oy=height/2-target.y*scale;clamp();label()}};
// Each character uses six independently drawn poses. No background deformation.
const actors=[
 {id:'coffee',name:'커피 마시는 사람',row:0,x:679,y:567,h:58,period:5.8,offset:0,sy:0,sh:265},
 {id:'dog',name:'냄새 맡는 강아지',row:1,x:698,y:603,h:29,period:3.4,offset:1,sy:290,sh:172},
 {id:'wave',name:'손 흔드는 사람',row:2,x:1122,y:346,h:54,period:4.2,offset:2,sy:480,sh:265},
 {id:'guitar',name:'기타 치는 사람',row:3,x:586,y:735,h:53,period:1.7,offset:.4,sy:750,sh:274}
];
let activeActor=null,actorUntil=0;
const sequences=[[0,0,0,1,2,3,3,3,4,5,0,0],[0,1,2,2,2,3,4,5,4,3,1,0],[0,0,1,2,3,4,3,4,3,2,1,0],[0,1,2,3,4,5,4,3,2,1,0,0]];
function actorFrame(a){const seq=sequences[a.row],t=(phase+a.offset)%a.period;return seq[Math.floor(t/a.period*seq.length)%seq.length]}
function actorRect(a){const w=a.h*256/a.sh;return {x:a.x-w/2,y:a.y-a.h,w,h:a.h}}
function animation(){if(!atlasReady)return;for(const a of [...actors].sort((a,b)=>a.y-b.y)){const r=actorRect(a),f=actorFrame(a);ctx.drawImage(atlas,f*256,a.sy,256,a.sh,r.x,r.y,r.w,r.h);if(activeActor===a.id&&performance.now()<actorUntil){ctx.strokeStyle='#bd6636';ctx.lineWidth=1.5/scale;ctx.beginPath();ctx.ellipse(a.x,a.y+2,r.w*.37,4,0,0,Math.PI*2);ctx.stroke()}}}
function focusActor(id){const a=actors.find(a=>a.id===id);if(!a)return;activeActor=id;actorUntil=performance.now()+6000;scale=base*3.2;ox=width/2-a.x*scale;oy=height/2-(a.y-a.h/2)*scale;clamp();label();say(a.name+' · 눌러서 동작을 다시 시작할 수 있어요.');moving=true;motionLabel()}
for(const b of document.querySelectorAll('[data-actor]'))b.onclick=()=>focusActor(b.dataset.actor);
function interactActor(x,y){const a=actors.find(a=>{const r=actorRect(a);return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h});if(!a)return false;a.offset=-phase;activeActor=a.id;actorUntil=performance.now()+3500;moving=true;motionLabel();say(a.name+'의 동작을 다시 시작했어요.');return true}
let original=false;
$('#compare').onclick=()=>{original=!original;ready=false;img.src=original?'campsite.jpg':'campsite-remaster.png';$('#compare').textContent=original?'리마스터 보기':'원본과 비교';say(original?'기존 1,400 × 945 원본':'선명하게 다시 그린 리마스터 · 1,526 × 1,030')};
function draw(now){const dt=Math.min((now-last)/1000,.1);last=now;if(ready&&!document.hidden){if(!found)elapsed+=dt;if(moving)phase+=dt}ctx.clearRect(0,0,width,height);if(ready){ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.drawImage(img,0,0,W,H);animation();if(hintUntil>now){ctx.strokeStyle='#e1a947';ctx.lineWidth=3/scale;ctx.setLineDash([8/scale,7/scale]);ctx.beginPath();ctx.arc(420,680,100,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}if(found){ctx.strokeStyle='#e34239';ctx.lineWidth=3/scale;ctx.beginPath();ctx.arc(target.x,target.y,23,0,Math.PI*2);ctx.stroke()}if(miss&&miss.until>now){ctx.strokeStyle='#d9493d';ctx.lineWidth=2/scale;ctx.beginPath();ctx.arc(miss.x,miss.y,10/scale,0,Math.PI*2);ctx.stroke()}ctx.restore()}$('#time').textContent=fmt(elapsed);requestAnimationFrame(draw)}
img.onload=()=>{ready=true;$('#loading').hidden=true;if(scale===1)resize()};img.onerror=()=>say('배경 로드에 실패했습니다. 새로고침해 주세요.');img.src='campsite-remaster.png';requestAnimationFrame(draw);
