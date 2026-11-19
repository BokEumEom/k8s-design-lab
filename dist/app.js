'use strict';
const $ = (selector) => document.querySelector(selector);
const main = $('#main');
const labels = { learn:'학습', lab:'실습', quiz:'퀴즈', ref:'치트시트' };
const lessons = groups.flatMap(([group, number, color, items]) => items.map(([id,title,summary,nodes,url,rawSteps], index) => ({
  id,title,summary,nodes:nodes.split(','),url,group,number,color,index,total:items.length,
  steps:rawSteps.map(raw => { const [label,heading,body,key,override] = raw.split('|'); return {label,heading,body,key,nodes:override?.split(',')}; })
})));
const byId = new Map(lessons.map(lesson => [lesson.id,lesson]));
function readSetting(key, fallback) {
  try { return JSON.parse(localStorage.getItem('kube-signal-'+key)) ?? fallback; } catch { return fallback; }
}
function writeSetting(key,value) {
  try { localStorage.setItem('kube-signal-'+key,JSON.stringify(value)); } catch {}
}
function escapeHTML(value='') {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
const done = new Set(readSetting('done',[]).filter(id => byId.has(id)));
const openGroups = new Set();
const labState = {cpu:84, target:60, capacity:2, scheduler:'required', zone:'a', path:'/sessions', canary:10, routeState:'healthy', incident:'kafka', signal:'metrics', autoscaler:'karpenter', drift:'drift', selfHeal:false};
const quizChoices = new Map(Object.entries(readSetting('quiz-v2',{})));
const quizCategories = new Map(groups.map(([title,id,color,items]) => [
  id,{id,title,color,questions:items.map(([lesson])=>questions.find(question=>question[0]===lesson))}
]));
const quizLink = (id,index=0) => '#/quiz/'+id+'/'+(index+1);
const legacyQuizLinks=['probes','affinity','node-scale','reference','envoy-nlb','argocd','identity','tracing'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let route, paused = reduce.matches;

function setTheme(value) {
  document.documentElement.dataset.theme=value;
  $('#theme').textContent=value==='dark'?'☀':'☾';
  $('#theme').setAttribute('aria-label',value==='dark'?'밝은 테마':'어두운 테마');
  writeSetting('theme',value);
}
setTheme(readSetting('theme','light'));
const lessonLink = (id, step=1) => '#/learn/'+id+'/'+step;
function go(hash) {
  if (location.hash===hash) return;
  location.hash=hash;
}
function parseRoute() {
  const [, mode, code, step] = location.hash.slice(1).split('/');
  if (mode==='lab') return {mode,code:Object.hasOwn(labInfo,code)?code:'hpa'};
  if (mode==='quiz') {
    const category=quizCategories.get(code);
    if(category) return {mode,category,index:Math.min(category.questions.length-1,Math.max(0,(Math.trunc(Number(step))||1)-1))};
    const oldLesson=byId.get(legacyQuizLinks[Number(code)-1]);
    if(oldLesson) {
      const oldCategory=quizCategories.get(oldLesson.number);
      return {mode,category:oldCategory,index:oldCategory.questions.findIndex(q=>q[0]===oldLesson.id)};
    }
    return {mode};
  }
  if (mode==='ref') return {mode};
  const lesson=byId.get(code)||lessons[0];
  return {mode:'learn',lesson,step:Math.min(lesson.steps.length-1,Math.max(0,(Math.trunc(Number(step))||1)-1))};
}
function sidebar() {
  const outline=$('#outline'), scroll=outline.scrollTop;
  outline.innerHTML=groups.map(([group,number,color,items])=>{
    const active = openGroups.has(number);
    const count=items.filter(([id])=>done.has(id)).length;
    return '<section style="--group:'+color+'"><button class="group-btn" data-group="'+number+'" aria-expanded="'+active+'"><span class="caret">'+(active?'▾':'▸')+'</span><span class="group-dot"></span><span>'+group+'</span><span class="group-count">'+count+'/'+items.length+'</span></button>'+
      (active?items.map(([id,title])=>'<a class="lesson-nav '+(route.lesson?.id===id?'active':'')+'" '+(route.lesson?.id===id?'aria-current="page"':'')+' href="'+lessonLink(id)+'"><span>'+(done.has(id)?'✓':'▱')+'</span>'+escapeHTML(title)+'</a>').join(''):'')+'</section>';
  }).join('');
  outline.scrollTop=scroll;
  $('#lessonCount').textContent=lessons.length+'개 강의';
  $('#progressText').textContent=done.size+' / '+lessons.length;
  $('#progressFill').style.width=100*done.size/lessons.length+'%';
}
function header(crumb,title,summary,chips=[]) {
  return '<div class="heading"><div><div class="crumb">'+escapeHTML(crumb)+'</div><h1>'+escapeHTML(title)+'</h1><p>'+escapeHTML(summary)+'</p></div><div class="chips">'+chips.map(([value,kind])=>'<span class="chip '+(kind||'')+'">'+escapeHTML(value)+'</span>').join('')+'</div></div>';
}
function isoBlock(x,y,label,index,state) {
  const palettes={
    live:['#dcf7e6','#9cdbb7','#70b99a','#245d45','#122d22'],
    idle:['#e9eee3','#cdd8c9','#acbeaf','#688377','#314539'],
    fault:['#ffeddb','#efc39f','#da9a77','#994a39','#67352a']
  };
  const [top,left,right,stroke,ink]=palettes[state];
  const kind=/Pod|container/i.test(label)?'cube':/server|node|ec2|etcd|Kafka|DB|CSI|PVC/i.test(label)?'server':/yaml|Git|kubectl|Chart/i.test(label)?'file':'grid';
  const marks={
    cube:'<path d="M0 -51 15 -43 0 -35 -15 -43Z M-15 -43v16L0 -19l15 -8v-16M0 -35v16"/>',
    server:'<path d="M-16 -47h32v9h-32zM-16 -34h32v9h-32zM-10 -42h1M-10 -29h1M-4 -42h12M-4 -29h12"/>',
    file:'<path d="M-12 -51h16l8 8v23h-24zM4 -51v8h8M-7 -37h14M-7 -31h14M-7 -25h9"/>',
    grid:'<path d="M-14 -34h28M0 -48v27M-5 -52h10v9h-10zM-19 -39h10v10h-10zM9 -39h10v10H9zM-5 -25h10v9h-10z"/>'
  };
  const words=label.split(' '), split=label.length>16&&words.length>1;
  const first=split?words.slice(0,Math.ceil(words.length/2)).join(' '):label;
  const second=split?words.slice(Math.ceil(words.length/2)).join(' '):'';
  return '<g transform="translate('+x+' '+y+')">'+
    '<ellipse cx="0" cy="9" rx="52" ry="18" fill="#1c4b3618"/>'+
    '<path d="M-43 -4 0 16 43 -4v13L0 31-43 9Z" fill="'+left+'" stroke="'+stroke+'" stroke-width="1.4" stroke-linejoin="round"/>'+
    '<path d="M0 16 43 -4v13L0 31Z" fill="'+right+'" stroke="'+stroke+'" stroke-width="1.4" stroke-linejoin="round"/>'+
    '<path d="M-43 -4 0 -25 43 -4 0 16Z" fill="'+top+'" stroke="'+stroke+'" stroke-width="1.4" stroke-linejoin="round"/>'+
    '<rect x="-26" y="-63" width="52" height="54" rx="9" fill="'+top+'" stroke="'+stroke+'" stroke-width="1.5"/>'+
    '<g fill="none" stroke="'+stroke+'" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+marks[kind]+'</g>'+
    '<circle cx="21" cy="-58" r="4" fill="'+(state==='fault'?'#e98558':state==='live'?'#35a477':'#a2b3a6')+'" stroke="'+top+'" stroke-width="1.25"/>'+
    '<rect x="-62" y="41" width="124" height="32" rx="8" fill="'+top+'" stroke="'+stroke+'" stroke-width="1" opacity=".98"/>'+
    '<text x="0" y="'+(split?'54':'61')+'" text-anchor="middle" fill="'+ink+'" font-family="ui-monospace,monospace" font-size="'+(first.length>17?'9':'11')+'" font-weight="700">'+escapeHTML(first)+'</text>'+
    (second?'<text x="0" y="67" text-anchor="middle" fill="'+ink+'" font-family="ui-monospace,monospace" font-size="10">'+escapeHTML(second)+'</text>':'')+
    '<text x="0" y="-75" text-anchor="middle" fill="currentColor" opacity=".62" font-family="ui-monospace,monospace" font-size="10">'+String(index+1).padStart(2,'0')+'</text></g>';
}
function diagram(nodes,focus,failed=-1) {
  const positions = {
    2:[[245,229],[515,192]],
    3:[[164,235],[381,191],[600,223]],
    4:[[126,238],[297,169],[467,233],[636,164]],
    5:[[116,233],[248,152],[380,215],[512,147],[644,223]],
    6:[[102,235],[214,145],[326,217],[438,140],[550,222],[662,149]]
  }[nodes.length];
  const lines=positions.slice(1).map(([x,y],i)=>{
    const [px,py]=positions[i], next=i+1;
    const path='M '+(px+37)+' '+(py-10)+' C '+(px+79)+' '+(py-11)+', '+(x-74)+' '+(y-20)+', '+(x-38)+' '+(y-10);
    const active = next<=focus;
    return '<path d="'+path+'" fill="none" stroke="'+(next===failed?'#cf6b52':active?'#419870':'#819b8c')+'" stroke-width="'+(active?'2.9':'1.25')+'" stroke-dasharray="'+(active?'5 4':'3 5')+'" opacity="'+(active?'.92':'.56')+'" marker-end="url(#arr)"/>'+
      (next===focus && !reduce.matches?'<circle r="4.6" fill="'+(next===failed?'#f39a75':'#62d5a0')+'" stroke="#245840" stroke-width="1"><animateMotion dur="2.1s" repeatCount="indefinite" path="'+path+'"/></circle>':'');
  }).join('');
  return '<svg id="motion" viewBox="0 0 760 345" role="img" aria-label="'+escapeHTML(nodes.join(' → '))+'"><defs>'+
    '<pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .41 -1 .41 0 0)"><path d="M36 0H0V36" fill="none" stroke="#639780" stroke-width="1" opacity=".38"/></pattern>'+
    '<radialGradient id="fade"><stop offset="20%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient><mask id="plane"><ellipse cx="380" cy="202" rx="374" ry="154" fill="url(#fade)"/></mask>'+
    '<marker id="arr" markerWidth="5" markerHeight="5" orient="auto" refX="4" refY="2.5"><path d="M0 0 5 2.5 0 5z" fill="#539378"/></marker></defs>'+
    '<rect x="0" y="40" width="760" height="300" fill="url(#grid)" mask="url(#plane)"/>'+
    '<path d="M48 69h21m-21 0v20M712 69h-21m21 0v20M48 307h21m-21 0v-20M712 307h-21m21 0v-20" fill="none" stroke="#83a895" opacity=".45"/>'+
    lines+positions.map(([x,y],i)=>isoBlock(x,y,nodes[i],i,i===failed?'fault':i<=focus?'live':'idle')).join('')+'</svg>';
}
function scene(nodes,focus,failed=-1) {
  return '<div class="board-scene"><span class="scene-corner">TOPOLOGY / REQUEST FLOW</span>'+diagram(nodes,focus,failed)+'<span class="figure-caption">K8S DESIGN LAB</span></div>';
}
function lessonPage(lesson,step) {
  const current=lesson.steps[step];
  const [example,verification]=stepDetails[lesson.id][step];
  const visual=lessonScene(lesson,step);
  const controls=visual.includes('<animateMotion')?'<div class="board-actions"><button class="button" data-action="replay">↻ 다시 재생</button><button class="button" data-action="pause">'+(paused?'▷ 재생':'Ⅱ 일시정지')+'</button></div>':'';
  const final=step===lesson.steps.length-1, completed=done.has(lesson.id);
  const nextLesson=lessons[lessons.indexOf(lesson)+1];
  const options=lesson.steps.map(({label},index)=>'<button class="step '+(index===step?'active':index<step?'past':'')+'" '+(index===step?'aria-current="step"':'')+' data-step="'+index+'"><b>'+(index+1)+'</b><span>'+escapeHTML(label)+'</span></button>').join('');
  const labsForLesson = {hpa:'hpa',affinity:'affinity','node-scale':'hpa',gateway:'route','envoy-nlb':'route',metrics:'incident',logging:'incident',tracing:'incident',argocd:'gitops','eks-ops':'incident'};
  const lab = labsForLesson[lesson.id];
  const nextText = final?(completed?(nextLesson?'다음 강의 →':'장애 실습 →'):'강의 완료 ✓'):'다음 · '+currentNextLabel(lesson,step);
  main.innerHTML=(lesson.id==='cluster'&&step===0?'<p class="mobile-tagline">그림과 실습으로 배우는 Kubernetes와 AWS EKS</p>':'')+header(lesson.number+' / '+lesson.group+'  ·  '+(lesson.index+1)+'/'+lesson.total,lesson.title,lesson.summary,[[lesson.steps.length+' STEPS','mint'],[Number(lesson.number)>3?'운영':'핵심']])+
    '<div class="workspace expanded-lesson"><div class="visual-stack"><div class="board"><div class="board-top"><div><span class="board-index">단계별 시각 설명</span><strong>'+visualNames[Number(lesson.number)-1]+'</strong></div>'+controls+'</div>'+visual+'</div>'+
    '<section class="timeline"><div class="timeline-head"><span>강의 타임라인</span><span>STEP '+(step+1)+' / '+lesson.steps.length+'</span></div><div class="steps">'+options+'</div></section></div>'+
    '<div class="guide-stack"><article class="guide"><div class="eyebrow">STEP '+String(step+1).padStart(2,'0')+' / '+lesson.steps.length+'</div><h2>'+escapeHTML(current.heading)+'</h2><p>'+escapeHTML(current.body)+'</p>'+
    '<section class="lesson-detail"><h3>예시로 이해하기</h3><p>'+escapeHTML(example)+'</p><h3>직접 확인하기</h3><p>'+escapeHTML(verification)+'</p></section>'+
    (current.key?'<div class="key-idea"><span>운영 포인트</span>'+escapeHTML(current.key)+'</div>':'')+
    '</article>'+
    '<section class="objectives"><div class="eyebrow">강의에서 다룰 내용</div><ul>'+lesson.steps.map(({heading},i)=>'<li><span>'+(i<step||completed?'✓':i===step?'▣':'□')+'</span>'+escapeHTML(heading)+'</li>').join('')+'</ul><a href="'+lesson.url+'" target="_blank" rel="noopener">공식 문서 ↗</a>'+
    (lab?' <a class="lesson-lab" href="#/lab/'+lab+'">실습 열기 →</a>':'')+
    (lesson.id==='node-scale'?' <a class="lesson-lab" href="'+lessonLink('karpenter')+'">Karpenter 생성 과정 보기 →</a>':'')+
    ' <a class="lesson-lab" href="'+quizLink(lesson.number,lesson.index)+'">이 강의의 퀴즈 →</a></section></div></div>'+
    '<nav class="lesson-dock" aria-label="학습 단계 이동"><div class="guide-nav"><button class="button" data-action="back" '+(!step?'disabled':'')+'>← 이전</button><button class="primary" data-action="next">'+escapeHTML(nextText)+'</button></div>'+
    '<div class="keyhelp"><kbd>←</kbd> <kbd>→</kbd> 단계'+(controls?' · <kbd>R</kbd> 다시 재생 · <kbd>Space</kbd> 정지':'')+'</div></nav>';
  applyMotion();
}
const currentNextLabel = (lesson,step) => lesson.steps[step+1].label+' →';
function applyMotion() {
  const svg=$('#motion');
  if(paused||reduce.matches) svg?.pauseAnimations?.();
  else svg?.unpauseAnimations?.();
}
function nextStep() {
  const {lesson,step}=route;
  if(step<lesson.steps.length-1) return go(lessonLink(lesson.id,step+2));
  if(!done.has(lesson.id)) {
    done.add(lesson.id);
    writeSetting('done',[...done]);
    sidebar();
    lessonPage(lesson,step);
    main.querySelector('[data-action=next]').focus();
    return;
  }
  const next=lessons[lessons.indexOf(lesson)+1];
  go(next?lessonLink(next.id):'#/lab/incident');
}
const labInfo={
  hpa:['HPA와 노드 확장','CPU 사용률을 높이고 Pod 확장과 노드 확장의 경계를 확인합니다.'],
  affinity:['스케줄링','노드 라벨과 배치 조건을 바꿔 스케줄러의 후보를 비교합니다.'],
  route:['NLB · Envoy · HTTPRoute','경로, 카나리 비중, Route 상태를 바꿔 요청 결과를 비교합니다.'],
  incident:['장애 추적','한 CSMS 요청의 메트릭, 로그, 스팬과 Kubernetes 이벤트를 대조합니다.'],
  gitops:['GitOps 드리프트','Git과 EKS 실상태가 다를 때 Argo CD가 어떻게 조정하는지 확인합니다.']
};
function selectField(key,label,options) {
  return '<label>'+label+'<select data-setting="'+key+'">'+options.map(([value,text])=>'<option value="'+value+'" '+(labState[key]===value?'selected':'')+'>'+text+'</option>').join('')+'</select></label>';
}
function slider(key,label,min,max) {
  return '<label>'+label+' <strong id="'+key+'Value">'+labState[key]+'%</strong><input aria-label="'+label+'" type="range" min="'+min+'" max="'+max+'" value="'+labState[key]+'" data-setting="'+key+'"></label>';
}
function labPage(code) {
  const [title,summary]=labInfo[code];
  const controls={
    hpa:()=>slider('cpu','CPU 사용률',10,180)+slider('target','목표 사용률',30,90)+selectField('capacity','현재 스케줄 가능 Pod 수',[[2,'2개'],[4,'4개'],[8,'8개']])+selectField('autoscaler','노드 확장 방식',[['karpenter','Karpenter'],['ca','Cluster Autoscaler'],['off','미구성']]),
    affinity:()=>selectField('scheduler','Node affinity',[['required','Required'],['preferred','Preferred']])+selectField('zone','희망 AZ',[['a','ap-northeast-2a'],['c','ap-northeast-2c'],['d','ap-northeast-2d (노드 없음)']]),
    route:()=>selectField('path','요청 경로',[['/sessions','/sessions'],['/billing','/billing'],['/other','/other']])+slider('canary','세션 API 카나리 가중치',0,100)+selectField('routeState','장애 주입',[['healthy','정상'],['denied','Route 결합 실패'],['backend','업스트림 엔드포인트 없음'],['nlb','NLB 타깃 비정상']]),
    incident:()=>selectField('incident','장애 시나리오',[['normal','정상 트래픽'],['kafka','Kafka 응답 지연'],['readiness','Readiness 실패'],['capacity','노드 용량 부족']]),
    gitops:()=>selectField('drift','EKS 실상태',[['drift','이미지 태그 수동 변경'],['sync','Git과 일치']])+'<label>자동 Self Heal<input type="checkbox" data-setting="selfHeal" '+(labState.selfHeal?'checked':'')+'></label><button class="primary" data-action="sync">Git 상태로 동기화</button>'
  };
  main.innerHTML=header('실습 / 가상 EKS 환경',title,summary,[['시뮬레이션','mint']])+
    '<nav class="lab-top" aria-label="실습 목록">'+Object.entries(labInfo).map(([key,[name]])=>'<button data-lab="'+key+'" class="pill-button '+(key===code?'active':'')+'" aria-pressed="'+(key===code)+'">'+name+'</button>').join('')+'</nav>'+
    '<div class="lab-grid"><section class="panel"><h2>실습 설정</h2><div class="lab-controls">'+controls[code]()+'</div><div id="labDiagram"></div></section><section class="panel"><h2>실행 결과</h2><div id="labOutput" aria-live="polite"></div></section></div>';
  updateLab(code);
}
function status(title,bad=false) {return '<div class="signal-status '+(bad?'bad':'')+'">'+escapeHTML(title)+'</div>';}
const detail = text => '<p>'+escapeHTML(text)+'</p>';
const stat = pairs => '<div class="signals">'+pairs.map(([label,value])=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>').join('')+'</div>';
const pre = (text) => '<pre><code>'+escapeHTML(text)+'</code></pre>';
function hpaLab() {
  const {cpu,target,capacity,autoscaler}=labState;
  const desired=Math.max(1,Math.min(8,Math.ceil(2*cpu/target)));
  const pending=Math.max(0,desired-capacity);
  const name=autoscaler==='ca'?'Cluster Autoscaler':autoscaler==='karpenter'?'Karpenter':'Autoscaler off';
  const nodes=pending?['Metrics API','HPA','Pending Pod',name,'EC2 Node']:['Metrics API','HPA','Deployment','Ready Pod'];
  const body=status(pending?pending+'개 Pod가 배치 대기 중':'모든 Pod를 배치할 수 있습니다',pending>0)+stat([['초기 replicas',2],['희망 replicas',desired],['배치 대기',pending]])+
    pre('ceil(2 × '+cpu+' ÷ '+target+') → '+desired+'  (최소 1 / 최대 8)')+
    detail(pending?(autoscaler==='off'?'노드가 추가되지 않아 Pending 상태가 지속됩니다.':name+'가 배치 조건을 충족하는 용량 추가를 검토합니다. 실제 노드 준비와 Pod 배치에는 시간이 걸립니다.'):'현재 노드 용량으로 희망 replica 수를 수용할 수 있습니다.')+
    detail('이 실습은 기본 산식만 적용합니다. 실제 HPA의 허용 오차, 안정화 및 확장 정책은 강의에서 확인할 수 있습니다.')+'<a class="button" href="'+lessonLink('node-scale')+'">노드 확장 강의 →</a>';
  return [nodes,pending&&autoscaler==='off'?3:nodes.length-1,pending?2:-1,body];
}
function affinityLab() {
  const {scheduler,zone}=labState;
  const pending=scheduler==='required'&&zone==='d';
  const winner=zone==='c'?'ap-northeast-2c':'ap-northeast-2a';
  return [['Pod','Scheduler','Affinity',pending?'FailedScheduling':winner],3,pending?3:-1,
    status(pending?'Pending · FailedScheduling':'Scheduled · '+winner,pending)+
    detail('후보 노드는 ap-northeast-2a와 ap-northeast-2c에 있습니다. '+(pending?'필수 영역과 일치하는 노드가 없습니다.':zone==='d'?'선호 조건이 일치하는 노드가 없어도 다른 후보에 배치할 수 있습니다.':'희망 영역에 있는 노드가 선택됩니다.'))+
    pre('kubectl describe pod csms-api -n charging\nkubectl get nodes -L topology.kubernetes.io/zone')];
}
function routeLab() {
  const {path,canary,routeState}=labState;
  const session=path==='/sessions', match=session||path==='/billing';
  const nlb=routeState==='nlb', denied=routeState==='denied', unavailable=routeState==='backend';
  const response=nlb?'TCP 연결 실패 (이 실습의 NLB 상태)':!match||denied?'HTTP 404 · 일치하는 Route 없음':unavailable?'HTTP 503 · healthy upstream 없음':'HTTP 200 · 요청 전달';
  const end=session?'Sessions Service':path==='/billing'?'Billing Service':'No match';
  const code=nlb?1:denied||!match?3:4;
  return [['Client','AWS NLB','Envoy Proxy','HTTPRoute',end],code,response.startsWith('HTTP 200')?-1:code,
    status(response,!response.startsWith('HTTP 200'))+
    pre('GET '+path+'  Host: csms.example\n'+(nlb?'NLB TargetGroup: unhealthy':'Gateway: Programmed=True\nHTTPRoute: Accepted='+(denied?'False':'True')+' · ResolvedRefs=True'))+
    detail(session&&routeState==='healthy'?'매칭된 세션 요청의 가중치: stable '+(100-canary)+' / canary '+canary+'. 이 비율은 요청 한 건의 결과를 확정하지 않습니다.':nlb?'AWS 대상 그룹을 먼저 확인합니다. 일부 NLB 상태와 설정에서는 fail-open 동작이 발생할 수 있습니다.':unavailable?'ResolvedRefs=True라도 준비된 엔드포인트가 없을 수 있습니다.':'Host, 경로와 리스너 연결 조건을 비교합니다.')+
    '<a class="button" href="'+lessonLink('envoy-nlb')+'">NLB 구성 강의 →</a>'];
}
const incidents={
  normal:{title:'정상 · 세션 API',values:['120','0.1%','82 ms'],trace:[4,28,22,11],nodes:['NLB','Envoy','CSMS API','Kafka'],bad:-1,log:'INFO trace_id=61ab09 result=accepted latency_ms=65',event:'Normal  ScalingReplicaSet  replicas=3, available=3',trend:[78,71,74,80,83,74,78,82]},
  kafka:{title:'저하 · Kafka 응답 지연',values:['116','8.2%','1,240 ms'],trace:[5,8,22,1200],nodes:['NLB','Envoy','CSMS API','Kafka'],bad:3,log:'ERROR trace_id=61ab09 component=kafka event=publish_timeout elapsed_ms=1200',event:'Normal  ScalingReplicaSet  replicas=3, available=3',trend:[78,72,85,134,810,1180,1100,1240]},
  readiness:{title:'저하 · 준비된 엔드포인트 없음',values:['120','100%','15 ms'],trace:[4,11,0,0],nodes:['NLB','Envoy','Service','EndpointSlice'],bad:3,log:'WARN trace_id=61ab09 status=503 response_flags=UH upstream=none',event:'Warning  Unhealthy  Readiness probe failed: HTTP 503',trend:[77,77,76,73,54,19,17,15]},
  capacity:{title:'저하 · 새 Pod 배치 대기',values:['244','6.1%','680 ms'],trace:[4,18,30,600],nodes:['Envoy','CSMS API','HPA','Pending Pod'],bad:3,log:'WARN trace_id=61ab09 event=worker_queue_delay elapsed_ms=600',event:'Warning  FailedScheduling  0/2 nodes available: Insufficient cpu',trend:[78,88,130,188,330,420,575,680]}
};
function chart(trend) {
  const width=445, height=123, points=trend.map((value,i)=>[24+i*(width-48)/(trend.length-1),104-value/1300*84]);
  const coords=points.map(p=>p.join(',')).join(' ');
  return '<svg class="chart" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="p95 8개 표본, 밀리초: '+trend.join(', ')+'"><path d="M24 18H421M24 61H421M24 104H421" stroke="currentColor" opacity=".13"/><polygon points="24,104 '+coords+' 421,104" fill="#75bb9960"/><polyline points="'+coords+'" fill="none" stroke="#48a67e" stroke-width="2.8"/><text x="26" y="15" font-size="9" fill="currentColor">p95 · 0–1300 ms</text><text x="375" y="118" font-size="9" fill="currentColor">현재</text></svg>';
}
const signalNames={metrics:'메트릭',log:'로그',trace:'트레이스',event:'이벤트'};
function incidentLab() {
  const info=incidents[labState.incident], signal=labState.signal;
  const spans=['Client → NLB','Envoy Proxy','CSMS API',labState.incident==='capacity'?'Worker queue':'Kafka publish'];
  const spanTotal=info.trace.reduce((a,b)=>a+b,0);
  let elapsed=0;
  const tabs=Object.entries(signalNames).map(([key,title])=>'<button data-signal="'+key+'" class="pill-button '+(signal===key?'active':'')+'" aria-pressed="'+(signal===key)+'">'+title+'</button>').join(' ');
  const signals={
    metrics:()=>stat([['req/s',info.values[0]],['오류율',info.values[1]],['p95',info.values[2]]])+chart(info.trend),
    log:()=>pre(info.log),
    trace:()=>'<div class="tiny">TRACE 61ab09 · '+spanTotal+'ms</div>'+info.trace.map((ms,i)=>{
      const offset=100*elapsed/spanTotal;
      elapsed+=ms;
      if(!ms) return '<div class="trace-row"><span>'+spans[i]+'</span><span>호출 없음</span><span>—</span></div>';
      return '<div class="trace-row"><span>'+spans[i]+'</span><span class="trace-track"><span class="trace-bar '+(ms>400?'bad':'')+'" style="margin-left:'+offset+'%;width:'+Math.max(1.5,ms/spanTotal*100)+'%"></span></span><span>'+ms+'ms</span></div>';
    }).join(''),
    event:()=>pre(info.event)
  };
  return [info.nodes,3,info.bad,status(info.title,info.bad>=0)+'<div class="lab-top signal-tab" aria-label="관측 신호">'+tabs+'</div>'+signals[signal]()+detail('이 요청의 trace ID는 61ab09입니다. Kubernetes 이벤트는 같은 시나리오의 클러스터 상태를 보여줍니다.')];
}
function gitopsLab() {
  const {drift,selfHeal}=labState;
  const sync=drift==='sync';
  return [['Git main','Argo CD','Rendered YAML','EKS'],3,sync?-1:3,
    status(sync?'Synced · Git에 선언한 이미지와 일치':'OutOfSync · 실상태의 이미지 태그 변경',!sync)+
    pre('Git image: csms-api:v1.4.2\nEKS image: csms-api:'+ (sync?'v1.4.2':'manual-hotfix')+'\nSelf Heal: '+(selfHeal?'enabled':'disabled'))+
    detail(sync?'Argo CD의 동기화가 Git의 선언을 기준으로 적용됩니다. Healthy 여부는 워크로드 상태로 별도로 판단합니다.':'Self Heal을 활성화하거나 동기화 버튼으로 선언된 이미지 태그를 적용할 수 있습니다.')];
}
const labActions={hpa:hpaLab,affinity:affinityLab,route:routeLab,incident:incidentLab,gitops:gitopsLab};
function updateLab(code) {
  const [nodes,focus,bad,body]=labActions[code]();
  $('#labDiagram').innerHTML=scene(nodes,focus,bad);
  $('#labOutput').innerHTML=body;
  applyMotion();
}
function saveQuiz() {
  writeSetting('quiz-v2',Object.fromEntries(quizChoices));
}
function quizStats(category) {
  return category.questions.reduce((stats,[id,,,,correct])=>{
    if(quizChoices.has(id)) stats.answered++;
    if(quizChoices.get(id)===correct) stats.correct++;
    return stats;
  },{answered:0,correct:0});
}
function quizHome() {
  main.innerHTML=header('퀴즈 / 모듈 선택','Kubernetes 퀴즈','복습할 모듈을 고르세요. 모든 문제에서 답의 근거가 나오는 학습 단계로 돌아갈 수 있습니다.',[[questions.length+'문제','mint']])+
    '<div class="quiz-grid">'+[...quizCategories.values()].map(category=>{
      const {answered,correct}=quizStats(category);
      const next=category.questions.findIndex(([id])=>!quizChoices.has(id));
      return '<a class="quiz-category" style="--category-color:'+category.color+'" href="'+quizLink(category.id,Math.max(0,next))+'"><span class="eyebrow">MODULE '+category.id+'</span><h2>'+escapeHTML(category.title)+'</h2><p>'+category.questions.length+'문제 · '+answered+'개 풀이 · '+correct+'개 정답</p><span class="quiz-start">'+(next<0?'결과 보기':answered?'계속 풀기':'퀴즈 시작')+' →</span></a>';
    }).join('')+'</div>';
}
function quizPage(category,index) {
  if(!category) return quizHome();
  const [lesson,step,question,answers,correct,explanation]=category.questions[index];
  const picked=quizChoices.get(lesson);
  const score=quizStats(category);
  const count=category.questions.length;
  main.innerHTML=header('퀴즈 / 모듈 '+category.id,category.title,'문제를 풀고 해설에서 관련 학습 단계를 확인하세요.',[[score.correct+' / '+count+' 정답','mint']])+
    '<a class="quiz-back" href="#/quiz">← 전체 모듈</a>'+
    '<article class="quiz-card"><div class="quiz-card-top"><div class="eyebrow">문제 '+(index+1)+' / '+count+'</div><button class="button quiz-reset" data-action="resetQuiz" '+(!score.answered?'disabled':'')+'>이 모듈 다시 풀기</button></div><h2>'+escapeHTML(question)+'</h2>'+
    '<nav class="quiz-steps" aria-label="문제 번호">'+category.questions.map(([id,,,,key],i)=>'<a class="'+(quizChoices.has(id)?(quizChoices.get(id)===key?'correct':'wrong'):'')+'" href="'+quizLink(category.id,i)+'" '+(index===i?'aria-current="step"':'')+'>'+(i+1)+'</a>').join('')+'</nav>'+
    '<div class="answers">'+answers.map((answer,i)=>'<button data-answer="'+i+'" class="button '+(picked!==undefined?(i===correct?'correct':i===picked?'wrong':''):'')+'" '+(picked!==undefined?'disabled':'')+'>'+escapeHTML(answer)+(picked!==undefined&&i===correct?' <span class="answer-mark">✓ 정답</span>':'')+(picked===i&&i!==correct?' <span class="answer-mark">선택한 답</span>':'')+'</button>').join('')+'</div>'+
    (picked===undefined?'':'<div id="quizFeedback" tabindex="-1" aria-live="polite">'+status(picked===correct?'정답입니다':'정답을 확인하세요',picked!==correct)+detail(explanation)+'<a class="button" href="'+lessonLink(lesson,step)+'">해설과 연결된 학습 단계 →</a></div>')+
    '<div class="quiz-footer">'+(index?'<a class="button" href="'+quizLink(category.id,index-1)+'">← 이전 문제</a>':'<button class="button" disabled>← 이전 문제</button>')+
    (index<count-1?'<a class="primary" href="'+quizLink(category.id,index+1)+'">다음 문제 →</a>':'<a class="primary" href="#/quiz">모듈 목록 →</a>')+'</div></article>';
}
const sheets=[
 ['HPA 매니페스트 · CPU 60%','hpa',`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: csms-api
  namespace: charging
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: csms-api
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60`],
 ['Helm 차트 템플릿 예제','helm',`# Chart.yaml
apiVersion: v2
name: csms
version: 0.1.0
---
# values.yaml
servicePort: 8080
---
# templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-api
spec:
  selector:
    app: csms-api
  ports:
    - port: {{ .Values.servicePort }}
      targetPort: http`],
 ['Argo CD Application 예제','argocd',`apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: csms-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://git.example/platform/apps.git
    targetRevision: main
    path: charts/csms
    helm:
      valueFiles: [values-prod.yaml]
  destination:
    server: https://kubernetes.default.svc
    namespace: charging
  syncPolicy:
    automated:
      selfHeal: true`],
 ['클러스터와 워크로드','cluster','kubectl get deploy,rs,pod,svc -n charging\nkubectl rollout status deploy/csms-api -n charging\nkubectl get events -n charging --sort-by=.metadata.creationTimestamp'],
 ['스케줄러와 어피니티','affinity','kubectl describe pod POD -n charging\nkubectl get nodes -L topology.kubernetes.io/zone\nkubectl get pod -n charging -o wide'],
 ['스케일링 · HPA · 노드','hpa','kubectl get hpa -n charging\nkubectl describe hpa csms-api -n charging\nkubectl top pods -n charging\nkubectl get nodeclaims  # Karpenter 설치 환경'],
 ['Gateway 및 Route 상태','gateway','kubectl get gatewayclass\nkubectl describe gateway edge -n infra\nkubectl describe httproute csms -n charging\nkubectl get endpointslice -n charging -l kubernetes.io/service-name=csms-api'],
 ['HTTPRoute 매니페스트 예제','gateway',`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: csms
  namespace: charging
spec:
  parentRefs:
    - name: edge
      namespace: infra
      sectionName: https
  hostnames: [csms.example]
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /sessions
      backendRefs:
        - name: csms-api
          port: 8080
          weight: 90
        - name: csms-canary
          port: 8080
          weight: 10`],
 ['Envoy Proxy Service · AWS NLB','envoy-nlb',`# EnvoyProxy 설정 일부 · AWS LBC 방식
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        type: LoadBalancer
        annotations:
          service.beta.kubernetes.io/aws-load-balancer-type: external
          service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
          service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing`],
 ['로그 · 메트릭 · 트레이스','logging','kubectl logs POD -c app --previous -n charging\nkubectl get events -n charging --field-selector type=Warning\n# Prometheus에서 5분 p95 (HTTP histogram 계측 예)\nhistogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))\n# Loki에서 trace ID 검색\n{app="csms-api"} | json | trace_id="61ab09"'],
 ['Helm 차트 검증','helm','helm lint ./chart\nhelm template csms ./chart -f values-prod.yaml --namespace charging\nhelm history csms -n charging'],
 ['Argo CD 동기화 점검','argocd','argocd app get csms-prod\nargocd app diff csms-prod\nkubectl get applications -n argocd'],
 ['EKS Add-ons · Pod Identity','identity','aws eks list-addons --cluster-name my-eks\naws eks list-pod-identity-associations --cluster-name my-eks\naws eks list-access-entries --cluster-name my-eks\nkubectl get serviceaccount csms-api -n charging -o yaml']
];
function sheetsPage() {
  main.innerHTML=header('치트시트 / 운영 명령','Kubernetes 운영 치트시트','가상 CSMS 환경 기준입니다. 예제의 리소스명과 컨트롤러별 설정을 실제 환경에 맞춰 확인하세요.')+
   '<div class="sheets">'+sheets.map(([title,lesson,code],index)=>'<section class="sheet-card"><div class="code-head"><h2>'+title+'</h2><button class="button" data-copy="'+index+'">복사</button></div>'+pre(code)+'<a href="'+lessonLink(lesson)+'">관련 강의 ↗</a></section>').join('')+'</div>';
}
function showSearch() {
  $('#searchDialog').showModal();
  $('#query').value='';
  search('');
  $('#query').focus();
}
function search(query) {
  const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const hits=lessons.filter(l=>{
    const text=[l.id,l.title,l.group,l.summary,...l.steps.flatMap(s=>[s.heading,s.body])].join(' ').toLocaleLowerCase();
    return terms.every(term=>text.includes(term));
  });
  $('#results').innerHTML=hits.length?hits.map(l=>'<a href="'+lessonLink(l.id)+'">'+escapeHTML(l.title)+'<small>'+escapeHTML(l.group)+'</small></a>').join(''):'<p>일치하는 강의가 없습니다.</p>';
}
function menu(open) {
  $('#sidebar').classList.toggle('open',open);
  $('#menu').setAttribute('aria-expanded',String(open));
}
function render() {
  const previous=route;
  const dockAction=document.activeElement?.closest('.lesson-dock button')?.dataset.action;
  route=parseRoute();
  if(route.lesson) openGroups.add(route.lesson.number);
  document.querySelectorAll('[data-mode]').forEach(button=>{
    const active=button.dataset.mode===route.mode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  sidebar();
  if(route.mode==='learn') lessonPage(route.lesson,route.step);
  if(route.mode==='lab') labPage(route.code);
  if(route.mode==='quiz') quizPage(route.category,route.index);
  if(route.mode==='ref') sheetsPage();
  document.title=(route.lesson?.title||labels[route.mode])+' · K8s Design Lab';
  if(previous&&(previous.mode!==route.mode||previous.lesson?.id!==route.lesson?.id||previous.code!==route.code||previous.category!==route.category||previous.step!==route.step)) window.scrollTo(0,0);
  if(dockAction&&route.mode==='learn') {
    const button=main.querySelector('[data-action="'+dockAction+'"]:not(:disabled)')||main.querySelector('.lesson-dock [data-action=next]');
    button?.focus({preventScroll:true});
  }
}
function action(id) {
  if(id==='replay') {
    $('#motion')?.setCurrentTime?.(0);
    paused=false;
    applyMotion();
    const pause=main.querySelector('[data-action=pause]');
    if(pause) pause.textContent='Ⅱ 일시정지';
  }
  if(id==='pause') {
    paused=!paused;
    applyMotion();
    const pause=main.querySelector('[data-action=pause]');
    if(pause) pause.textContent=paused?'▷ 재생':'Ⅱ 일시정지';
  }
  if(id==='back'&&route.step>0) go(lessonLink(route.lesson.id,route.step));
  if(id==='next'&&route.mode==='learn') nextStep();
  if(id==='sync') {labState.drift='sync';labPage('gitops');}
  if(id==='resetQuiz') {
    for(const [lesson] of route.category.questions) quizChoices.delete(lesson);
    saveQuiz();
    if(route.index===0) quizPage(route.category,0);
    else go(quizLink(route.category.id));
  }
}
document.addEventListener('click',async event=>{
  const el=event.target.closest('button,a');
  if(!el) return;
  const {mode,group,step,action:pressed,lab,signal,answer,copy}=el.dataset;
  if(mode) {
    if(mode==='learn'&&route.mode==='learn') return;
    go(({learn:lessonLink('cluster'),lab:'#/lab/hpa',quiz:'#/quiz',ref:'#/ref'})[mode]);
    menu(false);
  }
  if(group) {
    if(openGroups.has(group)) openGroups.delete(group); else openGroups.add(group);
    sidebar();
    document.querySelector('[data-group="'+group+'"]').focus();
  }
  if(el.matches('.lesson-nav')) menu(false);
  if(el.closest('#results')&&el.tagName==='A') $('#searchDialog').close();
  if(step!==undefined) go(lessonLink(route.lesson.id,Number(step)+1));
  if(pressed) action(pressed);
  if(lab) go('#/lab/'+lab);
  if(signal) {labState.signal=signal;updateLab('incident');main.querySelector('[data-signal='+signal+']').focus();}
  if(answer!==undefined) {
    quizChoices.set(route.category.questions[route.index][0],Number(answer));
    saveQuiz();
    quizPage(route.category,route.index);
    $('#quizFeedback').focus();
  }
  if(copy!==undefined) {
    try {await navigator.clipboard.writeText(sheets[Number(copy)][2]);el.textContent='복사 완료';}
    catch {el.textContent='코드 선택 후 복사';}
    setTimeout(()=>{el.textContent='복사';},1800);
  }
});
main.addEventListener('input',event=>{
  const input=event.target, setting=input.dataset.setting;
  if(!setting||route.mode!=='lab') return;
  const value=input.type==='checkbox'?input.checked:input.type==='range'||setting==='capacity'?Number(input.value):input.value;
  labState[setting]=value;
  if(input.type==='range') $('#'+setting+'Value').textContent=value+'%';
  if(route.code==='gitops'&&labState.selfHeal&&labState.drift==='drift') {
    labState.drift='sync';
    main.querySelector('[data-setting=drift]').value='sync';
  }
  updateLab(route.code);
});
$('#search').addEventListener('click',showSearch);
$('#closeSearch').addEventListener('click',()=>$('#searchDialog').close());
$('#query').addEventListener('input',event=>search(event.target.value));
$('#theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
$('#menu').addEventListener('click',()=>menu(!$('#sidebar').classList.contains('open')));
document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k') {
    event.preventDefault();
    if(!$('#searchDialog').open) showSearch(); else $('#searchDialog').close();
    return;
  }
  if(event.key==='Escape') menu(false);
  if($('#searchDialog').open||route.mode!=='learn'||event.target.closest('input,select,textarea')||event.metaKey||event.ctrlKey||event.altKey) return;
  if(event.key==='ArrowRight') {event.preventDefault();action('next');}
  if(event.key==='ArrowLeft') {event.preventDefault();action('back');}
  if(event.key.toLowerCase()==='r') action('replay');
  if(event.key===' '&&!event.target.closest('button,a')) {event.preventDefault();action('pause');}
});
window.addEventListener('hashchange',render);
render();
