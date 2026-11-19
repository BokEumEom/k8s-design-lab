// Each entry follows the steps in course.js and shows what changes and how to verify it.
const stepDetails = {
  cluster: [
    ['충전 세션 API를 두 개 띄우려면 Deployment의 spec.replicas에 2를 선언합니다. kubectl은 파일을 API로 전송하고, API 서버는 호출자가 이 네임스페이스에 Deployment를 적용할 권한이 있는지 확인합니다.', 'kubectl get deployment csms-api에서 Deployment를 확인하세요. 이 시점에는 Pod가 아직 시작되지 않았을 수 있습니다.'],
    ['API 서버는 원하는 replica 수와 Pod 템플릿을 저장합니다. 이후 컨트롤러는 API를 통해 변경을 확인하고, 조회에서도 같은 선언을 볼 수 있습니다.', 'kubectl get deployment csms-api -o yaml에서 spec.replicas와 status.readyReplicas를 비교하세요. 선언과 준비 상태에는 시간차가 있습니다.'],
    ['Deployment가 템플릿을 바탕으로 ReplicaSet을 만들고 ReplicaSet이 Pod 수를 맞춥니다. Pod 하나를 삭제하면 같은 이름이 되살아나는 대신 새로운 Pod가 생깁니다.', 'kubectl get deploy,rs,pod에서 소유 관계와 개수를 확인하세요. Pod의 ownerReferences는 ReplicaSet을 가리킵니다.'],
    ['500m CPU를 요청한 Pod에 대해 Scheduler는 남은 요청 가능량, 라벨, taint를 확인합니다. 적합한 노드에 바인딩하면 Pod에 노드 이름이 기록됩니다.', 'kubectl get pod -o wide의 NODE를 보세요. 빈 상태가 이어지면 describe pod에서 FailedScheduling 이유를 확인합니다.'],
    ['Worker Node는 가상 머신 또는 물리 서버입니다. API에 배정된 Pod가 보이면 노드의 kubelet이 CRI를 통해 containerd 같은 런타임에 이미지 준비와 실행을 요청합니다. CNI 플러그인이 Pod 네트워크를 구성하면 앱과 보조 컨테이너가 그 노드에서 동작합니다.', 'kubectl get pod -o wide의 NODE 열로 실제 위치를 보세요. Running이어도 READY=0/1일 수 있으므로 describe pod의 Conditions를 함께 확인합니다.']
  ],
  workloads: [
    ['그림의 앱 컨테이너는 8080 포트에서 응답하고, 같은 Pod의 보조 컨테이너는 localhost:8080으로 접근할 수 있습니다. 둘 다 같은 볼륨을 마운트했다면 같은 파일도 읽을 수 있습니다. 일반 init container는 이 앱·보조 컨테이너가 시작되기 전에 준비 작업을 끝냅니다.', 'kubectl get pod -o wide에서 Pod IP와 Node를 확인하세요. kubectl describe pod를 열어 Init Containers와 Containers, Mounts를 구분해 보세요.'],
    ['3개 replica에서 maxSurge=1, maxUnavailable=0이면 새 Pod를 먼저 추가하고 준비되면 이전 버전을 줄일 수 있습니다. 새 버전의 readiness가 계속 실패하면 롤아웃이 멈춥니다.', 'kubectl rollout status와 kubectl get rs를 함께 보면서 이전·신규 ReplicaSet 수를 비교하세요.'],
    ['db-0이 재생성돼도 같은 이름과 기존 PVC를 다시 사용할 수 있어 상태 보존이 쉬워집니다. 복제와 리더 선출은 데이터베이스 또는 Operator의 역할입니다.', 'kubectl get pod,pvc를 실행해 Pod 이름과 연결된 PVC 이름이 어떻게 대응하는지 보세요.'],
    ['노드마다 로그를 수집하려면 DaemonSet을, 매일 종료된 충전 세션을 집계하려면 CronJob을 선택할 수 있습니다. CronJob이 일정에 맞춰 Job을 만들고 그 Job이 Pod를 관리합니다.', 'kubectl get ds,cronjob,job을 실행해 상시 실행 수와 완료 작업을 구분하세요.']
  ],
  probes: [
    ['앱 프로세스는 살아 있지만 초기 캐시를 채울 때까지 /ready가 실패할 수 있습니다. kubelet은 Pod를 준비되지 않은 상태로 표시하고, 일반 Service 트래픽은 Ready인 다른 Pod로 흐릅니다.', 'Pod의 READY와 EndpointSlice의 endpoints[].conditions.ready를 비교하세요.'],
    ['초기화에 90초 걸리는 앱에는 Startup Probe 허용 시간을 충분히 줍니다. 시작 이후 앱이 복구 불가능하게 멈추는 경우 Liveness Probe가 재시작을 유도합니다.', 'kubectl describe pod의 Unhealthy 이벤트와 Restart Count를 보고 어떤 검사가 실패했는지 확인하세요.'],
    ['Ready replica 3개인 API에 minAvailable: 2를 두면 일반적인 drain에서 동시에 내보낼 수 있는 여유는 1개입니다. 대체 Pod가 준비되어야 다음 축출이 진행될 수 있습니다.', 'kubectl get pdb에서 ALLOWED DISRUPTIONS를 확인하세요. PDB는 노드 장애처럼 자발적이지 않은 중단을 막지는 못합니다.']
  ],
  config: [
    ['요청 타임아웃은 ConfigMap, DB 자격 증명은 Secret에 저장해 Pod 템플릿에서 참조합니다. 환경 변수로 주입한 값은 실행 중인 컨테이너에 자동으로 갱신되지 않습니다.', 'Deployment의 envFrom 또는 volumeMounts를 확인하세요. Secret 값을 로그나 공유 화면에 출력하지 않고 참조 이름만 확인합니다.'],
    ['20Gi PVC를 생성하면 StorageClass에 연결된 CSI 드라이버가 볼륨을 준비할 수 있습니다. EBS처럼 AZ에 종속된 볼륨은 그 AZ에서 접근 가능한 노드가 필요합니다.', 'kubectl get pvc,pv,storageclass에서 PVC가 Bound인지 확인하세요. Pending이면 PVC 이벤트와 볼륨 바인딩 모드를 먼저 봅니다.'],
    ['팀별 namespace를 만들고 Role로 그 팀의 Pod 조회만 허용할 수 있습니다. ResourceQuota는 팀 전체 요청량을 제한하며 LimitRange는 개별 컨테이너의 기본값이나 범위를 설정할 수 있습니다.', 'kubectl get quota,limitrange -n charging을 보고, Pod 생성이 거부됐다면 API 서버가 반환한 제한 항목을 확인하세요.']
  ],
  resources: [
    ['노드에 CPU 요청 가능량이 500m 남아 있는데 Pod가 800m를 요청하면 현재 CPU가 한가해 보여도 후보에서 제외됩니다.', 'kubectl describe node의 Allocatable과 Allocated resources, Pod의 Insufficient cpu 이벤트를 함께 보세요.'],
    ['CPU 한도에 닿으면 처리량이 줄고 응답이 늦어질 수 있습니다. 메모리 제한을 넘겨 프로세스가 종료되면 컨테이너 상태에 OOMKilled가 나타날 수 있습니다.', 'p95와 CPU throttling을 같은 시간대에 비교하고, 재시작이 있었다면 describe pod의 Last State를 확인하세요.'],
    ['컨테이너 자체는 메모리 한도 이내라도 노드 전체의 메모리나 디스크가 부족하면 kubelet이 Pod를 축출할 수 있습니다.', '노드의 MemoryPressure·DiskPressure와 Pod의 Evicted 이유를 보세요. 컨테이너 Last State의 OOMKilled와 진단 위치가 다릅니다.']
  ],
  security: [
    ['조회는 가능하지만 kubectl delete가 Forbidden이면 API가 사용자를 알아본 뒤 삭제 권한을 허용하지 않았을 수 있습니다. RoleBinding의 주체와 네임스페이스를 확인합니다.', 'kubectl auth can-i get pods -n charging과 kubectl auth can-i delete pods -n charging 결과를 비교하세요.'],
    ['RBAC로 Pod 생성을 허용해도 namespace에 Restricted 수준을 강제하면 요구 조건을 충족하지 않는 컨테이너가 거부될 수 있습니다. warn 모드에서는 경고를 먼저 관찰할 수 있습니다.', 'kubectl get namespace charging --show-labels에서 pod-security.kubernetes.io 관련 라벨을 확인하세요.'],
    ['앱이 Kubernetes API를 조회할 권한은 ServiceAccount와 RBAC로 제어합니다. 같은 앱이 컨테이너 안에서 root로 실행되는지는 securityContext에서 제어합니다.', 'Deployment의 serviceAccountName과 securityContext를 확인하고, API를 호출하지 않는 워크로드에는 토큰 자동 마운트가 필요한지도 확인하세요.']
  ],
  extensions: [
    ['예를 들어 백업을 선언하는 새로운 Backup 리소스의 필드와 형식을 CRD로 등록합니다. 형식은 저장할 수 있게 되지만, 백업 작업을 실행할 컨트롤러가 별도로 필요합니다.', 'kubectl get crd와 kubectl api-resources에서 새 리소스 타입이 등록됐는지 확인하세요.'],
    ['Backup 오브젝트가 생성되면 Operator는 Job을 만들고 완료 상태를 확인해 Backup의 status를 갱신할 수 있습니다. 이벤트를 놓쳐도 재조정에서 현재 상태와 원하는 상태를 다시 비교합니다.', '커스텀 리소스의 status.conditions와 Operator 로그를 대조하세요.'],
    ['외부 저장소 정리가 끝날 때까지 finalizer가 오브젝트 삭제를 보류할 수 있습니다. Webhook이 API 요청을 검증하는 흐름은 별개의 동작입니다.', '삭제가 오래 걸리면 metadata.deletionTimestamp, finalizers, 담당 컨트롤러 로그를 함께 살펴보세요.']
  ],
  affinity: [
    ['GPU 라벨이 있는 노드만 허용하면 CPU 여유가 충분한 일반 노드도 후보가 될 수 없습니다. 라벨 값이 한 글자만 달라도 일치하지 않습니다.', 'kubectl get nodes --show-labels와 Pod의 nodeAffinity를 비교하고 FailedScheduling 메시지를 보세요.'],
    ['특정 AZ를 선호하도록 설정하면 Scheduler가 그 AZ의 점수를 높일 수 있지만, 여유가 없으면 다른 AZ를 선택할 수 있습니다. Pod anti-affinity는 같은 앱 Pod가 같은 노드에 모이는 것을 제한하거나 피하도록 돕습니다.', '실습의 스케줄링에서 존재하지 않는 AZ에 대해 Required와 Preferred의 결과를 비교하세요.'],
    ['전용 노드에 dedicated=payments:NoSchedule taint를 걸면 이를 허용하는 Pod만 해당 노드를 후보로 고려할 수 있습니다. 그 Pod를 전용 풀로 유도하려면 라벨과 affinity가 추가로 필요합니다.', 'kubectl describe node의 Taints와 Pod의 tolerations를 양쪽에서 비교하세요.'],
    ['두 AZ에 같은 앱 Pod가 2개와 1개씩 있고 다른 제약이 없다면 maxSkew=1은 네 번째 Pod가 덜 채워진 AZ에 배치되도록 유도합니다. labelSelector는 어떤 Pod를 셀지 결정합니다.', 'kubectl get pod -o wide로 노드를 확인한 뒤 노드의 topology.kubernetes.io/zone 라벨을 대조하세요.']
  ],
  hpa: [
    ['CPU request가 500m인 컨테이너에서 CPU를 400m 사용하면 CPU 사용률은 request 대비 80%입니다. 이 비율은 노드 전체의 CPU 사용률과 다릅니다.', 'kubectl top pod로 사용량을 보고 Deployment의 resources.requests.cpu와 HPA의 TARGETS를 대조하세요.'],
    ['현재 2개 Pod의 평균이 84%이고 목표가 60%이면 ceil(2 × 84 ÷ 60)은 3입니다. 기존 노드에 2개만 들어가면 세 번째 Pod가 배치 대기 상태가 될 수 있습니다.', 'HPA 실습에서 CPU를 84%, 목표를 60%, 노드 용량을 2로 두고 희망 replica와 Pending 수를 확인하세요.'],
    ['CPU보다 Kafka consumer lag이 밀리는 문제가 중요하다면 이벤트 지표를 보는 KEDA가 적합할 수 있습니다. 메모리 요청이 지속적으로 과소 설정됐다면 VPA 권장값이 판단에 도움이 됩니다.', '운영 목표가 처리 Pod 수인지, Pod당 요청량인지, 큐 대기 시간인지 먼저 적고 그에 맞는 지표를 고르세요.']
  ],
  'node-scale': [
    ['부하가 커져 HPA가 4개를 요청해도 기존 노드에 2개만 배치할 수 있으면 나머지 Pod는 Pending입니다. 스케줄러 이벤트를 보고 노드 확장을 검토할 근거를 찾습니다.', 'HPA의 DESIRED=4와 Pod의 FailedScheduling을 대조하세요. 노드가 추가되기 전에는 Ready가 바로 늘지 않습니다.'],
    ['노드 그룹이 2개에서 최대 5개까지 설정되어 있고 새 Pod를 수용할 템플릿이라면 Cluster Autoscaler가 desired size 증가를 요청할 수 있습니다.', '노드 그룹의 최대 크기, 템플릿 라벨·taint, Pod의 CPU·메모리 요청량을 확인하세요.'],
    ['Pod가 특정 AZ의 ARM 노드를 요구하면 Karpenter는 NodePool 요구 조건과 교차해 가능한 용량을 찾습니다. EC2NodeClass는 해당 노드를 AWS에서 만드는 설정을 제공합니다.', 'kubectl get nodepools,nodeclaims와 NodeClaim의 Launched·Registered·Initialized 조건을 확인하세요.'],
    ['부하가 줄어 두 노드의 워크로드가 한 노드에 들어갈 수 있다면 정책에 따라 통합 후보가 될 수 있습니다. PDB, AZ 제약, 종료 시간이 실제 이동 가능성에 영향을 줍니다.', '노드 제거 전 PDB 허용 중단 수와 다른 노드에 배치할 수 있는 리소스 여유를 확인하세요.']
  ]
};
Object.assign(stepDetails,{
  service: [
    ['charging 네임스페이스의 billing Service는 billing.charging.svc.cluster.local 같은 이름으로 조회할 수 있습니다. Pod가 교체돼도 클라이언트는 같은 Service 이름을 사용합니다.', 'Pod에서 nslookup billing.charging.svc.cluster.local을 실행해 이름 조회를 확인하고, 실제 HTTP 요청 결과는 별도로 확인하세요.'],
    ['Service selector가 app=billing이면 같은 네임스페이스에서 해당 라벨과 일치하는 Pod가 연결됩니다. 엔드포인트의 ready 조건은 트래픽 수신 준비 상태를 나타냅니다.', 'kubectl get pods --show-labels와 kubectl get endpointslice -l kubernetes.io/service-name=billing을 비교하세요.'],
    ['클러스터 외부 요청은 LoadBalancer Service로 받고 내부 앱 연결에는 ClusterIP를 쓸 수 있습니다. NetworkPolicy가 앱 간 통신을 제한해도 DNS와 연결 실패는 증상이 다를 수 있습니다.', 'DNS 조회가 되지만 연결이 실패하면 EndpointSlice, 대상 포트, NetworkPolicy를 차례로 확인하세요.']
  ],
  gateway: [
    ['플랫폼 팀은 Envoy 구현체를 선택한 GatewayClass와 공유 Gateway를 관리합니다. 앱 팀은 HTTPRoute로 자기 서비스의 호스트와 경로를 선언할 수 있습니다.', 'kubectl get gatewayclass에서 controllerName과 Accepted 상태를 보세요.'],
    ['Gateway에 HTTPS 443 리스너를 만들고 csms.example의 TLS 인증서를 연결합니다. 리스너는 어떤 네임스페이스에서 Route를 붙일 수 있는지도 정합니다.', 'kubectl describe gateway에서 addresses, Programmed, listener별 attachedRoutes와 조건을 확인하세요.'],
    ['charging의 HTTPRoute가 infra의 Gateway를 참조해도, 리스너가 charging의 연결을 허용하지 않으면 요청 규칙이 붙지 않습니다. sectionName으로 특정 HTTPS 리스너를 선택할 수 있습니다.', 'kubectl describe httproute에서 부모 Gateway 이름, Accepted와 실패 이유를 확인하세요.'],
    ['GET /sessions는 세션 Service로, GET /billing은 결제 Service로 보냅니다. 세션 백엔드 두 개의 가중치를 90과 10으로 두면 여러 요청에 걸쳐 대략 그 비율로 분산됩니다.', 'NLB · Envoy · HTTPRoute 실습에서 경로를 바꾸고, 없는 경로의 404와 준비된 백엔드가 없을 때의 503을 비교하세요.'],
    ['이전 URL을 새 주소로 안내하려면 Redirect가 맞습니다. 외부 URL을 유지하면서 백엔드 요청 경로만 바꾸려면 Rewrite를 사용합니다. Mirror는 별도 백엔드에 요청을 복제합니다.', '클라이언트 응답 코드와 업스트림 접근 로그를 함께 보고 적용한 필터가 어느 지점에서 동작했는지 확인하세요.']
  ],
  routes: [
    ['GET /sessions 같은 요청은 HTTPRoute의 경로 조건으로 표현할 수 있습니다. gRPC 호출은 GRPCRoute에서 패키지와 서비스명 또는 메서드명 기준으로 나눌 수 있습니다.', 'Gateway 리스너에 Route가 붙었는지 확인한 뒤 HTTP는 curl, gRPC는 grpcurl 같은 각 프로토콜 도구로 확인하세요.'],
    ['Passthrough 구성에서 Envoy는 SNI로 대상 백엔드를 선택하고 인증서 협상은 백엔드에서 진행됩니다. HTTPS 종료 구성에서는 Gateway가 인증서를 제시하고 HTTP 규칙을 적용합니다.', '접속 시 어떤 구성요소의 인증서가 보이는지 확인하고, SNI와 리스너 hostname을 대조하세요.'],
    ['TCPRoute는 데이터베이스 같은 TCP 연결을, UDPRoute는 UDP 데이터그램을 전달하는 용도로 사용할 수 있습니다. HTTP 경로나 상태 코드 대신 포트와 프로토콜을 기준으로 진단합니다.', '리스너 protocol, supportedKinds, backend Service의 protocol과 port가 일치하는지 확인하세요.']
  ],
  reference: [
    ['charging의 Route가 platform의 Service를 백엔드로 쓰려면 platform 쪽 ReferenceGrant로 필요한 참조를 열 수 있습니다. Gateway에 Route가 붙는 권한은 Gateway의 allowedRoutes에 둡니다.', 'Accepted=True인데 ResolvedRefs=False이면 backend 포트와 리소스 이름, ReferenceGrant부터 확인하세요.'],
    ['브라우저에서 Gateway까지 TLS를 사용하더라도 Gateway에서 앱까지 TLS인지 여부는 별도 설정입니다. BackendTLSPolicy는 백엔드 인증서를 어떤 이름과 신뢰 기준으로 검증할지 정의합니다.', '정책의 대상 Service, 인증서와 validation hostname, CA 참조가 실제 백엔드와 일치하는지 확인하세요.'],
    ['배포 직후에 저장된 YAML과 status가 다른 세대를 가리킬 수 있습니다. observedGeneration이 최신이면 현재 선언을 바탕으로 계산한 조건으로 해석합니다.', 'Gateway의 Programmed, Route의 Accepted·ResolvedRefs, EndpointSlice 준비 상태 순서로 확인하세요.']
  ],
  migration: [
    ['기존 Ingress의 호스트·경로·TLS를 추출하고, Gateway listener와 HTTPRoute에 어떤 필드를 둘지 나눕니다. 기존 경로와 신규 경로에 같은 요청을 보내 응답을 비교할 수 있습니다.', '이전 전에 hostname, pathType, 리다이렉트, 인증서, 기존 구현체 전용 annotation을 목록으로 만드세요.'],
    ['CRD가 설치되어 리소스를 만들 수 있어도 구현체가 모든 확장 기능을 제공하지는 않습니다. 같은 구현체라도 릴리스나 기능 프로필에 따라 결과가 달라질 수 있습니다.', '설치한 버전의 공식 conformance 보고서에서 필요한 Route 종류와 필터를 찾으세요.'],
    ['서비스 간 트래픽에서 앱이 호출하는 Service를 Route의 부모로 삼는 모델을 사용하면 메시 내부에서 트래픽을 분배할 수 있습니다.', 'Route의 parentRefs가 Gateway를 가리키는지 Service를 가리키는지 보고 정책이 적용될 요청 범위를 확인하세요.']
  ],
  envoy: [
    ['Envoy Gateway 컨트롤러는 자신이 담당하는 GatewayClass에 연결된 Gateway와 Route를 추적합니다. 다른 컨트롤러의 Class에 연결한 Gateway는 해당 구현체가 처리합니다.', 'GatewayClass의 controllerName과 Gateway의 gatewayClassName이 원하는 Envoy Gateway 설정을 가리키는지 확인하세요.'],
    ['새 /billing Route를 만들면 컨트롤러가 리스너, 라우팅 규칙과 업스트림 정보를 프록시 설정으로 바꿔 xDS로 전달합니다.', 'Route 상태가 정상인데 변경이 보이지 않으면 컨트롤러 로그, 프록시의 설정 반영 상태와 access log를 비교하세요.'],
    ['요청은 Envoy Gateway 컨트롤러에 접속하지 않습니다. 실제 프록시가 요청을 받고 설정에 따라 인증이나 라우팅, 업스트림 연결을 처리합니다.', '데이터 플레인 Service와 Pod를 찾아 해당 프록시의 접근 로그에서 요청이 도달했는지 확인하세요.']
  ],
  'envoy-policy': [
    ['예를 들어 내부 결제 경로에 JWT 검증을 적용하면 토큰 검증 단계에서 실패한 요청은 앱에 도달하기 전에 거절될 수 있습니다.', 'SecurityPolicy의 targetRefs와 상태를 확인하고, 인증 실패 요청에 업스트림 호출이 있었는지 접근 로그에서 살펴보세요.'],
    ['NLB가 Proxy Protocol을 사용하는 구성에서는 수신하는 Envoy의 설정도 그 프로토콜을 이해해야 합니다. 양쪽이 불일치하면 정상 HTTP 라우팅에 이르기 전에 연결이 실패할 수 있습니다.', 'ClientTrafficPolicy 적용 대상과 NLB 대상 그룹 속성을 함께 확인하세요.'],
    ['예를 들어 세션 조회에 재시도를 설정하면 일시 오류를 흡수할 수 있지만, 결제 생성처럼 부작용이 있는 요청의 재시도는 중복 작업을 만들 수 있습니다.', '재시도 횟수만 설정하기보다 전체 응답 시간 제한과 요청의 멱등성, 재시도 후 업스트림 요청량을 확인하세요.'],
    ['외부 노출 방식, 프록시 replica 수, Pod 리소스 요청과 접근 로그 목적지는 데이터 플레인의 운영 설정입니다. EnvoyProxy 설정이 실제 프록시 오브젝트에 반영됐는지 확인합니다.', 'Gateway 또는 GatewayClass의 parametersRef와 생성된 Service·Deployment를 대조하세요.']
  ],
  'envoy-nlb': [
    ['Envoy 데이터 플레인 앞에 LoadBalancer Service를 두고, 선택한 AWS 컨트롤러 방식으로 NLB를 프로비저닝합니다. 사용 중인 EKS 모드에 따라 지원되는 Service 설정이 다릅니다.', 'Service의 spec.loadBalancerClass와 annotations를 확인하고 status.loadBalancer에 주소가 할당됐는지 보세요.'],
    ['IP 타깃 방식에서는 대상 그룹이 Envoy Pod IP를 가리킵니다. Instance 방식에서는 노드와 NodePort를 확인해야 합니다. 구성에 따라 정상이어야 하는 헬스 체크 지점이 달라집니다.', 'AWS 대상 그룹의 실제 타깃 IP 또는 인스턴스와 Service의 포트·EndpointSlice를 대조하세요.'],
    ['HTTPS 예제에서는 NLB가 TCP 연결을 Envoy 프록시에 넘긴 뒤 Envoy가 TLS를 종료합니다. 그 다음 Host와 /sessions 경로를 보고 세션 Service를 선택합니다.', 'NLB에서 TLS를 종료하는 구성과 혼동하지 않도록 NLB 리스너 프로토콜, Envoy 리스너와 인증서 위치를 확인하세요.'],
    ['같은 접속 실패처럼 보여도 NLB 타깃 문제라면 Envoy 접근 로그가 남지 않을 수 있습니다. Envoy가 503을 응답하면 요청이 프록시에 도달했으므로 Route 상태와 업스트림 준비 상태를 확인합니다.', '라우팅 실습에서 Route 결합 실패와 업스트림 엔드포인트 없음, NLB 대상 비정상을 각각 선택해 비교하세요.']
  ],
  'envoy-ops': [
    ['Gateway 오브젝트를 생성하기 전에 클러스터가 설치할 API 버전을 제공하는지 확인합니다. 이후 컨트롤러가 시작되고 GatewayClass를 받아들이는지 봅니다.', 'kubectl api-resources와 컨트롤러 Deployment의 가용 상태, GatewayClass의 Accepted 조건을 확인하세요.'],
    ['기능을 표준 API로 표현할 수 있으면 유지보수와 이전이 쉬워집니다. Envoy 고유 확장이 필요할 때는 목적과 버전 의존성을 기록합니다.', '정책을 적용한 뒤 status와 영향받는 Gateway 또는 Route를 확인하고, 버전 변경 전 CRD 차이를 검토하세요.'],
    ['응답 코드만으로 근본 원인을 결정하기 어려울 때는 Envoy의 response flags와 upstream 연결 시간을 봅니다. 예를 들어 UH는 건강한 업스트림이 없다는 단서입니다.', '접근 로그의 response_flags, upstream_host, duration_ms를 추적하고 해당 Service의 EndpointSlice를 확인하세요.']
  ]
});
Object.assign(stepDetails,{
  metrics: [
    ['앱의 요청 카운터는 Prometheus가 수집할 수 있습니다. Deployment의 원하는 replica 수는 kube-state-metrics가 내보내고, kubectl top은 Metrics API의 최근 리소스 사용량을 보여줍니다.', '대시보드에서 지표의 출처를 확인하세요. 앱 메트릭이 비어 있으면 Prometheus의 target 상태와 노출 포트를 봅니다.'],
    ['전체 요청 수가 유지되면서 p95가 82ms에서 1,240ms로 커지고 오류율도 오르면, 일부 사용자 요청의 지연이 심해졌음을 알 수 있습니다.', 'RED 지표를 같은 서비스와 시간 범위로 보고, 지연 상승 시점의 대표 trace로 이동하세요.'],
    ['오류율이 잠깐 튄 경우와 5분 이상 지속된 경우를 구분해 규칙을 평가할 수 있습니다. Alertmanager는 관련 알림을 묶고 담당 채널로 보냅니다.', '경보가 기대대로 가지 않으면 Prometheus 규칙 상태와 Alertmanager의 라우팅 라벨을 확인하세요.']
  ],
  logging: [
    ['세션 API는 로그에 level, message, trace_id를 JSON 필드로 기록할 수 있습니다. 같은 trace ID를 복사하면 장애 요청의 로그를 찾기 쉽습니다.', '숫자나 요청 ID처럼 값이 계속 달라지는 필드를 Loki 인덱스 라벨로 만들지 않고 로그 본문에서 검색하세요.'],
    ['노드의 로그 에이전트가 컨테이너 출력 파일을 읽고 namespace나 pod 정보를 붙여 백엔드로 보냅니다. 노드가 교체된 뒤에도 중앙 저장소의 로그는 보존 정책에 따라 조회할 수 있습니다.', 'kubectl logs에는 보이는데 중앙 저장소에 없다면 에이전트 상태, 권한, 필터, 전송 오류 순서로 확인하세요.'],
    ['앱이 시작 직후 종료되면 현재 인스턴스 로그만 열었을 때 장애 원인이 보이지 않을 수 있습니다. 같은 Pod의 직전 종료 인스턴스 로그를 확인합니다.', 'kubectl logs POD -c app --previous를 실행하고 종료 시각과 describe pod의 Last State를 대조하세요.']
  ],
  tracing: [
    ['하나의 충전 세션 요청 안에 Envoy 전달, API 처리, Kafka publish 같은 여러 작업이 있습니다. 각 단계의 시작·종료가 span으로 기록되고 같은 trace ID로 묶입니다.', '장애 추적 실습에서 Kafka의 1,200ms span을 찾고 로그 탭의 같은 trace ID를 대조하세요.'],
    ['앱이 OTLP로 Collector에 데이터를 보내면, Collector가 batch 처리를 한 뒤 저장소로 내보낼 수 있습니다. 중간 단계가 실패하면 앱 동작은 정상이어도 trace가 보이지 않을 수 있습니다.', 'SDK exporter, Collector의 수신·거절 지표, 내보내기 오류를 순서대로 확인하세요.'],
    ['오류율 급증 시 trace에서 느린 구간을 찾고 로그에서 타임아웃 내용을 확인합니다. 같은 시간대의 Ready replica가 그대로라면 Pod 교체가 원인인지 재검토할 수 있습니다.', 'Kafka 지연과 Readiness 장애를 실습에서 번갈아 골라 메트릭, 로그, 스팬, 이벤트가 어떻게 달라지는지 비교하세요.']
  ],
  diagnosis: [
    ['예를 들어 필수 설정이 빠진 앱이 시작 직후 종료되면 Pod는 뒤이어 CrashLoopBackOff를 보일 수 있습니다. 이 표시는 반복 종료에 따른 재시작 대기를 뜻합니다.', 'kubectl describe pod의 Last State의 이유·종료 코드와 kubectl logs --previous를 비교하세요.'],
    ['배포에 잘못된 이미지 태그를 넣으면 Pod가 노드에 배치되더라도 컨테이너를 시작하지 못합니다. 인증 실패와 태그 오타는 이벤트 메시지가 다를 수 있습니다.', 'Pod Events에서 image not found, unauthorized, 타임아웃 중 어떤 원인이 표시되는지 확인하세요.'],
    ['NODE가 비어 있으면 스케줄링 조건을 먼저 봅니다. 이미 NODE가 있다면 스케줄러를 통과했으므로 볼륨 마운트와 이미지 다운로드 등 시작 단계를 봅니다.', 'kubectl get pod -o wide와 describe pod Events를 함께 확인하세요.']
  ],
  helm: [
    ['같은 CSMS 차트에서 Service, Deployment, HPA를 템플릿으로 두고 컨테이너 이미지와 설정을 values로 넘길 수 있습니다. 환경마다 템플릿을 복사할 필요가 줄어듭니다.', '치트시트의 Chart.yaml, values.yaml, templates/service.yaml 예제로 값과 렌더링 리소스의 관계를 확인하세요.'],
    ['운영 값에서 servicePort를 8080에서 9090으로 바꾸면 렌더링된 Service의 port가 바뀝니다. 백엔드가 그 포트에서 실제로 요청을 받는지는 별도로 확인해야 합니다.', 'helm template csms ./chart -f values-prod.yaml로 출력된 YAML과 HTTPRoute의 backendRefs.port를 비교하세요.'],
    ['새 앱 이미지를 배포하고 문제가 생기면 직접 Helm으로 관리하는 릴리스에서 이전 리비전을 확인할 수 있습니다. 이미 실행된 DB 마이그레이션이 자동으로 되돌려지지는 않습니다.', 'helm history를 확인해 배포 순서와 리비전을 파악하고, Argo CD 관리 앱이라면 Git 변경을 되돌리는 절차도 확인하세요.']
  ],
  argocd: [
    ['Application에서 Git 저장소의 charts/csms와 values-prod.yaml을 지정하고 charging namespace를 대상으로 정합니다. Argo CD가 렌더링한 결과를 클러스터에 적용합니다.', 'argocd app get으로 source, destination, Sync와 Health를 확인하세요.'],
    ['운영자가 클러스터에서 이미지를 임시 변경하면 Git과 차이가 생깁니다. Self Heal이 켜져 있으면 Argo CD가 Git에 선언된 이미지로 되돌릴 수 있습니다.', 'GitOps 드리프트 실습에서 수동 변경 후 Self Heal을 켜고, 차이와 동기화 결과를 비교하세요.'],
    ['Storage나 정책을 먼저 적용하고 앱을 이후 wave에 둘 수 있습니다. ApplicationSet은 환경별 목록에서 유사한 Application을 생성할 수 있습니다.', '실제 생성 Application과 적용 순서를 확인하세요. 배포 전후 Job의 멱등성과 실패 처리도 검토합니다.']
  ],
  delivery: [
    ['공통 Deployment는 base에 두고 운영 overlay에서 replica 수나 requests를 변경합니다. 그 결과 맨 처음부터 운영 배포 파일을 따로 유지하지 않아도 됩니다.', 'kubectl kustomize로 실제 YAML을 출력해 어느 필드가 패치됐는지 비교하세요.'],
    ['CI가 이미지 빌드를 끝내면 배포 리포지토리의 이미지 태그 또는 digest 변경을 PR로 올릴 수 있습니다. 병합된 선언을 Argo CD가 적용합니다.', '배포 전 Git 리비전, CI 이미지 digest, 실행 중인 Pod imageID가 같은 배포를 가리키는지 추적하세요.'],
    ['카나리 트래픽을 10%부터 시작한 뒤 일정 기간 오류율과 p95를 봅니다. 오류율이 상승하면 추가 전환을 멈추고 기존 버전에 트래픽을 돌리는 정책을 검토합니다.', '라우팅 실습에서 비율을 바꿔 보고, 실제 배포에서는 해당 라우터 플러그인의 지원 여부와 분석 기준을 확인하세요.']
  ],
  eks: [
    ['EKS는 제어 영역을 운영하지만 API 서버에 접근할 수 있는 경로, IAM 권한, 워크로드 설정은 운영팀의 구성에 달려 있습니다.', 'kubectl이 타임아웃인지 Forbidden인지 구분하세요. 전자는 연결 경로, 후자는 접근 권한부터 확인할 단서입니다.'],
    ['EC2 기반 관리형 노드 그룹에서 노드 단위 에이전트를 운영할 수 있습니다. Fargate 또는 Auto Mode는 관리 범위와 지원 기능이 달라 컴퓨팅 선택에 영향을 줍니다.', '워크로드의 DaemonSet, 볼륨, 네트워크 요구 사항을 정리하고 공식 지원 범위를 비교하세요.'],
    ['사용 가능한 서브넷 IP가 부족하면 노드 CPU가 남아 있어도 새 Pod의 네트워크 생성이 실패할 수 있습니다. 다른 AZ에 자원이 있는지와 스케줄링 조건도 중요합니다.', 'VPC 서브넷의 여유 IP, CNI 에이전트 로그, Pod의 네트워크 관련 이벤트를 함께 보세요.']
  ],
  addons: [
    ['Pod IP 할당 실패는 CNI, 이름 조회 실패는 CoreDNS, ClusterIP 전달 문제는 데이터 플레인 구성을 점검하는 단서입니다.', 'aws eks list-addons와 kubectl get pods -n kube-system을 함께 확인해 설치 목록과 실행 상태를 대조하세요.'],
    ['EBS CSI를 설치해도 AWS API 호출 권한이 없으면 PVC 프로비저닝에 실패할 수 있습니다. Metrics Server가 없으면 kubectl top이나 CPU 기반 HPA가 지표를 얻지 못할 수 있습니다.', 'PVC 이벤트와 CSI 컨트롤러 로그, HPA의 지표 조건 등 증상에 맞는 위치부터 확인하세요.'],
    ['애드온 업그레이드 전에 현재 버전, 지원되는 버전, 사용자 정의 설정을 기록합니다. 변경 이후에는 새 Pod IP, DNS, 볼륨 마운트처럼 실제 기능을 검증합니다.', 'aws eks describe-addon으로 상태와 health.issues를 확인하세요.']
  ],
  identity: [
    ['사람의 IAM Role은 Access Entry 및 권한 설정을 거쳐 kubectl로 Kubernetes API에 접근할 수 있습니다. 앱이 S3를 읽을 권한은 앱의 AWS IAM 설정에서 따로 부여합니다.', 'CLI의 호출 주체를 확인하고 kubectl auth can-i와 AWS IAM 정책을 각각 확인하세요.'],
    ['charging의 csms-api ServiceAccount로 실행되는 Pod에 S3 읽기 역할을 연결할 수 있습니다. 지원 환경에서 AWS SDK는 기본 자격 증명 체인으로 임시 자격 증명을 가져옵니다.', 'Pod의 serviceAccountName, Pod Identity Association, Agent가 해당 노드에서 실행되는지 확인하세요.'],
    ['IRSA는 클러스터 OIDC 공급자와 ServiceAccount 연결을 사용합니다. Pod Identity는 클러스터의 Association과 Agent 구성에 의존합니다.', '권한 오류 시 IAM Role의 신뢰 정책, ServiceAccount 이름·네임스페이스, SDK 지원 여부를 확인하세요.']
  ],
  'eks-ops': [
    ['API 변경 요청을 조사할 때는 audit 로그가, Pod 내부 오류를 조사할 때는 애플리케이션 로그가 출발점이 될 수 있습니다. Container Insights는 클러스터와 워크로드 관측에 도움을 줍니다.', 'CloudWatch의 해당 로그 그룹과 유형이 활성화되어 있는지, 수집 시각과 보존기간도 확인하세요.'],
    ['같은 LoadBalancer Service라도 누가 프로비저닝하는지에 따라 적용할 클래스와 지원 설정이 달라집니다. Envoy는 만들어진 NLB 뒤에서 앱 라우팅을 처리합니다.', 'Service의 클래스, 이벤트, AWS 로드밸런서의 생성 상태를 비교해 담당 구현체를 확인하세요.'],
    ['먼저 요청이 NLB와 Envoy에 도달했는지 보고 백엔드 후보와 Pod 준비 상태를 확인합니다. 앱까지 도달했다면 느린 의존 서비스와 최근 배포를 조사합니다.', '실습의 HTTPRoute 실패와 Kafka 지연을 비교해 각 장애의 첫 조사 지점을 말해보세요.']
  ],
  'eks-upgrade': [
    ['업그레이드 대상 버전에서 제거된 API를 쓰는 배포가 있는지 확인합니다. Helm 렌더링 YAML과 설치된 컨트롤러 및 CRD의 지원 버전도 검토합니다.', 'EKS Upgrade Insights와 버전별 공식 업그레이드 가이드에서 클러스터별 사전 점검 결과를 확인하세요.'],
    ['노드 교체가 시작되면 Pod가 다른 노드로 이동할 수 있는지 확인합니다. 한 AZ에 종속된 EBS나 엄격한 affinity가 있으면 후보 노드가 적을 수 있습니다.', '소규모 노드 그룹부터 검증하고 PDB, Pod Pending, 지원 애드온 상태를 확인하세요.'],
    ['평소 요청량이 적은 워크로드는 실제 사용량을 바탕으로 requests 조정을 검토할 수 있습니다. 중단을 허용하는 배치와 트래픽 민감 API는 Spot 적용 기준이 다릅니다.', 'EC2뿐 아니라 로드밸런서, 로그 수집·보관, AZ 간 전송 비용과 사용량을 함께 보세요.']
  ]
});


