const groups = [
['기초와 워크로드','01','#78caaa',[
['cluster','클러스터는 어떻게 움직일까','kubectl 명령 하나가 컨테이너 실행으로 이어지는 여정을 따라갑니다.','kubectl,API Server,etcd,Scheduler,kubelet,Pod','https://kubernetes.io/docs/concepts/architecture/',
['요청|API 서버에 선언하기|kubectl apply가 원하는 Deployment 상태를 API 서버로 보냅니다. 인증과 인가, 어드미션 검사를 거칩니다.|API 서버는 클러스터 상태를 읽고 쓰는 관문입니다.|kubectl,API Server',
'저장|원하는 상태 기록하기|API 서버는 검증된 오브젝트를 etcd에 기록합니다. 컨트롤러는 API 변경을 감시합니다.|etcd는 오브젝트 상태를 보관합니다.|kubectl,API Server,etcd',
'조정|컨트롤러가 Pod 생성하기|Deployment 컨트롤러가 ReplicaSet을 만들고 ReplicaSet 컨트롤러가 필요한 수의 Pod 오브젝트를 생성합니다.|조정 루프는 실제 상태를 원하는 상태로 수렴시킵니다.|Deployment,ReplicaSet,Pod',
'배치|Scheduler가 노드 고르기|스케줄러가 미배치 Pod를 보고 요청 리소스와 제약을 평가한 뒤 노드 바인딩을 기록합니다.|필터링을 통과한 노드만 점수 계산에 들어갑니다.|API Server,Scheduler,Node',
'실행|kubelet이 컨테이너 시작하기|노드의 kubelet이 배정된 Pod를 읽고 CRI 런타임에 컨테이너 시작을 요청합니다. CNI가 Pod 네트워크를 구성합니다.|kubelet이 Pod와 조건 상태를 API 서버에 보고합니다.|Node,kubelet,CRI,Pod']],
['workloads','Pod · Deployment · StatefulSet','워크로드의 수명주기에 맞는 컨트롤러를 고릅니다.','Deployment,ReplicaSet,Pod','https://kubernetes.io/docs/concepts/workloads/controllers/',
['Pod|Pod와 컨테이너|같은 Pod의 컨테이너는 네트워크 네임스페이스를 공유합니다. init container는 앱 컨테이너 시작 전에 초기화 작업을 수행할 수 있습니다.|Pod가 교체되면 IP가 바뀔 수 있습니다.|Pod,init container,App container',
'롤아웃|Deployment 롤링 업데이트|Deployment는 새 ReplicaSet을 늘리고 기존 것을 줄입니다. maxSurge와 maxUnavailable로 전환 중 용량을 정합니다.|kubectl rollout status로 완료 여부를 확인합니다.',
'상태|StatefulSet과 영속성|StatefulSet은 각 Pod에 안정적인 이름을 부여합니다. volumeClaimTemplates로 Pod별 PVC를 제공할 수 있습니다.|StatefulSet만으로 데이터베이스 복제나 페일오버가 구성되지는 않습니다.|StatefulSet,Pod-0,PVC',
'노드·배치|DaemonSet과 Job|DaemonSet은 조건을 충족하는 노드에 에이전트를 배치합니다. Job은 성공 완료를 추적하고 CronJob은 일정에 맞춰 Job을 생성합니다.|로그 에이전트는 DaemonSet, 정기 배치는 CronJob에 어울립니다.|DaemonSet,Node agent,CronJob,Job']],
['probes','Probes · 롤아웃 · PDB','준비되지 않은 Pod를 트래픽에서 제외하고 유지보수 중 용량을 지킵니다.','kubelet,Probe,Pod,EndpointSlice','https://kubernetes.io/docs/concepts/workloads/pods/probes/',
['준비|Readiness가 요청 수신을 제어|readiness 검사 실패는 Pod를 Ready=false로 표시합니다. 일반 Service는 준비된 엔드포인트로 트래픽을 보냅니다.|Readiness 실패만으로 컨테이너를 재시작하지 않습니다.',
'재시작|Startup과 Liveness|startupProbe가 성공할 때까지 liveness와 readiness 검사를 지연합니다. liveness가 실패 임계값에 도달하면 컨테이너가 재시작됩니다.|외부 DB 일시 장애를 liveness 실패로 이어가면 연쇄 재시작이 발생할 수 있습니다.',
'중단|PDB와 자발적 중단|PodDisruptionBudget은 drain 같은 Eviction API 기반 자발적 중단을 제한합니다.|PDB의 허용 중단 수가 0이면 노드 drain이 대기할 수 있습니다.|Node drain,Eviction API,PDB,Pod']],
['config','ConfigMap · Secret · 스토리지','설정과 권한, 데이터 보존을 워크로드와 연결합니다.','Deployment,ConfigMap,Secret,Pod,PVC','https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
['설정|ConfigMap과 Secret|ConfigMap에는 일반 설정을, Secret에는 민감 설정을 보관합니다. 환경 변수나 볼륨으로 주입할 수 있습니다.|Secret의 base64는 인코딩입니다. RBAC와 저장 시 암호화도 확인하세요.',
'저장소|PVC에서 디스크까지|PVC는 용량과 접근 모드를 요청하고 PV가 실제 저장소를 나타냅니다. StorageClass는 CSI 동적 프로비저닝에 사용됩니다.|AZ 종속 디스크는 배치 조건을 고려하세요.|Pod,PVC,StorageClass,CSI,PV',
'격리|Namespace · RBAC · Quota|Role과 RoleBinding은 네임스페이스 범위의 접근 권한을 부여합니다. ResourceQuota와 LimitRange로 사용량과 기본값을 관리할 수 있습니다.|ServiceAccount와 용도별 최소 권한을 적용합니다.|ServiceAccount,RoleBinding,Role,API Server']]
]],
['배치와 오토스케일링','02','#e4b77c',[
['affinity','Affinity · Taints · Topology Spread','노드 선택과 AZ 분산을 스케줄러 관점에서 실험합니다.','Pending Pod,Scheduler,Node A,Node B,Node C','https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/',
['필터|Node Affinity의 필수 조건|requiredDuringScheduling은 노드 라벨을 기준으로 후보를 제한합니다. 후보가 없으면 Pod는 Pending입니다.|kubectl describe pod의 FailedScheduling 이벤트를 확인합니다.',
'가중치|Preferred · Pod Affinity|preferred는 후보 점수에 반영됩니다. Pod affinity와 anti-affinity는 다른 Pod의 라벨과 topologyKey를 조합합니다.|required anti-affinity는 설계에 따라 확장 가능한 Pod 수를 제한합니다.',
'격리|Taint와 Toleration|NoSchedule taint를 허용하는 toleration이 있으면 노드가 후보로 남을 수 있습니다.|toleration만으로는 노드가 선택되지 않습니다. 전용 풀에는 node affinity도 함께 사용합니다.',
'분산|Topology Spread Constraints|maxSkew는 topology 도메인 사이의 허용 편차를 정합니다. DoNotSchedule은 제약을 강제하고 ScheduleAnyway는 분산을 선호합니다.|AZ와 노드 단위 분산은 서로 다른 topologyKey를 사용합니다.']],
['hpa','HPA · VPA · KEDA','Pod 수, Pod 크기, 이벤트 기반 확장의 차이를 확인합니다.','Metrics API,HPA,Deployment,ReplicaSet,Pod','https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/',
['측정|CPU 사용률 측정|CPU 기반 HPA는 평균 사용량을 CPU requests 대비 비율로 평가합니다. Resource Metrics API는 보통 Metrics Server가 제공합니다.|CPU requests가 없으면 사용률 계산에 문제가 생깁니다.',
'계산|HPA가 원하는 replica 계산|기본 계산은 ceil(현재 replica × 현재 지표 ÷ 목표 지표)입니다. 실제 제어에는 허용 오차, 누락된 지표 보정, 안정화, 증감 정책이 들어갑니다.|HPA는 scale 서브리소스를 통해 Deployment의 희망 Pod 수를 바꿉니다.',
'대안|VPA와 KEDA|VPA는 Pod 리소스 요청에 대한 권장값과 정책 기반 적용을 제공합니다. KEDA는 큐 길이 같은 이벤트 지표로 스케일링을 구동합니다.|VPA와 CPU 기반 HPA가 같은 리소스를 제어하면 서로 영향을 줄 수 있습니다.|Queue,KEDA,HPA,Deployment,Pod']],
['node-scale','Karpenter · Cluster Autoscaler','스케줄할 노드가 부족할 때 인프라 용량이 늘어나는 과정을 따라갑니다.','Pending Pod,Provisioner,EC2,Node,Running Pod','https://docs.aws.amazon.com/eks/latest/userguide/autoscaling.html',
['시작|HPA와 노드 확장 연결|HPA가 replica를 늘려도 노드에 공간이 없으면 새 Pod는 미배치 상태입니다. 노드 오토스케일러는 이런 Pod를 기준으로 용량을 검토합니다.|HPA는 Pod 용량, 노드 오토스케일러는 인프라 용량을 담당합니다.',
'CA|Cluster Autoscaler|기존 노드 그룹의 템플릿을 사용해 Pod가 배치될 수 있는지 평가하고 해당 그룹의 크기를 조정합니다.|그룹의 최대 크기와 노드 라벨·taint가 배치 결과에 영향을 줍니다.|Pending Pod,Cluster Autoscaler,Node Group,EC2',
'Karpenter|NodePool · EC2NodeClass · NodeClaim|Karpenter는 NodePool과 Pod 요구 사항으로 인스턴스 선택지를 평가합니다. EC2NodeClass는 서브넷·보안 그룹·AMI 같은 AWS 설정을 지정합니다.|NodeClaim으로 프로비저닝과 노드 등록을 추적합니다.|Pending Pod,NodePool,EC2NodeClass,NodeClaim,EC2',
'축소|통합과 안전한 종료|Karpenter의 통합은 정책에 따라 노드를 제거하거나 바꿀 수 있습니다. 중단 예산, PDB, Spot 인터럽트와 종료 시간을 함께 검토합니다.|노드 비용을 낮추려면 Pod requests와 실제 사용량을 함께 살펴보세요.|Karpenter,Disruption budget,PDB,Node']],
['karpenter','Karpenter · NodePool부터 워커 등록까지','Pending Pod에 맞는 노드가 만들어지고 Kubernetes에 합류하는 네 단계를 따라갑니다.','Pending Pod,NodePool,EC2NodeClass,NodeClaim,EC2 Node','https://karpenter.sh/docs/concepts/nodeclaims/',
['조건 비교|Pod 요구 사항을 NodePool과 맞추기|Karpenter는 아직 배치되지 않은 Pod의 CPU·메모리 요청과 노드 선택 조건을 확인합니다. NodePool에 허용된 아키텍처, 영역, 용량 유형과 겹치는 조합을 찾습니다.|Pool 제약, taint, 리소스 요청을 만족할 조합이 없으면 해당 Pool로 노드를 만들 수 없습니다.',
'생성 설정|EC2NodeClass에서 AWS 설정 가져오기|NodePool의 nodeClassRef가 EC2NodeClass를 가리킵니다. EC2NodeClass에는 서브넷, 보안 그룹, AMI를 고르는 조건과 노드에 사용할 IAM 역할 또는 인스턴스 프로파일 설정이 들어갑니다.|NodePool은 어떤 노드를 허용할지, EC2NodeClass는 AWS에서 어떤 설정으로 띄울지 다룹니다.',
'생성 요청|NodeClaim으로 한 노드의 수명주기 추적하기|Karpenter가 호환되는 NodePool과 EC2NodeClass를 찾으면 필요한 용량을 담은 NodeClaim을 생성합니다. 클라우드 공급자가 인스턴스를 시작하면 Launched 조건에서 진행 상황을 볼 수 있습니다.|NodeClaim 하나를 생성할 노드 하나의 요청 및 상태 기록으로 읽으면 쉽습니다.',
'워커 등록|EC2 시작 · 등록 · 초기화 구분하기|인스턴스에서 kubelet이 클러스터에 등록하면 Registered가 갱신됩니다. 노드가 준비되고 필요한 리소스가 보고되며 시작용 taint가 해제되는 등의 초기화 요건을 통과하면 Initialized를 확인할 수 있습니다.|Kubernetes Scheduler가 Pod를 배정하고, 워커의 kubelet이 컨테이너를 실행합니다.']]
]],
['네트워크와 Gateway API','03','#86aecf',[
['service','Service · DNS · CNI','Pod IP가 바뀌어도 안정적인 이름으로 요청을 전달합니다.','Client,CoreDNS,Service,EndpointSlice,Pod','https://kubernetes.io/docs/concepts/services-networking/service/',
['발견|DNS와 Service 이름|CoreDNS가 Service 이름을 해석합니다. ClusterIP는 클러스터 내부용 가상 IP이고 Headless Service는 엔드포인트 주소 검색에 사용할 수 있습니다.',
'전달|Selector와 EndpointSlice|Service selector와 일치하는 Pod의 주소 및 준비 상태는 EndpointSlice에 반영됩니다. EndpointSlice는 데이터 플레인이 참조하는 정보입니다.|Service에 연결되는 Pod가 없으면 label과 readiness부터 확인합니다.',
'경계|Service 유형과 NetworkPolicy|NodePort는 노드 포트를 노출하고 LoadBalancer는 구현체에 외부 LB 프로비저닝을 요청합니다. NetworkPolicy는 지원하는 CNI에서 Pod 트래픽을 제한합니다.|DNS 조회와 실제 연결 성공은 별도로 검증합니다.']],
['gateway','GatewayClass · Gateway · HTTPRoute','역할과 리소스 관계를 잡고 HTTP 라우팅을 추적합니다.','GatewayClass,Gateway,HTTPRoute,Service,Pod','https://gateway-api.sigs.k8s.io/docs/concepts/api-overview/',
['역할|GatewayClass가 구현체 지정|GatewayClass는 controllerName으로 어떤 구현체가 Gateway를 관리할지 지정합니다. Gateway와 HTTPRoute는 각각 진입점과 앱 라우팅 규칙을 선언합니다.|Gateway API의 실제 동작은 CRD와 호환 컨트롤러가 함께 제공합니다.',
'리스너|Gateway에서 리스너 열기|Gateway listener는 프로토콜, 포트, 호스트, 연결 허용 정책을 정의합니다. HTTPS 종료는 인증서 Secret을 사용할 수 있습니다.|Gateway의 Accepted와 Programmed 조건을 확인합니다.',
'연결|HTTPRoute를 Gateway에 붙이기|HTTPRoute의 parentRefs가 Gateway를 가리키고, Gateway의 allowedRoutes가 해당 Route 연결을 허용해야 합니다. sectionName으로 리스너를 지정할 수 있습니다.|Route의 status.parents에서 Accepted와 ResolvedRefs를 확인합니다.',
'경로|일치 규칙과 백엔드 선택|호스트를 확인한 다음 path·method·header 등 규칙에 따라 backendRefs로 전달합니다. 가중치는 여러 백엔드에 비율을 나누는 데 쓰입니다.|참조하는 포트는 Service 포트입니다.|Client,Gateway,HTTPRoute,Service,Pod',
'필터|리다이렉트 · Rewrite · 미러링|RequestRedirect는 클라이언트에 리다이렉트 응답을 보냅니다. URLRewrite는 전달 경로를 바꾸고 RequestMirror는 별도 백엔드로 복제합니다.|Extended 기능은 구현체의 해당 버전 conformance를 확인하세요.|Client,HTTPRoute,Filter,Service']],
['routes','GRPC · TLS · TCP · UDP Route','요청 프로토콜에 맞는 Route와 리스너를 선택합니다.','Client,Listener,Route,Service','https://gateway-api.sigs.k8s.io/docs/concepts/api-overview/',
['HTTP·gRPC|HTTPRoute와 GRPCRoute|HTTPRoute는 HTTP 의미에 맞춰 경로·헤더 등을 평가합니다. GRPCRoute는 gRPC 서비스나 메서드 기준으로 매칭할 수 있습니다.|Gateway 리스너의 supportedKinds와 구현체 지원을 확인합니다.',
'TLS|종료와 Passthrough|HTTPS 리스너에서 TLS를 종료하면 HTTP 내용을 읽어 라우팅합니다. TLS passthrough는 암호화를 유지한 채 SNI를 기준으로 라우팅할 수 있습니다.|Passthrough에서 HTTP 경로를 읽을 수 없습니다.|TLS Client,SNI,TLSRoute,TLS Backend',
'L4|TCPRoute와 UDPRoute|TCP와 UDP용 Route를 사용해 해당 전송 프로토콜 흐름을 백엔드에 연결합니다.|설치한 CRD 채널과 구현체 버전에서 필요한 Route 종류의 지원 여부를 확인하세요.|L4 Client,TCP/UDP Listener,L4 Route,Service']],
['reference','ReferenceGrant · BackendTLS · 상태','교차 참조와 클라이언트·백엔드 간 TLS 경계를 점검합니다.','Client,Gateway,Route,BackendTLSPolicy,Backend','https://gateway-api.sigs.k8s.io/reference/api-types/referencegrant/',
['참조|교차 네임스페이스의 권한|다른 네임스페이스의 Service나 Secret을 참조할 때 대상 네임스페이스에 ReferenceGrant를 둡니다. Gateway-Route 연결은 listener의 allowedRoutes로 제어합니다.|ReferenceGrant는 참조 받는 리소스 소유자가 승인합니다.',
'TLS|BackendTLSPolicy|BackendTLSPolicy는 Gateway에서 백엔드까지의 TLS에 대한 호스트와 인증서 검증 설정을 제공합니다.|프런트엔드 TLS와 업스트림 TLS는 별도 연결입니다.',
'진단|조건으로 원인 나누기|Gateway가 Programmed인지 확인한 다음 Route의 Accepted와 ResolvedRefs, Service와 EndpointSlice를 순서대로 봅니다.|상태의 메시지와 observedGeneration도 함께 확인합니다.']]
]],
['Envoy Gateway','04','#b4acf0',[
['envoy','컨트롤 플레인 · Envoy Proxy · xDS','선언형 Gateway API가 실제 프록시 설정으로 바뀌는 흐름을 봅니다.','Gateway API,Envoy Gateway,xDS,Envoy Proxy,Service','https://gateway.envoyproxy.io/docs/concepts/architecture/',
['선언|GatewayClass와 Envoy Gateway|Envoy Gateway 컨트롤러가 자신이 담당하는 Gateway API 리소스와 정책을 관찰합니다.',
'변환|Envoy 설정으로 변환|컨트롤러는 리스너·라우트·백엔드 정보를 프록시 설정으로 변환하고 xDS로 전달합니다.|컨트롤러 상태와 Envoy 프록시 상태를 분리해서 디버깅합니다.',
'전달|Envoy Proxy가 실제 요청 처리|Envoy Proxy가 리스너에서 연결을 받고 필터와 라우트 설정을 적용합니다.|실제 요청은 컨트롤러를 통과하지 않습니다.|Client,Envoy Proxy,Backend Service,Pod']],
['envoy-policy','Envoy Gateway 정책과 확장','인증, 연결, 업스트림 트래픽 및 프록시 인프라를 제어합니다.','Client,ClientTrafficPolicy,SecurityPolicy,Envoy Proxy,BackendTrafficPolicy,Service','https://gateway.envoyproxy.io/docs/concepts/gateway_api_extensions/',
['보안|SecurityPolicy|JWT 또는 OIDC, 외부 인가(ext_authz), CORS, 기타 인증 옵션을 정책으로 적용할 수 있습니다.|프록시 접근 로그에서 인증 실패 상태와 업스트림 실패를 구분합니다.',
'연결|ClientTrafficPolicy|클라이언트와 Envoy 사이의 연결 설정을 관리합니다. 프록시 프로토콜, 클라이언트 IP 처리, 연결 한도 등은 사용 버전의 API를 확인합니다.',
'업스트림|BackendTrafficPolicy|Envoy에서 백엔드로 향하는 타임아웃, 재시도, 로드밸런싱, 차단과 레이트 리밋 등 정책 지원 범위를 확인합니다.|재시도는 전체 타임아웃과 요청의 멱등성을 함께 고려합니다.',
'인프라|EnvoyProxy와 운영 설정|EnvoyProxy로 데이터 플레인 Deployment와 Service, 텔레메트리 설정을 조정할 수 있습니다. 프록시 부하와 백엔드 부하를 각각 모니터링합니다.|설치 버전의 확장 CRD와 지원 정책 범위를 확인합니다.|Gateway,EnvoyProxy,Proxy Deployment,Proxy Service']],
['envoy-nlb','EKS에서 NLB + Envoy Gateway','AWS의 L4 로드밸런서와 Envoy의 HTTP 라우팅을 연결합니다.','Client,AWS NLB,Envoy Proxy,HTTPRoute,Service,Pod','https://docs.aws.amazon.com/eks/latest/userguide/network-load-balancing.html',
['생성|Envoy Proxy Service가 NLB 요청|EnvoyProxy에서 데이터 플레인 Service를 LoadBalancer로 구성합니다. AWS Load Balancer Controller 또는 EKS Auto Mode에 맞는 loadBalancerClass와 설정을 사용합니다.|AWS가 NLB를 프로비저닝하고 Envoy가 Gateway API 라우팅을 처리합니다.',
'대상|IP 타깃과 인스턴스 타깃|IP 타깃은 Envoy Pod 주소에, 인스턴스 타깃은 노드와 NodePort에 전달하는 방식입니다. 선택한 구성에 맞춰 대상 그룹 헬스 체크를 확인합니다.|NLB 타깃은 Envoy 프록시 계층입니다.',
'흐름|L4 전달 뒤 L7 라우팅|예시 구성은 NLB TCP 리스너가 연결을 Envoy로 전달하고 Envoy Gateway의 HTTPS 리스너가 TLS를 종료합니다. HTTPRoute가 앱 Service를 선택합니다.|NLB의 TCP 전달과 Envoy의 HTTP 라우팅을 분리해서 관찰합니다.',
'진단|503과 연결 실패 구별하기|NLB 타깃이 Unhealthy라면 AWS 헬스 체크와 포트를 봅니다. Envoy가 HTTP 503을 반환하면 Route·업스트림 endpoints·Envoy 응답 플래그를 확인합니다.|대상 그룹, Gateway 상태, HTTPRoute 상태, Pod Ready 순서로 좁힙니다.']]
]]
];
groups.push(
['옵저빌리티와 장애 대응','05','#e19386',[
['metrics','Prometheus · Grafana · Alertmanager','리소스 사용량과 사용자 영향을 함께 확인합니다.','App / kubelet,Prometheus,Grafana,Alertmanager','https://kubernetes.io/docs/concepts/cluster-administration/observability/',
['수집|메트릭 수집과 역할 구분|Prometheus는 앱과 시스템의 메트릭을 스크레이프합니다. kube-state-metrics는 API 오브젝트의 상태를 내보냅니다. Metrics Server는 HPA와 kubectl top에 리소스 사용량을 제공합니다.|세 구성요소의 데이터와 사용 목적이 다릅니다.',
'해석|RED와 지연 분포|요청률, 오류율, 지속 시간을 서비스 단위로 봅니다. histogram bucket으로 p95를 추정하고 평균이 감춘 지연을 확인합니다.|버킷 경계와 라벨 카디널리티가 비용과 정확도에 영향을 줍니다.',
'알림|경보 규칙과 알림 라우팅|Prometheus 규칙이 조건을 평가하고 Alertmanager가 알림을 그룹화, 라우팅, 억제합니다.|CPU만으로 고객 영향을 판단하기보다 오류율·지연과 SLO를 함께 봅니다.']],
['logging','로그 · Loki · CloudWatch Logs','컨테이너 로그 수집과 빠른 장애 역추적을 학습합니다.','Container stdout,Fluent Bit / Alloy,Loki / CloudWatch,Query','https://kubernetes.io/docs/concepts/cluster-administration/logging/',
['발생|표준 출력 구조화|애플리케이션은 stdout/stderr에 구조화된 로그를 남깁니다. service·namespace·trace_id를 일관된 필드로 기록합니다.|trace ID 같은 고유값은 Loki 인덱스 라벨과 분리합니다.',
'수집|노드 에이전트에서 저장소로|Fluent Bit이나 Grafana Alloy를 사용해 컨테이너 로그를 수집하고 Loki 또는 CloudWatch Logs로 전송할 수 있습니다.|보존기간과 민감 필드 필터링을 설정합니다.',
'진단|kubectl logs와 previous|컨테이너가 재시작했다면 kubectl logs POD -c APP --previous로 직전 인스턴스의 로그를 확인합니다.|장기 조회에는 중앙 로그 저장소가 필요합니다.|Operator,kubectl logs,Previous container']],
['tracing','OpenTelemetry · 트레이스 · 이벤트','요청 ID 하나로 애플리케이션과 인프라 신호를 연결합니다.','Envoy,CSMS API,Kafka / DB,OTel Collector,Trace Backend','https://opentelemetry.io/docs/concepts/signals/traces/',
['추적|Trace와 Span|Envoy와 CSMS API, 의존 서비스에서 트레이스 컨텍스트가 이어지면 하나의 trace에서 여러 span을 비교할 수 있습니다.|Kafka의 비동기 전달도 생산자와 소비자의 컨텍스트 전파를 계측합니다.',
'파이프라인|Collector와 내보내기|Collector가 OTLP 데이터를 받고 batch 같은 처리를 한 뒤 Tempo, Jaeger 또는 AWS 호환 백엔드로 전송할 수 있습니다.|샘플링 정책이 희귀 오류를 얼마나 남길지 결정합니다.',
'상관분석|메트릭에서 이벤트까지|p95 급증 시점의 trace에서 느린 span을 찾고 trace_id로 로그를 조회합니다. 배포나 FailedScheduling 같은 Kubernetes 이벤트도 시간축에서 비교합니다.|Kubernetes 이벤트는 감사 로그나 장기 로그 보존을 대신하지 않습니다.']]
]],
['Helm과 GitOps','06','#d6b292',[
['helm','Helm Chart · Values · Release','차트를 렌더링하고 환경별 값, 릴리스 수명주기를 다룹니다.','Chart.yaml,values.yaml,templates,Rendered YAML,Release','https://helm.sh/docs/topics/charts/',
['구조|Chart 구성|Chart.yaml은 메타데이터, values.yaml은 기본 구성, templates/는 렌더링할 리소스 템플릿을 담습니다. 의존 차트는 Chart.yaml에 선언할 수 있습니다.',
'검증|환경별 Values와 렌더링|helm lint로 차트를 검사하고 helm template -f values-prod.yaml로 적용 전 매니페스트를 검토합니다.|민감 값을 평문 values에 커밋하지 않습니다.',
'릴리스|설치 · 업그레이드 · 롤백|helm upgrade --install로 릴리스를 생성하거나 변경하고 helm history로 기록을 확인합니다. 직접 관리하는 Helm 릴리스는 helm rollback으로 되돌릴 수 있습니다.|CRD 업그레이드와 데이터베이스 변경은 별도로 검토합니다.']],
['argocd','GitOps · Argo CD · ApplicationSet','Git에 선언한 상태와 Kubernetes 실상태를 비교하고 동기화합니다.','Git PR,Argo CD,Diff,Sync,EKS','https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/',
['선언|Application이 소스와 대상을 연결|Application의 source는 Git 경로 또는 Helm 차트, destination은 클러스터와 네임스페이스를 지정합니다. AppProject로 배포 가능 범위를 제한할 수 있습니다.|Argo CD는 Helm 차트를 렌더링하고 동기화를 관리합니다.',
'동기화|Diff · Automated Sync · Self Heal|Argo CD가 원하는 상태와 실상태를 비교합니다. 자동 동기화, live drift의 selfHeal, Git에서 삭제한 리소스를 제거하는 prune을 정책에 맞게 선택합니다.|HPA가 관리하는 replicas 필드가 GitOps와 충돌하는지 점검합니다.',
'순서|Sync Waves · Hooks · ApplicationSet|sync-wave를 통해 생성 순서를 조정하고 Sync Hook으로 배포 전후 작업을 실행할 수 있습니다. ApplicationSet generator는 여러 Application을 만들 수 있습니다.|배포 소스를 되돌릴 때는 일반적으로 Git 변경을 되돌려 다시 동기화합니다.']]
]],
['AWS EKS 운영','07','#93bf92',[
['eks','EKS 아키텍처 · 노드 · VPC','AWS 관리형 제어 영역과 워크로드 영역의 책임을 구분합니다.','EKS API,Managed control plane,VPC,EC2 Node Group,Pod','https://docs.aws.amazon.com/eks/latest/best-practices/control-plane.html',
['책임|관리형 컨트롤 플레인|AWS가 API 서버와 etcd 등 제어 영역의 가용성을 관리합니다. 운영자는 워크로드, 네트워크 설계, 클러스터 접근 및 업그레이드 계획을 관리합니다.',
'컴퓨팅|관리형 노드 그룹과 대안|Managed Node Group은 EC2 워커의 그룹 수명주기를 관리합니다. 요구 사항에 따라 Fargate 또는 EKS Auto Mode도 검토할 수 있습니다.|DaemonSet, 스토리지, 컴퓨팅 제약을 비교하세요.',
'네트워크|VPC · 서브넷 · 엔드포인트|VPC CNI를 사용하는 EC2 Pod는 구성에 따라 VPC 주소를 사용합니다. 다중 AZ와 서브넷 가용 IP, API 엔드포인트 접근 경로를 계획합니다.|Pod Pending 또는 생성 실패 시 CPU뿐 아니라 서브넷 IP도 확인합니다.']],
['addons','EKS Add-ons · CNI · CSI','기본 애드온과 워크로드별 확장을 운영합니다.','EKS Add-ons,VPC CNI,CoreDNS,kube-proxy,EBS CSI,Pod Identity Agent','https://docs.aws.amazon.com/eks/latest/userguide/eks-add-ons.html',
['기본|VPC CNI · CoreDNS · kube-proxy|VPC CNI는 Pod 네트워크, CoreDNS는 서비스 이름 확인, kube-proxy는 서비스 전달 규칙의 기본 구현을 담당합니다.|클러스터 모드에 따라 AWS 관리 방식과 설치 상태가 달라집니다.',
'확장|EBS CSI · Metrics Server · ADOT|EBS CSI로 블록 스토리지를 제공하고, Metrics Server는 리소스 지표 API, ADOT는 OpenTelemetry 기반 수집에 사용할 수 있습니다.|EBS CSI의 AWS IAM 권한과 AZ 배치를 확인합니다.',
'업그레이드|호환 버전과 변경 검증|EKS 애드온 버전과 Kubernetes 버전의 호환성을 확인하고 구성 충돌 처리와 변경 설정을 검토합니다.|업데이트 후 DNS, Pod IP 할당, 볼륨 연결, 메트릭 API를 확인합니다.']],
['identity','EKS Pod Identity · IRSA · Access Entries','클러스터 사용자와 워크로드의 AWS 권한을 분리합니다.','Pod,ServiceAccount,Pod Identity Agent,EKS Auth,IAM Role,AWS API','https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html',
['접근|EKS Access Entries와 RBAC|Access Entry는 AWS IAM principal의 클러스터 접근에 사용합니다. 연결된 EKS Access Policy 또는 Kubernetes 그룹과 RBAC로 권한을 부여합니다.|관리자 접근과 Pod의 AWS API 권한은 별개입니다.|IAM Principal,Access Entry,EKS API,RBAC',
'워크로드|Pod Identity Association|Association이 클러스터·네임스페이스·ServiceAccount를 IAM Role에 연결합니다. 지원되는 노드 구성에서 Agent가 EKS Auth로 임시 자격 증명을 얻습니다.|Pod는 지원되는 AWS SDK 자격 증명 체인을 사용합니다.',
'비교|IRSA와 Pod Identity|IRSA는 클러스터 OIDC 공급자와 AssumeRoleWithWebIdentity를 사용합니다. Pod Identity는 Association과 Agent를 사용하는 흐름입니다.|AWS SDK 버전, 컴퓨팅 모드, 역할 신뢰 정책, 최소 권한을 검증합니다.']],
['eks-ops','EKS 운영 · CloudWatch · 장애 점검','AWS와 Kubernetes 경계를 차례로 검증합니다.','Client,NLB,Envoy,CSMS API,ADOT,CloudWatch','https://docs.aws.amazon.com/eks/latest/userguide/observability.html',
['로그|제어 영역 로그와 Container Insights|EKS 제어 영역 로그는 유형별로 CloudWatch Logs 전송을 설정할 수 있습니다. Container Insights는 워크로드와 노드 관측에 사용할 수 있습니다.|수집 비용과 보존기간을 확인합니다.',
'구성|EKS 데이터 플레인 옵션|AWS Load Balancer Controller와 EKS Auto Mode의 API·설정 지원 범위를 확인합니다. Envoy Gateway를 쓰는 NLB 예제는 L4 전달과 L7 정책을 나눕니다.',
'대응|운영 점검 순서|AWS 대상 그룹, Envoy Gateway 상태, HTTPRoute, Service의 EndpointSlice, Pod 이벤트와 로그를 대조합니다. Git 변경 이력과 지연·오류율 상승 시점도 비교합니다.|실습의 CSMS 장애 대시보드에서 이 순서를 따라갈 수 있습니다.']]
]]
);

