# Tools
CP=cp
7Z=7z

# Names and targets
PROJECT = lowbird_image_navigator
SRCDIR = src/
DISTDIR = ../
MOZILLA_TARGET = $(DISTDIR)$(PROJECT).gm.user.js
OPERA_TARGET = $(DISTDIR)$(PROJECT).opera.user.js
PACKAGE_NAME = $(DISTDIR)$(PROJECT).ppmd.7z.zip

# Options
7ZOPT=-t7z -m0=ppmd -mx=9 -mmem=192m -ms=on
SED_RELEASE = s/^(\\s*).*\\/\\/\\s*@sed\\s+(.*)/\\1\\2/


default: mozilla

all: mozilla opera

package: $(PACKAGE_NAME)

$(PACKAGE_NAME): $(MOZILLA_TARGET) $(OPERA_TARGET) CHANGELOG 
	cd $(DISTDIR) && \
	rm -f $(@F) && \
	$(7Z) a $(7ZOPT) $(@F) $(^F) $(SRCDIR)$(PROJECT).js

mozilla: $(MOZILLA_TARGET)

mozilla-debug: SED_RELEASE =
mozilla-debug: mozilla

$(MOZILLA_TARGET): $(PROJECT).js $(PROJECT).user.js.header $(PROJECT).user.js.prolog $(PROJECT).user.js.trailing
	$(CP) $(PROJECT).user.js.header $@ && \
	cat $(PROJECT).user.js.prolog >> $@ && \
	sed -r "$(SED_RELEASE);"'s/\\/\\\\/g;'"s/'/\\\\'/g;"'s/$$/\\n\\/' $(PROJECT).js >> $@ && \
	cat $(PROJECT).user.js.trailing >> $@

opera: $(OPERA_TARGET)

opera-debug: SED_RELEASE =
opera-debug: opera

$(OPERA_TARGET): $(PROJECT).js $(PROJECT).user.js.header
	$(CP) $(PROJECT).user.js.header $@ && \
	sed -r "$(SED_RELEASE)" $(PROJECT).js >> $@

%.js:
CHANGELOG:

graphics:
	$(MAKE) -C graphics all

clean:
	rm -f $(MOZILLA_TARGET) $(OPERA_TARGET) $(PACKAGE_NAME)
	$(MAKE) -C graphics clean

