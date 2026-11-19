// Draw infrastructure at the level where the lesson's decision is made.
const diagramIcons = {
  terminal:'M3 5h18v14H3z M6 9l4 3-4 3 M12 15h5',
  api:'M4 5h16v14H4z M7 9h2 M7 15h2 M12 9h5 M12 15h5 M4 12h16',
  disk:'M4 7c0-5 16-5 16 0v10c0 5-16 5-16 0z M4 7c0 5 16 5 16 0 M4 12c0 5 16 5 16 0',
  server:'M4 3h16v18H4z M4 9h16 M4 15h16 M7 6h1 M7 12h1 M7 18h1 M12 6h4 M12 12h4 M12 18h4',
  pod:'M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z M3.5 7.3l8.5 4.8 8.5-4.8 M12 12.1v9.4 M8 4.8l8.5 4.8',
  container:'M3 6h18v12H3z M7 9v6 M12 9v6 M17 9v6',
  chip:'M6 6h12v12H6z M10 10h4v4h-4z M9 3v3 M15 3v3 M9 18v3 M15 18v3 M3 9h3 M3 15h3 M18 9h3 M18 15h3',
  network:'M3 5h6v5H3z M15 5h6v5h-6z M9 16h6v5H9z M6 10v3h12v-3 M12 13v3',
  filter:'M3 4h18l-7 8v6l-4 2v-8z',
  config:'M5 3h10l4 4v14H5z M15 3v5h4 M8 11h8 M8 15h8 M8 18h5',
  key:'M12 10a4 4 0 1 0-4 4h3l2 2h2v2h4v-4l-5-4z M7.5 10h.5',
  cloud:'M7 18h12a3 3 0 0 0 0-6h-1a6 6 0 0 0-11-3 4.5 4.5 0 0 0 0 9z',
  check:'M5 12l4 4L19 6',
  clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2'
};
function infraIcon(type,x,y,size=24) {
  return '<path d="'+diagramIcons[type]+'" transform="translate('+x+' '+y+') scale('+size/24+')" class="infra-icon"/>';
}
function infraCard(x,y,w,icon,title,subtitle,style='') {
  return vRect(x,y,w,55,'infra-card '+style,9)+vRect(x+8,y+11,33,33,'infra-icon-bg '+style,8)+infraIcon(icon,x+14,y+17,21)+
    vText(x+50,y+22,title,13)+vText(x+50,y+40,subtitle,11,'infra-sub');
}
function infraZone(x,y,w,h,title,style='') {
  return vRect(x,y,w,h,'infra-zone '+style,15)+vText(x+16,y+23,title,11,'infra-zone-label');
}
function infraStatus(x,y,w,icon,label,style='') {
  return vRect(x,y,w,23,'infra-tag '+style,6)+infraIcon(icon,x+6,y+5,13)+vText(x+24,y+15,label,10,'infra-status');
}
function infraHeader(title,summary,tag) {
  return '<rect x="24" y="73" width="712" height="229" rx="16" fill="url(#v-grid)"/>'+vHead(title,summary)+vText(727,37,tag,10,'infra-end');
}
function infraFoot(text) {
  return '<path d="M30 313H730" class="infra-rule"/>'+vText(32,332,text,11,'infra-sub');
}
function podAnatomyScene() {
  const loop='M467 179 H295';
  return infraHeader('POD / ANATOMY','컨테이너 두 개가 하나의 Pod IP를 공유합니다','실행 단위')+
    infraZone(28,77,704,224,'WORKER NODE · worker-a','outer')+
    infraZone(45,113,670,169,'POD · csms-api-7b8d','inner')+
    infraStatus(520,123,178,'network','Pod IP · 10.0.12.24','success')+
    vPath(loop)+vPacket(loop)+vText(339,168,'localhost',11,'infra-sub')+
    infraCard(61,151,231,'container','앱 컨테이너','csms-api · HTTP :8080','success')+
    infraCard(469,151,230,'container','보조 컨테이너','log-agent · 로그 수집')+
    '<path d="M174 206v20h200m210-20v20H374" class="infra-link"/>'+
    vRect(63,232,634,37,'infra-strip',7)+infraIcon('disk',75,242,16)+vText(103,255,'공유 볼륨 · 두 컨테이너가 마운트하면 같은 파일을 읽을 수 있습니다.',12)+
    infraFoot('Pod는 배치 단위입니다. Pod가 교체되면 이름이나 IP가 바뀔 수 있습니다.');
}
function workerAnatomyScene() {
  const request='M188 151 H231';
  const runtime='M408 151 H434';
  return infraHeader('WORKER NODE / ANATOMY','Pod는 워커에서 실행됩니다','실행 경계')+
    infraZone(26,108,171,159,'CONTROL PLANE','outer')+infraZone(214,78,519,223,'WORKER NODE · worker-a','inner')+
    vPath(request)+vPacket(request)+vPath(runtime)+
    infraCard(35,124,151,'api','API Server','배정된 PodSpec')+
    infraCard(232,124,175,'chip','kubelet','PodSpec을 읽음','success')+
    infraCard(435,124,277,'container','컨테이너 런타임','CRI 호출 · 예: containerd','success')+
    '<path d="M568 180v19H398v18" class="infra-link"/>'+vPath('M568 181v20H399v17')+
    infraCard(232,220,266,'pod','Pod · csms-api','앱 / 보조 컨테이너','success')+
    infraCard(537,220,175,'network','CNI 플러그인','Pod 네트워크 구성')+
    vPath('M536 247 H500',false)+vText(42,224,'스케줄러가 선택한',11,'infra-sub')+vText(42,241,'노드를 기록합니다.',11,'infra-sub')+
    infraFoot('kubelet은 실행 상태를 API 서버에 보고합니다. Running과 Ready는 별도입니다.');
}
function workerPlacementScene() {
  return infraHeader('SCHEDULER / NODE SELECTION','Scheduler가 조건을 보고 Pod를 배정합니다','노드 선택')+
    infraCard(33,86,215,'pod','Pending Pod','CPU request · 500m','warn')+
    vPath('M251 114 H281')+infraCard(285,86,183,'filter','Scheduler','리소스와 배치 제약','success')+
    vPath('M471 114 H514')+infraCard(518,86,209,'api','API Server','nodeName: worker-a')+
    vPath('M376 143v32H201v16')+vPath('M376 143v32H557v16',false)+vPacket('M376 143v32H201v16')+
    infraZone(33,196,326,101,'worker-a / AZ-A','inner')+infraZone(401,196,326,101,'worker-b / AZ-B','outer')+
    infraStatus(48,231,165,'check','CPU 여유 900m','success')+
    infraStatus(416,231,165,'clock','CPU 여유 250m','warn')+
    vText(48,275,'배정됨 · kubelet이 Pod를 시작할 차례',11)+
    vText(416,275,'후보 제외 · 요청량보다 여유가 적음',11,'infra-sub')+
    infraFoot('노드 여유는 기존 Pod의 CPU 요청량을 반영해 계산한 예시입니다.');
}
function deploymentOwnershipScene() {
  return infraHeader('WORKLOAD / OWNERSHIP','Deployment와 ReplicaSet이 Pod 수를 맞춥니다','조정 루프')+
    infraCard(46,87,237,'config','Deployment','희망 replicas · 2','success')+
    vPath('M285 114 H467')+vPacket('M285 114 H467')+vText(348,100,'템플릿',11,'infra-sub')+
    infraCard(471,87,233,'config','ReplicaSet','현재 Pod 수를 조정','success')+
    vPath('M584 143v41H217v36')+vPath('M584 143v41H538v36')+
    infraZone(31,189,699,111,'POD OBJECTS · 이후 스케줄러가 워커를 선택','outer')+
    infraCard(78,224,261,'pod','Pod A','ReplicaSet이 소유','success')+
    infraCard(406,224,261,'pod','Pod B','ReplicaSet이 소유','success')+
    infraFoot('Pod 하나를 삭제하면 ReplicaSet은 부족한 자리에 새 Pod를 생성합니다.');
}
function scaleOverviewScene(step) {
  const headings=['새 Pod에 자리가 없으면 노드 확장을 검토합니다','Cluster Autoscaler는 기존 노드 그룹을 늘립니다','','노드를 줄이기 전에 Pod가 이동할 수 있는지 확인합니다'];
  const head=infraHeader('CLUSTER / COMPUTE CAPACITY',headings[step],'노드 확장');
  if(step===0) {
    return head+infraCard(36,83,222,'chip','HPA','희망 replicas · 4','success')+vPath('M259 111H290')+
      infraCard(295,83,426,'filter','Scheduler','현 노드에 2개만 배치 가능')+
      infraZone(35,168,327,127,'현재 Worker Node','inner')+infraZone(397,168,326,127,'아직 노드 미배정','outer')+
      [59,205,421,567].map((x,i)=>infraStatus(x,218,123,'pod','Pod '+(i+1),i<2?'success':'warn')).join('')+
      vText(57,272,'Ready · 2개',13)+vText(419,272,'Pending · 2개',13)+infraFoot('HPA는 Pod 개수를 바꾸고, Karpenter나 Cluster Autoscaler는 노드 용량을 확보합니다.');
  }
  if(step===1) {
    return head+infraCard(41,82,277,'pod','미배치 Pod','기존 그룹의 템플릿을 비교')+vPath('M322 110H410')+
      infraCard(416,82,305,'chip','Cluster Autoscaler','조건에 맞는 그룹의 desired 증가','success')+
      infraZone(41,170,679,124,'MANAGED NODE GROUP · min 2 / max 5','outer')+
      [64,277,490].map((x,i)=>infraCard(x,215,194,'server','EC2 노드 '+(i+1),i===2?'추가되는 용량':'현재 용량',i===2?'success':'')).join('')+
      infraFoot('그룹의 최대 개수나 노드 템플릿의 라벨·taint가 후보를 제한할 수 있습니다.');
  }
  return head+infraZone(34,100,264,190,'이전 노드 · 통합 후보','outer')+infraZone(461,100,264,190,'대상 노드 · 여유 슬롯','inner')+
    infraCard(56,151,218,'pod','이동할 Pod','eviction 가능 여부 확인','warn')+
    infraCard(483,151,219,'server','남길 노드','CPU·메모리·배치 조건','success')+
    vPath('M279 180H479')+vPacket('M279 180H479')+vText(326,161,'재배치 가능?',12)+
    infraStatus(55,231,182,'check','PDB / 중단 예산')+infraStatus(483,231,199,'filter','AZ · affinity · taint')+
    infraFoot('다른 노드에 Pod를 배치할 수 있는지 계산하고 중단 제약과 가용성을 확인합니다.');
}
function karpenterOverviewScene() {
  return infraHeader('KARPENTER / OBJECTS','정책과 AWS 설정을 읽어 NodeClaim을 만듭니다','리소스 관계')+
    infraZone(31,76,698,131,'노드를 만들기 위한 입력','outer')+
    infraCard(43,112,202,'pod','Pending Pod','CPU · 메모리 · 배치 조건','warn')+
    infraCard(280,112,185,'filter','NodePool','허용할 노드 범위','success')+
    infraCard(500,112,213,'cloud','EC2NodeClass','서브넷 · AMI · IAM')+
    vPath('M466 139H496',false)+vText(466,112,'참조',9,'infra-sub')+
    vPath('M139 169V222')+vPath('M372 169v26H139',true,false)+vPath('M601 169v26H372',false,false)+
    infraCard(42,228,175,'chip','Karpenter','조건을 종합')+vPath('M218 255H279')+
    infraCard(283,228,183,'config','NodeClaim','생성할 노드 한 대','success')+
    vPath('M468 255H509')+vPacket('M468 255H509')+
    infraCard(513,228,200,'server','EC2 Worker','시작 → 등록 → 준비')+
    infraFoot('NodePool과 EC2NodeClass는 설정입니다. Karpenter가 생성한 NodeClaim에서 진행 상태를 봅니다.');
}
function karpenterIllustration(step) {
  if(step===0) {
    const d='M244 144H258';
    return infraHeader('KARPENTER / 01 MATCH','Pod와 NodePool의 조건이 겹쳐야 후보가 됩니다','조건 검토')+
      infraZone(28,83,217,211,'① 스케줄되지 않은 Pod','outer')+
      infraCard(43,119,186,'pod','csms-api','500m CPU · 1Gi','warn')+
      infraStatus(44,192,181,'chip','arm64 · AZ-A','warn')+infraStatus(44,224,181,'clock','FailedScheduling','warn')+
      vPath(d)+vPacket(d)+infraZone(262,83,468,211,'② NODEPOOL · 생성할 노드가 허용하는 범위','inner')+
      infraCard(279,119,433,'filter','arm-workers','arm64 · AZ-A/B · On-Demand','success')+
      infraStatus(279,192,205,'check','arm64 ∩ arm64','success')+
      infraStatus(496,192,214,'check','AZ-A ∩ AZ-A/B','success')+
      infraStatus(279,232,430,'chip','Pod 요청량 + 노드에 필요한 시스템 용량','success')+
      infraFoot('NodePool의 requirements를 Pod의 requests 및 스케줄링 조건과 함께 평가합니다.');
  }
  if(step===1) {
    const d='M255 158H348';
    return infraHeader('KARPENTER / 02 CONFIGURE','NodePool은 AWS 생성 설정을 참조합니다','설정 참조')+
      infraZone(31,91,225,198,'KUBERNETES 조건','outer')+
      infraCard(45,129,196,'filter','NodePool','arm-workers','success')+
      vText(47,218,'아키텍처 · AZ · 용량 유형',12)+vText(47,253,'spec.template.spec',11,'infra-sub')+
      vPath(d)+vPacket(d)+vText(261,145,'nodeClassRef',10,'infra-sub')+
      infraZone(350,91,381,198,'AWS에서 사용할 설정','inner')+
      infraCard(366,123,349,'config','EC2NodeClass','csms-default','success')+
      infraStatus(367,197,170,'network','서브넷 / 보안 그룹')+
      infraStatus(545,197,170,'disk','AMI 선택')+
      infraStatus(367,234,348,'key','노드 IAM 역할 / 인스턴스 프로파일')+
      infraFoot('NodePool의 nodeClassRef는 사용할 EC2NodeClass를 가리킵니다.');
  }
  if(step===2) {
    const d='M247 146H277';
    return infraHeader('KARPENTER / 03 PROVISION','Karpenter가 한 노드의 생성 요청을 기록합니다','프로비저닝')+
      infraCard(31,118,215,'chip','Karpenter','Pod + Pool + Class','success')+
      vPath(d)+vPacket(d)+infraCard(281,118,208,'config','NodeClaim','예: arm-workers-abc12','success')+
      vPath('M491 146H517')+infraCard(522,118,207,'cloud','AWS EC2','조건에 맞는 용량 요청','success')+
      infraZone(31,204,698,87,'NODECLAIM 상태에서 확인할 단계','outer')+
      infraStatus(49,245,181,'check','Launched','success')+
      infraStatus(283,245,181,'clock','Registered 대기')+
      infraStatus(518,245,193,'clock','Initialized 대기')+
      infraFoot('Launched는 인스턴스 시작을 나타냅니다. Kubernetes 노드 등록은 다음 단계입니다.');
  }
  const d='M461 231H510';
  return infraHeader('KARPENTER / 04 REGISTER','워커가 준비되면 Scheduler가 Pod를 배정합니다','클러스터 합류')+
    infraZone(32,84,697,101,'NODECLAIM · 생성한 워커의 상태','outer')+
    infraStatus(52,132,184,'check','Launched','success')+vPath('M238 144H276')+
    infraStatus(281,132,181,'check','Registered','success')+vPath('M464 144H506')+
    infraStatus(512,132,196,'check','Initialized','success')+
    infraCard(32,204,233,'server','EC2 Worker','kubelet이 Node 등록','success')+
    vPath('M267 231H289')+infraCard(293,204,167,'filter','Scheduler','Node에 바인딩')+
    vPath(d)+vPacket(d)+infraCard(514,204,215,'pod','csms-api','Pending → 실행 준비','success')+
    vText(33,284,'예시 순서 · 실제 상태는 조건의 Reason과 Message를 함께 확인합니다.',11,'infra-sub')+
    infraFoot('노드 합류 뒤 Pod를 다시 스케줄하는 주체는 Kubernetes Scheduler입니다.');
}
