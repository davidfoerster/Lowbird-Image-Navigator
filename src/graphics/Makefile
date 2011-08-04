# Names and targets
SVG_BASE64 = right_.svg.txt scale-fit_.svg.txt scale-small_.svg.txt scale-full_.svg.txt


default: all

all: svg

svg: $(SVG_BASE64)

%_.svg.txt: %_.svg
	base64 -w 80 $< | sed 's/$$/\\/' > $@
	
clean:
	rm -f $(SVG_BASE64)