groups[0][3].push(
['resources','Requests · Limits · QoS · Eviction','CPU 제한과 메모리 초과, 노드 압박으로 발생하는 중단을 구분합니다.','Pod spec,Scheduler,kubelet,cgroups,Container','https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
 ['배치|Requests와 노드 용량|Scheduler는 노드의 allocatable과 기존 Pod 요청량을 바탕으로 새 Pod가 들어갈 수 있는지 확인합니다.|실제 사용 CPU가 낮아도 요청량을 기준으로는 공간이 부족할 수 있습니다.',
  '런타임|CPU throttling과 OOMKilled|CPU 제한을 초과하면 실행이 제한될 수 있습니다. 메모리 제한을 넘긴 프로세스는 OOM으로 종료될 수 있습니다.|CPU throttling과 Pod 재시작 횟수를 함께 비교합니다.',
  '노드 압박|QoS와 Eviction|리소스 설정에 따라 Guaranteed, Burstable, BestEffort QoS가 부여됩니다. kubelet은 노드 압박 시 우선순위와 요청 대비 사용량 등을 고려해 Pod를 종료할 수 있습니다.|OOMKilled와 Evicted는 원인과 진단 경로가 다릅니다.']],
['security','RBAC · Admission · Pod Security','API 접근부터 컨테이너 실행 정책까지 정책 적용 지점을 확인합니다.','Client,Authentication,RBAC,Admission,API Object','https://kubernetes.io/docs/concepts/security/',
 ['접근|인증과 RBAC|API 서버가 호출 주체를 인증한 뒤 RBAC 등 인가 설정으로 verb·resource·namespace를 평가합니다.|kubectl auth can-i로 현재 계정의 작업 권한을 확인합니다.',
  '검사|Admission과 Pod Security Standards|Admission 단계에서 요청된 오브젝트를 변경하거나 검증할 수 있습니다. Pod Security Admission은 네임스페이스에서 수준과 enforce, audit, warn 모드를 제어합니다.',
  '실행|ServiceAccount와 Security Context|Pod에 전용 ServiceAccount를 주고 필요한 컨테이너 권한만 허용합니다. runAsNonRoot, seccompProfile, capabilities 등을 검토합니다.|API 권한과 컨테이너 OS 권한을 각각 검토합니다.']],
['extensions','CRD · Operator · Webhook','새 리소스 타입을 등록하고 컨트롤러가 원하는 상태를 조정하는 방식을 봅니다.','Custom Resource,API Server,Operator,Managed Resources','https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/',
 ['스키마|CRD로 Kubernetes API 확장|CustomResourceDefinition이 API 그룹, 버전, 스키마, 스코프를 등록합니다.|kubectl explain으로 설치된 버전의 스키마를 살펴봅니다.',
  '조정|Operator의 Reconciliation|Operator는 도메인 설정을 읽고 하위 오브젝트를 조정하며 status에 관찰된 상태를 기록할 수 있습니다.|CRD 설치와 컨트롤러 정상 실행을 각각 확인합니다.',
  '수명주기|Finalizer와 Webhook|Finalizer는 삭제 전 정리 작업을 가능하게 합니다. Webhook은 설정에 따라 인가 이후 요청의 변경·검증에 참여하거나 CRD 버전을 변환할 수 있습니다.|Webhook 서비스 장애와 최종 정리 상태를 고려해 운영합니다.']]
);
groups[2][3].push(
['migration','Ingress 이전 · Conformance · GAMMA','Ingress와 Gateway API의 역할 모델을 비교하고 구현체 지원을 확인합니다.','Ingress,GatewayClass,Gateway,Route,Conformance','https://gateway-api.sigs.k8s.io/docs/introduction/',
 ['이전|Ingress에서 역할 분리|Ingress는 HTTP 진입 규칙을 선언합니다. Gateway API는 인프라 운영자, 클러스터 운영자, 앱 팀이 Class, Gateway, Route로 책임을 분리할 수 있습니다.',
  '호환성|Standard · Experimental · Conformance|릴리스 채널은 API의 수명주기를, Core와 Extended는 기능 지원 수준을 설명합니다. 실제로 설치한 컨트롤러 버전의 conformance 보고서에서 필요한 기능을 확인합니다.',
  '메시|GAMMA의 서비스 간 라우팅|메시 구현체는 지원 범위에 따라 Route가 Service에 연결되는 모델을 사용할 수 있습니다.|클러스터 외부 진입점과 서비스 간 트래픽 정책의 적용 범위를 구분합니다.|Service A,Mesh Route,Service B']]
);
groups[3][3].push(
['envoy-ops','Envoy 설치 · 확장 · 장애 진단','CRD, 컨트롤러, 데이터 플레인을 순서대로 검증합니다.','GatewayClass,Gateway,Envoy Service,Envoy Pod,Upstream','https://gateway.envoyproxy.io/docs/',
 ['설치|Helm과 버전 일치|Gateway API CRD와 Envoy Gateway 확장 CRD를 확인하고 사용 버전의 설치 가이드에 따라 컨트롤러를 설치합니다.|CRD 설치 순서와 중복 소유권을 관리합니다.',
  '확장|표준 API와 Envoy 전용 설정|EnvoyPatchPolicy나 EnvoyExtensionPolicy 등은 구현체 확장에 해당합니다. 적용 범위와 기능 활성화 요구 사항을 버전별로 확인합니다.',
  '운영|502 · 503 · 504 구분|응답 상태와 Envoy response flags, Gateway 또는 Route 상태, backend endpoint 및 upstream 연결 오류를 비교합니다.|업스트림 문제와 프록시 자체 장애를 구분하려면 프록시 메트릭과 access log를 함께 확인합니다.']]
);
groups[4][3].push(
['diagnosis','CrashLoopBackOff · ImagePull · Pending','Pod 상태와 이벤트를 읽고 장애 조사 순서를 정합니다.','kubectl get,Pod Conditions,Events,Container Logs,Root Cause','https://kubernetes.io/docs/tasks/debug/',
 ['재시작|CrashLoopBackOff|컨테이너가 반복 종료되어 kubelet이 재시작을 지연합니다. 종료 이유와 코드, previous 로그를 확인합니다.|Startup/Liveness 실패, 앱 설정 오류, OOM을 비교합니다.',
  '이미지|ErrImagePull과 ImagePullBackOff|이벤트에서 이미지 이름이나 태그, 레지스트리 인증, 네트워크 오류를 확인합니다.',
  '대기|Pending의 배치와 시작 원인|스케줄러가 노드를 못 찾는 경우와 바인딩 후 볼륨 연결이나 이미지 다운로드를 기다리는 경우를 Pod 조건과 이벤트에서 구분합니다.']]
);
groups[5][3].push(
['delivery','Kustomize · Argo Rollouts · 점진 배포','환경별 오버레이와 트래픽 기반 배포 전략을 확인합니다.','Git PR,CI Image,GitOps Sync,Stable,Canary','https://argo-rollouts.readthedocs.io/',
 ['변형|Kustomize Base와 Overlay|공통 리소스를 base에 두고 환경별 overlay로 패치합니다. kubectl kustomize로 렌더링 결과를 검토합니다.',
  '배포|CI와 GitOps 배포 분리|CI가 이미지를 빌드하고 Git에 사용할 이미지 버전을 반영합니다. Argo CD는 선언을 동기화합니다.',
  '검증|Canary · Blue/Green과 분석|Argo Rollouts는 점진 배포 전략과 분석 단계를 관리할 수 있습니다. Gateway API를 통한 실제 분할에는 지원되는 트래픽 라우터나 플러그인 설정이 필요합니다.|카나리 간 오류율, 지연, 요청량을 비교한 뒤 다음 단계로 진행합니다.']]
);
groups[6][3].push(
['eks-upgrade','EKS 업그레이드 · AZ · 비용','클러스터와 노드, 애드온을 순서대로 올리고 운영 제약을 점검합니다.','Upgrade Insights,Control Plane,Add-ons,Node Group,Workloads','https://docs.aws.amazon.com/eks/latest/userguide/update-cluster.html',
 ['사전점검|API 변경과 호환성|Upgrade Insights와 클러스터 매니페스트에서 제거 예정 API를 확인합니다. 컨트롤러, CRD, 애드온 버전 호환성을 점검합니다.',
  '업데이트|Control Plane과 데이터 플레인|AWS 문서의 버전 호환 규칙에 맞춰 제어 영역을 올리고 EC2 워커·애드온을 갱신합니다.|drain이나 노드 교체 전 PDB, 가용 용량, AZ 종속 EBS를 확인합니다.',
  '비용|Requests · Spot · 수집 비용|리소스 요청을 실제 부하와 비교하고, 중단을 수용할 수 있는 워크로드에 Spot을 검토합니다.|NLB, 로그 저장·수집, 데이터 전송 비용도 함께 확인합니다.']]
);
