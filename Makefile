.DEFAULT_GOAL := all

services:
	git clone -b stainless https://github.com/c4dt/services.git
services/%: | services
	@: nothing

include services/mk/service.mk

ifneq ($S,)
all: $Sall
endif
