.DEFAULT_GOAL := all

services/.git/HEAD:
	git clone https://github.com/c4dt/services.git
services/mk/service.mk: services/.git/HEAD
	@: nothing

include services/mk/service.mk

$Ddrynx/.git/HEAD:
	git clone https://github.com/c4dt/drynx $Ddrynx

$Dcothority/.git/HEAD:
	git clone https://github.com/dedis/cothority $Dcothority

$Dcothority/proto.awk: $Dcothority/.git/HEAD
$Ddrynx/lib/proto.go: $Ddrynx/.git/HEAD
$Dprotobuf/drynx.proto: $Ddrynx/lib/proto.go | $Dcothority/proto.awk
	awk -f $Dcothority/proto.awk $< > $@
$Dprotobuf/proto.json: $Dprotobuf/drynx.proto

cothority_protos := $(foreach p,network onet skipchain,$Dcothority/external/proto/$p.proto)
$(cothority_protos): $Dcothority/.git/HEAD
$Dprotobuf/proto.json: $(cothority_protos)

$Slibrary-build: | $Dlibrary/src/proto.json
$Dlibrary/src/proto.json: $Dprotobuf/proto.json; cp $< $@

.PHONY: kubernetes-deploy
kubernetes-deploy:
	kubectl delete configmap/datasets || :
	kubectl create configmap datasets --from-file=kubernetes/datasets
	for f in kubernetes/datasets/*; do \
		! [ -e $f ] && echo provide datasets in kubernetes/datasets && exit 1; \
		[ "$${f##*_}" = types ] && continue; \
		sed s,\$$ID,`basename $$f`, kubernetes/node.yaml | kubectl apply -f - ; \
	done
	sed s,\$$ID,`ls kubernetes/datasets | sort | head -n1`, kubernetes/drynx.yaml | kubectl apply -f -
	kubectl apply -f kubernetes/http-datasets.yaml

.PHONY: kubernetes-refresh
kubernetes-refresh:
	kubectl get pods -oname | grep drynx-http-datasets | xargs kubectl delete
	kubectl get pods | awk '/drynx-node/ {print $$1}' | xargs -I{} kubectl exec {} kill 1

.PHONY: kubernetes-dump-config
kubernetes-dump-config: kubernetes-deploy
	@get_host() { local pod_selector=$$1 svc=$$2; echo $$(kubectl get pods -o name | grep $$pod_selector | xargs kubectl get -o yaml | awk '/hostIP/ {p=$$2} END {print p}'):`kubectl get svc/$$svc -o yaml | awk '/nodePort/ {print $$3}'`; }; \
	echo datasets root: http://`get_host drynx-http-datasets drynx-datasets`; \
	echo client: ws://`get_host drynx-node-$$(ls kubernetes/datasets | sort | head -n1) drynx`
	@kubectl get pods | awk '/drynx-node/ {print $$1}' | xargs -I{} kubectl exec {} -- sh -c 'echo address: tcp://`ip addr list dev eth0 | awk -F "[/ ]+" "/inet/ {print \\$$3}"`:1234; echo public: `awk -F \" "/Public/ {print \\$$2}" /config/config`'

$Dwebapp/dist/stackblitz:
	mkdir -p $webapp/dist
	cd webapp && ./stackblitz_gen > dist/stackblitz

ifneq ($S,)
all: $Sall
endif