stepDetails.karpenter=[
  ['예시의 csms-api Pod는 500m CPU와 1Gi 메모리, arm64와 AZ-A를 요구합니다. arm-workers NodePool이 arm64와 AZ-A/B를 허용하므로 공통 조건은 arm64·AZ-A입니다. 여기에 시스템 및 DaemonSet 리소스도 맞아야 합니다.','kubectl describe pod POD의 FailedScheduling 원인과 kubectl get nodepool arm-workers -o yaml의 requirements, taints, limits를 비교하세요.'],
  ['arm-workers의 nodeClassRef가 csms-default를 가리키면, Karpenter는 이 EC2NodeClass가 고른 AWS 서브넷, 보안 그룹과 AMI를 사용해 노드를 띄울 수 있는지 확인합니다. AZ-A를 요구하는 Pod라면 AZ-A에서 쓸 수 있는 서브넷도 필요합니다.','kubectl describe ec2nodeclass csms-default에서 준비 조건과 선택된 서브넷·AMI를 확인하세요.'],
  ['Pod 요구 사항과 두 설정이 맞으면 arm-workers-abc12 같은 NodeClaim이 생깁니다. 그림은 AWS 인스턴스가 시작돼 Launched가 기록됐지만 Kubernetes 등록 및 초기화는 아직 대기 중인 순간입니다.','kubectl get nodeclaims와 kubectl describe nodeclaim arm-workers-abc12에서 Launched 조건의 Status, Reason, Message를 확인하세요.'],
  ['EC2가 먼저 시작되고, kubelet이 API 서버에 접속해 Node로 등록합니다. 예시에서는 초기화까지 완료된 워커가 작업을 받을 수 있게 되고 Scheduler가 csms-api를 배정합니다. 애플리케이션의 Readiness 확인은 그 이후입니다.','NodeClaim 조건과 kubectl get nodes, kubectl get pod -o wide를 차례로 보세요. 등록이 멈췄다면 노드 부트스트랩과 API 연결을, Pod 실행이 멈췄다면 해당 Pod Events를 살펴보세요.']
];
