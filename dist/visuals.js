// The lesson scenes share a drawing vocabulary. Each renderer models a distinct kind of system.
const visualNames = ['클러스터 단면','노드 배치 실험','요청 경로 지도','Envoy 구성과 데이터 플레인','장애 신호 분석','배포 변경 검토','AWS 리소스 지도'];
const visualTheme = ['#38906b','#ae7731','#357bb5','#7557bc','#b05245','#876439','#258475'];
const vText=(x,y,value,size=13,cls='v-label')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" class="'+cls+'">'+escapeHTML(value)+'</text>';
const vRect=(x,y,w,h,cls='v-card',radius=10)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+radius+'" class="'+cls+'"/>';
const vPath=(d,active=true,arrow=true)=>'<path d="'+d+'" class="'+(active?'v-route active':'v-route')+'" '+(arrow?'marker-end="url(#v-arrow)"':'')+'/>';
function vNode(x,y,w,title,sub='',active=false) {
  return vRect(x,y,w,sub?56:40,active?'v-active':'v-card')+vText(x+12,y+24,title,12)+(sub?vText(x+12,y+42,sub,10,'v-muted'):'');
}
function vPacket(path) {
  return reduce.matches?'':'<circle r="5" class="v-packet"><animateMotion dur="2s" repeatCount="indefinite" path="'+path+'"/></circle>';
}
function vHead(title,subtitle) {
  return vText(31,34,title,10,'v-kicker')+vText(31,57,subtitle,16);
}
function vSvg(body,lesson,step,variant) {
  return '<svg id="motion" class="lesson-visual" viewBox="0 0 760 345" role="img" aria-label="'+escapeHTML(visualNames[variant]+' · '+lesson.steps[step].heading)+'" style="--diagram-accent:'+visualTheme[variant]+'">'+
    '<defs><marker id="v-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10z" fill="'+visualTheme[variant]+'"/></marker><pattern id="v-grid" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="'+visualTheme[variant]+'" opacity=".27"/></pattern></defs>'+
    body+'</svg>';
}
function clusterScene(lesson,step) {
  if(lesson.id==='workloads'&&step===0) return podAnatomyScene();
  if(lesson.id==='cluster') {
    if(step===2) return deploymentOwnershipScene();
    if(step===3) return workerPlacementScene();
    if(step===4) return workerAnatomyScene();
  }
  const roles={
    cluster:[['kubectl','API Server'],['API Server','etcd'],['Deployment','ReplicaSet','Pod'],['Scheduler','Binding','Node'],['kubelet','CRI','Pod']],
    workloads:[['Init container','App container'],['Deployment','Old RS','New RS'],['StatefulSet','db-0','PVC'],['DaemonSet','CronJob','Job']],
    probes:[['Readiness','Ready?','EndpointSlice'],['Startup','Liveness','Restart'],['Drain','Eviction','PDB']],
    config:[['ConfigMap','Secret','Pod'],['PVC','StorageClass','PV'],['Namespace','RoleBinding','Quota']],
    resources:[['Requests','Scheduler','Node'],['CPU limit','cgroups','Container'],['Node pressure','kubelet','Eviction']],
    security:[['Identity','RBAC','API Server'],['Request','Admission','Policy'],['ServiceAccount','RBAC','Pod']],
    extensions:[['CRD','API Server','API Type'],['Backup','Operator','Job'],['Delete','Finalizer','Cleanup']]
  }[lesson.id][step];
  const outer=vRect(29,83,702,230,'v-boundary',18)+vText(49,109,'CONTROL PLANE',10,'v-kicker')+
    vRect(49,201,662,94,'v-band',12)+vText(66,225,'WORKER NODE',10,'v-kicker');
  const start=roles.length===2?194:128;
  const nodes=roles.map((label,i)=>vNode(start+i*190,i===roles.length-1&&step>=3?241:131,151,label,i===0?'입력':i===roles.length-1?'변경 확인':'조정',i===roles.length-1)).join('');
  const lines=roles.slice(1).map((_,i)=>{
    const end=i===roles.length-2&&step>=3?260:156;
    const d='M'+(start+i*190+152)+' 156 Q'+(start+i*190+172)+' '+end+' '+(start+(i+1)*190-5)+' '+end;
    return vPath(d)+(i===0?vPacket(d):'');
  }).join('');
  return vHead('KUBERNETES / CONTROL LOOP',lesson.steps[step].label)+'<rect x="29" y="83" width="702" height="230" fill="url(#v-grid)"/>'+outer+lines+nodes+
    (step<3?vText(68,261,lesson.id==='cluster'?'Pod 시작은 상태 조정과 배치 이후에 진행됩니다.':'실행 상태는 선언과 별도로 확인합니다.',12,'v-muted'):'');
}
function hpaScene(step) {
  const frame=vHead('HPA / REPLICA CALCULATION',['CPU 사용률을 구합니다','원하는 Pod 수를 계산합니다','워크로드에 맞는 확장 신호를 고릅니다'][step]);
  if(step===0) return frame+vRect(38,89,685,212,'v-card',14)+vText(63,127,'컨테이너 CPU 요청 500m',16)+
    vRect(63,151,617,38,'v-slot',7)+vRect(63,151,494,38,'v-chip',7)+vText(76,176,'실제 사용 400m',14)+
    vText(63,231,'400m ÷ 500m = 80%',28)+vText(64,263,'CPU 사용률의 기준은 노드 용량이 아닌 컨테이너 요청량입니다.',12,'v-muted');
  if(step===1) return frame+vRect(41,91,679,76,'v-band',12)+vText(61,135,'ceil(2 replicas × 84% ÷ 60%) = 3 replicas',22)+
    vNode(41,197,186,'현재 노드 용량','Ready Pod 2개')+
    vPath('M229 226H270')+vNode(275,197,186,'HPA 목표','희망 replica 3개',true)+
    vPath('M463 226H503')+vNode(508,197,212,'용량 부족','Pending Pod 1개')+
    vText(42,289,'희망 replica 수가 늘어도 노드가 준비되기까지 Pending일 수 있습니다.',12,'v-muted');
  return frame+[
    ['HPA','레플리카 개수','CPU·메모리·외부 지표'],['VPA','컨테이너 요청량','관측된 리소스 사용량'],['KEDA','이벤트 기반 확장','예: Kafka consumer lag']
  ].map(([title,target,signal],i)=>{
    const x=40+i*234;
    return vRect(x,107,215,151,'v-card',12)+vText(x+17,138,title,20)+vText(x+17,175,target,14)+vText(x+17,221,signal,11,'v-muted');
  }).join('');
}
function schedulingScene(lesson,step) {
  if(lesson.id==='hpa') return hpaScene(step);
  if(lesson.id==='karpenter') return karpenterIllustration(step);
  if(lesson.id==='node-scale') return step===2?karpenterOverviewScene():scaleOverviewScene(step);
  const variants=[['GPU 라벨 필수','GPU 일치','라벨 불일치','라벨 불일치'],['AZ-B 선호','후보','우선 후보','후보'],['전용 풀 taint','허용 조건 필요','일반 후보','일반 후보'],['AZ 균형 배치','2 Pods · AZ-A','1 Pod · AZ-B','배치 후보 · AZ-B' ]][step];
  const [heading,...captions]=variants;
  const selected=[0,1,1,2][step];
  const columns=captions.map((caption,i)=>{
    const x=41+i*235;
    const filled=step===3?[2,1,0][i]:[3,2,1][i];
    const slots=Array.from({length:6},(_,j)=>{
      const px=x+16+j%3*58, py=182+Math.floor(j/3)*40;
      return vRect(px,py,45,31,j<filled?'v-chip':'v-slot',6)+(j<filled?vText(px+10,py+20,'Pod',10):'');
    }).join('');
    return vRect(x,119,209,159,selected===i?'v-active':'v-card',14)+vText(x+16,144,'NODE '+String.fromCharCode(65+i),10,'v-kicker')+
      vText(x+16,165,caption,12)+slots;
  }).join('');
  return vHead('SCHEDULING / CAPACITY',heading)+columns+
    vText(43,306,'강조된 노드는 현재 조건에서 살펴볼 후보입니다.',12,'v-muted');
}
function trafficScene(lesson,step) {
  const routes={
    service:[['CoreDNS','ClusterIP','Pod A','Pod B'],['Service','EndpointSlice','Ready Pod','Not Ready'],['LoadBalancer','NetworkPolicy','Allowed','Denied']],
    gateway:[['GatewayClass','Gateway','Envoy','Other Class'],['HTTPS :443','Listener','TLS Secret','AllowedRoutes'],['parentRefs','HTTPRoute','Accepted','Denied'],['Gateway','Path match','/sessions','/billing'],['Gateway','HTTPRoute','Redirect','Rewrite / Mirror']],
    routes:[['Listener','Route type','HTTPRoute','GRPCRoute'],['TLS :443','SNI match','TLS backend','HTTPS terminate'],['L4 listener','Route type','TCP Service','UDP Service']],
    reference:[['Route','Cross-namespace','ReferenceGrant','No grant'],['Gateway','Backend TLS','Verified','Check failed'],['Gateway','Route status','ResolvedRefs','EndpointSlice']],
    migration:[['Existing entry','Migration','Ingress','Gateway API'],['CRD','Conformance','Core','Extended'],['App A','Service route','Backend v1','Backend v2']]
  }[lesson.id][step];
  const [edge,gate,a,b]=routes;
  const upper='M478 185 H522 Q542 185 542 162 V134 H559';
  const lower='M478 185 H522 Q542 185 542 209 V245 H559';
  const activeUpper=lesson.id!=='migration'||step!==0;
  return vHead('NETWORK / ROUTE MAP',lesson.steps[step].label)+vRect(208,90,519,208,'v-boundary',17)+vText(224,113,'CLUSTER / ROUTING PLANE',10,'v-kicker')+
    vPath('M181 184H226')+vPath('M340 184H359')+vPath(upper,activeUpper)+vPath(lower,!activeUpper)+vPacket(activeUpper?upper:lower)+
    vNode(33,156,147,'요청 / 설정',lesson.id==='gateway'&&step===3?'GET /sessions':'클라이언트 / 선언')+
    vNode(229,156,111,edge,'진입 조건')+vNode(364,156,114,gate,'매칭 및 연결',true)+
    vNode(562,106,141,a,'경로 A',activeUpper)+vNode(562,218,141,b,'경로 B',!activeUpper);
}
function envoyScene(lesson,step) {
  const overlays={
    envoy:[['GatewayClass','Envoy Gateway','xDS'],['HTTPRoute','설정 변환','xDS PUSH'],['Gateway listener','Envoy Proxy','GET /sessions']],
    'envoy-policy':[['SecurityPolicy','JWT / OIDC','AUTH'],['ClientTrafficPolicy','Proxy Protocol','CLIENT'],['BackendTrafficPolicy','Retry / Timeout','UPSTREAM'],['EnvoyProxy','Proxy Service','INFRA']],
    'envoy-nlb':[['EnvoyProxy','LoadBalancer','AWS LBC'],['Proxy Service','Target Group','IP / INSTANCE'],['HTTPS','HTTPRoute','PATH MATCH'],['Route conditions','EndpointSlice','HTTP 503']],
    'envoy-ops':[['Gateway API CRD','Envoy Gateway','ACCEPTED'],['ExtensionPolicy','Envoy config','POLICY'],['Route status','Upstream health','FLAGS']]
  }[lesson.id][step];
  const [first,second,tag]=overlays;
  const request='M140 245 H593';
  return vHead('ENVOY / CONTROL & DATA PLANES',lesson.steps[step].label)+
    vRect(32,80,694,104,'v-band',14)+vText(49,101,'CONTROL PLANE',10,'v-kicker')+
    vNode(62,117,185,first)+vNode(290,117,187,second,'',true)+vText(534,141,tag,12,'v-kicker')+
    vPath('M248 137H284')+vPath('M386 158V212')+
    vRect(32,199,694,114,'v-boundary',14)+vText(49,222,'DATA PLANE / REQUEST',10,'v-kicker')+
    vPath(request)+vPacket(request)+vNode(49,225,96,'Client')+
    vNode(179,225,115,lesson.id==='envoy-nlb'?'AWS NLB':'Listener')+
    vNode(330,225,141,'Envoy Proxy','',true)+vNode(582,225,121,'App Service')+
    vText(328,290,lesson.id==='envoy-nlb'?'L4 전달 → Envoy가 L7 규칙 수행':'요청은 프록시에서 처리됩니다.',12,'v-muted');
}
function signalScene(lesson,step) {
  const signals={
    metrics:['metric','metric','alert'], logging:['log','log','log'],
    tracing:['trace','collector','trace'],diagnosis:['event','log','event']
  };
  const view=signals[lesson.id][step];
  let body;
  if(view==='metric') {
    body=vRect(37,83,688,220,'v-card',12)+vText(56,113,step===0?'Prometheus · 요청 지표 수집':'RED · 지연 상승 구간',13)+
      [143,177,211,245].map(y=>vPath('M61 '+y+'H699',false,false)).join('')+
      '<path d="M61 240 L113 231 168 235 224 224 280 231 332 226 389 231 445 214 499 167 554 151 609 144 654 156 699 132 L699 245 H61Z" fill="var(--diagram-accent)" opacity=".13"/>'+
      vPath('M61 240 L113 231 168 235 224 224 280 231 332 226 389 231 445 214 499 167 554 151 609 144 654 156 699 132',true,false)+
      '<circle cx="499" cy="167" r="5" class="v-packet"/>'+vText(61,274,'10:06',10,'v-muted')+vText(476,274,'10:14  ·  p95 상승',11,'v-kicker');
  } else if(view==='trace') {
    const bars=[['Envoy',99,34,'5 ms'],['CSMS API',139,70,'30 ms'],['Kafka publish',214,239,'1,200 ms']];
    body=vRect(37,83,688,220,'v-card',12)+vText(55,112,'TRACE 61ab09',12,'v-kicker')+bars.map(([label,x,w,time],i)=>{
      const y=133+i*44;
      return vText(58,y+15,label,11)+vRect(x+92,y,w,21,i===2?'v-active':'v-chip',4)+vText(x+102+w,y+15,time,10,'v-muted');
    }).join('')+vText(58,276,'같은 trace ID를 로그 검색 조건으로 사용합니다.',12,'v-muted');
  } else if(view==='log'||view==='event') {
    const list=lesson.id==='diagnosis'?
      (step===0?['10:13:01  Warning  BackOff  restarting app','10:13:14  Last State  Terminated  exitCode=1','10:13:29  Warning  BackOff  restart delayed']:
       step===1?['10:14:00  Normal   Scheduled  node-a','10:14:03  Warning  Failed  image tag not found','10:14:12  Warning  BackOff  pulling image']:
       ['10:14:00  Pending   Pod csms-api-67fd','10:14:01  Warning   FailedScheduling','10:14:01  Reason    0/2 nodes available: Insufficient cpu']):
      step===0?['10:13:04  INFO   service=csms-api','10:13:04  WARN   trace_id=61ab09 kafka wait','10:13:06  ERROR  trace_id=61ab09 publish_timeout']:
      step===1?['10:13:04  STDOUT     trace_id=61ab09','10:13:05  FLUENT BIT source=csms-api namespace=charging','10:13:06  LOKI       indexed stream']
      :['10:13:04  INFO   starting app','10:13:06  ERROR  previous container exited','10:13:07  QUERY  kubectl logs --previous'];
    body=vRect(39,83,682,220,'v-terminal',13)+vText(59,113,view==='event'?'KUBERNETES EVENTS':'QUERY RESULTS',11,'v-terminal-accent')+
      list.map((line,i)=>vText(60,152+i*33,line,13,i===2?'v-terminal-accent':'v-terminal-text')).join('');
  } else {
    const words=view==='alert'?['Prometheus','경보 규칙','Alertmanager','담당 채널']:['앱 SDK','OTLP receiver','Batch','Trace 저장소'];
    const path='M83 169H672';
    body=vRect(38,108,684,128,'v-boundary',14)+vPath(path)+vPacket(path)+words.map((word,i)=>vNode(55+i*164,140,139,word,i===0?'발생':i===3?'목적지':'처리',i===2)).join('')+
      vText(55,268,view==='alert'?'경보 규칙 평가와 알림 라우팅은 역할이 다릅니다.':'Collector는 신호를 수신하고 처리해 목적지로 보냅니다.',13,'v-muted');
  }
  return vHead('OBSERVABILITY / SIGNAL INSPECTOR',lesson.steps[step].label)+body;
}
function deliveryScene(lesson,step) {
  const data={
    helm:[['Chart.yaml','name: csms','values.yaml','servicePort: 8080'],['values-prod.yaml','servicePort: 9090','helm template','port: 9090'],['Release v2','image: csms:v2','Release v1','image: csms:v1']],
    argocd:[['Git source','path: charts/csms','Destination','namespace: charging'],['Desired · Git','image: csms:v2','Live · EKS','image: manual-hotfix'],['Sync wave 0','policy / namespace','Sync wave 1','deployment / service']],
    delivery:[['Base','replicas: 2','Overlay · prod','replicas: 4'],['CI build','image: csms:v2','GitOps','deploy csms:v2'],['Stable','traffic: 90%','Canary','traffic: 10%']]
  }[lesson.id][step];
  const [left,lLine,right,rLine]=data;
  const path='M323 174 H421';
  return vHead('DELIVERY / CHANGE REVIEW',lesson.steps[step].label)+
    vRect(34,100,288,143,'v-card',12)+vRect(428,100,298,143,'v-card',12)+
    vText(51,127,left,13)+vText(445,127,right,13)+
    vRect(48,145,258,60,'v-terminal',7)+vRect(442,145,269,60,'v-terminal',7)+
    vText(60,179,lLine,13,'v-terminal-text')+vText(454,179,rLine,13,'v-terminal-accent')+
    vPath(path)+vPacket(path)+
    vText(35,278,lesson.id==='argocd'&&step===1?'차이 발견 → 동기화 정책 확인 → 선언 상태 적용':'어떤 입력이 어떤 배포 상태를 만드는지 비교합니다.',12,'v-muted');
}
function awsScene(lesson,step) {
  const data={
    eks:[['EKS API','Managed control plane','Worker nodes'],['Node groups','EC2 / Fargate','Workload'],['VPC CNI','Private subnet','Pod address']],
    addons:[['VPC CNI','CoreDNS','kube-proxy'],['EBS CSI','Metrics Server','ADOT'],['Add-on version','Health check','Workload']],
    identity:[['IAM principal','Access entry','Kubernetes RBAC'],['IAM Role','Pod Identity Agent','ServiceAccount'],['IRSA · OIDC','EKS Auth','AWS API']],
    'eks-ops':[['Audit log','Container Insights','CloudWatch'],['AWS NLB','Envoy Proxy','EndpointSlice'],['EKS state','Envoy access log','Trace / Logs']],
    'eks-upgrade':[['Upgrade Insights','API compatibility','CRDs / Add-ons'],['Control plane','AZ-A nodes','AZ-B nodes'],['Capacity','Spot / On-Demand','Telemetry']]
  }[lesson.id][step];
  const [control,left,right]=data;
  const path='M374 158 V183 H192 V220';
  return vHead('AWS / CLUSTER MAP',lesson.steps[step].label)+vRect(29,81,703,229,'v-boundary',17)+vText(48,105,'AWS REGION',10,'v-kicker')+
    vNode(279,113,198,control,'',true)+vPath(path)+vPath('M374 158V183H565V220',false)+vPacket(path)+
    vRect(48,201,307,87,'v-band',11)+vRect(403,201,308,87,'v-band',11)+
    vText(63,221,'운영 구성',10,'v-kicker')+vText(418,221,'연결 대상',10,'v-kicker')+
    vNode(63,233,275,left)+vNode(418,233,277,right);
}
const visualRenderers=[clusterScene,schedulingScene,trafficScene,envoyScene,signalScene,deliveryScene,awsScene];
function lessonScene(lesson,step) {
  const variant=Number(lesson.number)-1;
  const body=visualRenderers[variant](lesson,step);
  return '<div class="board-scene lesson-scene variant-'+variant+'"><div class="lesson-figure" tabindex="0" aria-label="시각 설명">'+vSvg(body,lesson,step,variant)+'</div><span class="figure-pan">좌우로 움직여 그림 전체 보기 ↔</span></div>';
}
