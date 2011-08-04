SRCDIR=src

default:

%:
	exec make -C $(SRCDIR) $@
