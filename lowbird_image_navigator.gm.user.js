// ==UserScript==
// @name           Lowbird Image Navigator
// @namespace      tag:protoplasma.org/scripts/gm/lowbird-navigator
// @description    makes image scaling on lowbird.com a little more comfortable
// @include        http://www.lowbird.com/*/view/*
// @include        http://lowbird.com/*/view/*
// ==/UserScript==


var script = document.createElement("script");
script.type = "text/javascript";
script.text = '\
/** @fileoverview\n\
  <h2>Lowbird Image Navigator</h2>\n\
\n\
  <p>This script is supposed to &quot;enhance&quot; image browsing on\n\
  <a href="http://www.lowbird.com">lowbird.com</a>.</p>\n\
\n\
  <p>It replaces the blue navigation bars at each side of the page with\n\
  semi-transparent navigation handles placed in front of the image. These\n\
  handles only appear with a fade effect when hovered.</p>\n\
  <p>Furthermore it introduces a new image display size mode that fits the image\n\
  horizontally into the browser window&mdash;but only for sufficently large\n\
  images. Plus, it hides ads and changes the font to to the default sans-serif,\n\
  if configured to do so.</p>\n\
\n\
  <p><em>System requirements:</em> this works only in Firefox 3+ so far. WebKit\n\
  (Konqueror and Safari) and Chrome/Chromium should work as well, but I didn\'t\n\
  test it. Opera 10 is all bitchy about the\n\
  <code style="white-space: nowrap;">max-height</code> CSS property, so it\n\
  doesn\'t work there and probably won\'t until the vendor fixes that; and of\n\
  course neither does Internet Explorer \'cause no SVG support (although a plugin\n\
  from Adobe may provide that support).</p>\n\
\n\
\n\
  <p>created by\n\
  <a href="http://www.lowbird.com/board/member.php?u=1158)">dekaden|Z</a><br>\n\
  Please contact me for bugs, suggestions and general feedback! <tt>:-&gt;</tt>\n\
  </p>\n\
*/\n\
\n\
\n\
(function() {\n\
\n\
/**\n\
  You can adjust these factors to fit the maximum ratio of the image to its\n\
  container (the space between the blue sidebars for the width and between the\n\
  header and the navigation (&quot;prev home next&quot;) for the height.\n\
*/\n\
var GlobalSettings = {\n\
	/**\n\
	  Options for moving/hiding &quot;useless&quot; page elements (notably\n\
	  advertisement)\n\
	*/\n\
	page: {\n\
		/**\n\
		  <ul>\n\
		    <li><code>&quot;hide&quot;</code> removes the ad teaser.</li>\n\
		    <li><code>&quot;move end&quot;</code> moves the ad teaser behind the\n\
		      comments.</li>\n\
		    <li>Any other value does nothing.</li>\n\
		  </ul>\n\
		*/\n\
		teaser: null,\n\
\n\
		/**\n\
		  <ul>\n\
		    <li><code>&quot;hide<code>&quot; removes the navgation right below\n\
		      the image.</li>\n\
		    <li>Any other value does nothing.</li>\n\
		  </ul>\n\
		*/\n\
		navigation: "hide",\n\
\n\
		style: {\n\
			/**\n\
			  Changes the default font font family and a few other things.\n\
			  <ul>\n\
			    <li><code>true</code> sets the font family to sans-serif.</li>\n\
			    <li><code>false</code> prevents these changes completely.</li>\n\
			    <li><code>[any string]</code> sets the font family to that\n\
			      string. Please use valid CSS notation and enclose font names\n\
			      with spaces in single or double quotation marks.</li>\n\
			    <li>Any other value results to undefined behaviour.</li>\n\
			  </ul>\n\
			*/\n\
			changeFont: true\n\
		}\n\
	},\n\
\n\
	/**\n\
	  Options for the image dimensions and the CSS classes to use\n\
	*/\n\
	image: {\n\
		/**\n\
		  The maximum width as ratio of the totally available space\n\
		  (depends on the width of the parent element)\n\
		*/\n\
		maxWidthRatio: 0.99,\n\
\n\
		/**\n\
		  The maximum height as ratio of the window height\n\
		*/\n\
		maxHeightRatio: 0.8,\n\
\n\
		/**\n\
		  The minimum height in pixels\n\
		*/\n\
		minHeightAbs: 600,\n\
\n\
		/**\n\
		  The classes we use for the different display modes\n\
		*/\n\
		classes: {\n\
			/**\n\
			  The image does not fit the default dimensions\n\
			*/\n\
			fit: ["scaled", "fit-width", "full"],\n\
\n\
			/**\n\
			  The image fits the default dimensions\n\
			*/\n\
			noFit: ["scaled", "full"],\n\
\n\
			/**\n\
			  The class to use as default (when the page is displayed first)\n\
			*/\n\
			"default": "scaled"\n\
		},\n\
\n\
		/**\n\
		  <p><strong>DO NOT TOUCH THESE !!!</strong></p>\n\
\n\
		  <p>These values control the polling intervals when we need to wait for\n\
		  the image to load the part containing its dimensions.</p>\n\
		*/\n\
		polling: {\n\
			maxInterval: 10000,  // in milliseconds\n\
			minInterval: 50,\n\
			increaseFactor: 1.25\n\
		},\n\
\n\
		/**\n\
		  If true, displays a little box in the top right-hand corner with the\n\
		  natural and the current image dimensions.\n\
		*/\n\
		showDimensions: true\n\
	},\n\
\n\
	/**\n\
	  Settings for the control icons placed in front of the image and their\n\
	  sensitive areas\n\
	*/\n\
	handles: {\n\
		right: {\n\
			/**\n\
			  The horizontal ratio of the icon (depending on the image dimensions)\n\
			*/\n\
			ratioHoriz: 1/5,\n\
\n\
			/**\n\
			  The vertical ratio of the icon (depending on the image dimensions)\n\
			*/\n\
			ratioVert: 1,\n\
\n\
			/**\n\
			  The relative offset from the image top\n\
			*/\n\
			offsetTop: 0,\n\
\n\
			/**\n\
			  The realtive offset from the left side of the image\n\
			*/\n\
			offsetLeft: 4/5,\n\
\n\
			object: {\n\
				/**\n\
				  The source of the image data of the icon\n\
				*/\n\
				src: "graphics/right.svg",\n\
\n\
				/**\n\
				  The MIME type of the source of the icon image data\n\
				*/\n\
				mime: "image/svg+xml"\n\
			},\n\
\n\
			/**\n\
			  Rotate the icon by the value set below times 90°\n\
			*/\n\
			rotation: 0\n\
		},\n\
		left: {\n\
			ratioHoriz: 1/5,\n\
			ratioVert: 1,\n\
			offsetTop: 0,\n\
			offsetLeft: 0,\n\
			object: { src: "graphics/right.svg", mime: "image/svg+xml" },\n\
			rotation: 2\n\
		},\n\
		top: {\n\
			ratioHoriz: 1,\n\
			ratioVert: 1/4,\n\
			offsetTop: 0,\n\
			offsetLeft: 0,\n\
			object: { src: "graphics/right.svg", mime: "image/svg+xml" },\n\
			rotation: 1\n\
		},\n\
		bottom: {\n\
			ratioHoriz: 1,\n\
			ratioVert: 1/4,\n\
			offsetTop: 3/4,\n\
			offsetLeft: 0,\n\
			object: { src: "graphics/right.svg", mime: "image/svg+xml" },\n\
			rotation: 3\n\
		},\n\
		center: {\n\
			ratioHoriz: 2/5,\n\
			ratioVert: 2/4,\n\
			offsetTop: 1/4,\n\
			offsetLeft: 1.5/5,\n\
			object: {\n\
				/**\n\
				  Each key defines the icon data for a specific display class\n\
				*/\n\
				src: {\n\
					scaled: "graphics/scale-fit.svg",\n\
					"fit-width": "graphics/scale-full.svg",\n\
					full: "graphics/scale-small.svg"\n\
				},\n\
				mime: "image/svg+xml"\n\
			},\n\
			rotation: 0\n\
		}\n\
	},\n\
\n\
	/**\n\
	  A few common settings for all handles\n\
	*/\n\
	handleSettings: {\n\
		/**\n\
		  The handle opacity\n\
		*/\n\
		opacity: 0.5,\n\
\n\
		/**\n\
		  A factor for icon fading delays. 0 means no fading.\n\
		*/\n\
		speedfactor: 1,\n\
\n\
		/**\n\
		  Handles disappear after the indicated delay (in milliseconds).\n\
		  0 means no disappearing.\n\
		*/\n\
		hideAfter: 1000\n\
	},\n\
\n\
	/**\n\
	  Image scrolling options (with mouse wheel)\n\
	*/\n\
	scroll: {\n\
		/**\n\
		  The scroll amount factor (in pixels)\n\
		*/\n\
		length: 200,\n\
\n\
		/**\n\
		  For smooth scrolling, set the number of scrolling steps.\n\
		  Set to 1 to disable smooth scrolling.\n\
		*/\n\
		count: 10,\n\
\n\
		/**\n\
		  The interval in milliseconds between two smooth scrolling steps\n\
		*/\n\
		interval: 10,\n\
\n\
		/**\n\
		  Set to <code>true</code> if you have a working horizontal scrolling\n\
		  device (i. e. a 2nd mouse wheel or a touch pad). If you don\'t, set to\n\
		  <code>false</code> and press the ALT key during scrolling to scroll\n\
		  horizontally.\n\
		*/\n\
		horizontalWheelPresent: false\n\
	},\n\
\n\
	prefetch: {\n\
		/**\n\
		  Prefetch next image.\n\
		*/\n\
		nextImage: true,\n\
\n\
		/**\n\
		  Prefetch previous image.\n\
		*/\n\
		previousImage: true\n\
	},\n\
\n\
	behavior: {\n\
		comments: {\n\
			custom_replacements: false\n\
		}\n\
	},\n\
\n\
	/**\n\
	  Defines the debug level. 0 means no debugging.\n\
	*/\n\
	debug: 0\n\
};\n\
\n\
with (GlobalSettings) {\n\
	if (debug && image.minHeightAbs > 400) image.minHeightAbs = 400;\n\
\n\
\n\
// Replace icon file references with base64 encoded data\n\
if (!debug) (function() {\n\
	var map = {\n\
		"graphics/right.svg": "\\\n\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\\\n\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\\\n\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGlkPSJoYW5k\\\n\
bGUiPjxkZWZzIGlkPSJkZWZzNCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTg1Mi4zNjIxOCki\\\n\
IGlkPSJsYXllcjEiPjxwYXRoIGQ9Im0gMjAsODUyLjM2MjE2IGMgLTExLjA4LDAgLTIwLDguOTIgLTIw\\\n\
LDIwIGwgMCwxNjAuMDAwMDQgYyAwLDExLjA4IDguOTIsMjAgMjAsMjAgbCAxMDIuMDYyNSwwIDcuOTM3\\\n\
NSwwIDIwLDAgMCwtMjAgMCwtMTYwLjAwMDA0IDAsLTIwIC0yMCwwIC03LjkzNzUsMCAtMTAyLjA2MjUs\\\n\
MCB6IiBpZD0iYmdyZWN0IiBzdHlsZT0iZmlsbDojMDAwMDAwIi8+PHBhdGggZD0ibSA0MS4zOTc0NDYs\\\n\
MTEuOTA2NjA4IC0xOC4xODgwMjMsMTAuNTAwODU5IC0xOC4xODgwMjE2LDEwLjUwMDg2IDAsLTIxLjAw\\\n\
MTcyIDAsLTIxLjAwMTcxODMgMTguMTg4MDIyNiwxMC41MDA4NTk3IHoiIHRyYW5zZm9ybT0ibWF0cml4\\\n\
KDEuOTMwODA3MywwLDAsMy4xMTg1OTAyLDM3LjczNzkzOSw5MTUuMjMwMzQpIiBpZD0iYXJyb3ciIHN0\\\n\
eWxlPSJmaWxsOiNmZmZmZmY7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjIuMDM3NjExNDg7c3Ry\\\n\
b2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLW9wYWNpdHk6MTtzdHJv\\\n\
a2UtZGFzaGFycmF5Om5vbmUiLz48L2c+PC9zdmc+",\n\
\n\
		"graphics/scale-small.svg": "\\\n\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\\\n\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\\\n\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGlkPSJzdmcz\\\n\
NTg5Ij48ZGVmcyBpZD0iZGVmczM1OTEiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NTIuMzYy\\\n\
MTgpIiBpZD0ibGF5ZXIxIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjM1LjQzMzA3\\\n\
MSIgcnk9IjM1LjQzMzA3MSIgeD0iMCIgeT0iMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCw4NTIuMzYy\\\n\
MTgpIiBpZD0icmVjdDQxMTciIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tl\\\n\
Om5vbmUiLz48cmVjdCB3aWR0aD0iOTUuOTA5NzQ0IiBoZWlnaHQ9IjQ5LjQ2NzU3NSIgeD0iNTIuMDQ1\\\n\
MTI4IiB5PSI5MjcuNjI4MzYiIGlkPSJyZWN0NDExOSIgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2Zm\\\n\
ZmZmZjtzdHJva2Utd2lkdGg6Mi43ODQxNDEwNjtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5l\\\n\
am9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1vcGFjaXR5OjE7c3Ryb2tlLWRhc2hh\\\n\
cnJheTpub25lIi8+PHBhdGggZD0ibSAxMDUuMTIzMiw5OS41NDcwODEgLTU2LjM3MzE5OSwwIC01Ni4z\\\n\
NzMxOTkxLDAgTCAyMC41NjM0MDEsNTAuNzI2NDYgNDguNzUsMS45MDU4MzggNzYuOTM2NTk5LDUwLjcy\\\n\
NjQ1OSAxMDUuMTIzMiw5OS41NDcwODEgeiIgdHJhbnNmb3JtPSJtYXRyaXgoMCwwLjk0OTA4ODU0LDAu\\\n\
MjAwNjY1NzYsMCwxNTQuNTE2MDgsOTA2LjA5NDEyKSIgaWQ9InBhdGg0NTU5LTgiIHN0eWxlPSJmaWxs\\\n\
OiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOm5vbmUiLz48cGF0\\\n\
aCBkPSJtIDEwNS4xMjMyLDk5LjU0NzA4MSAtNTYuMzczMTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2\\\n\
MzQwMSw1MC43MjY0NiA0OC43NSwxLjkwNTgzOCA3Ni45MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5\\\n\
LjU0NzA4MSB6IiB0cmFuc2Zvcm09Im1hdHJpeCgwLjk2NjY4ODE1LDAsMCwwLjIxMzUwODM3LDUyLjI4\\\n\
OTYzNCw5ODUuMjc2MDgpIiBpZD0icGF0aDQ1NTktNCIgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9w\\\n\
YWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZSIvPjxwYXRoIGQ9Im0gMTA1LjEyMzIs\\\n\
OTkuNTQ3MDgxIC01Ni4zNzMxOTksMCAtNTYuMzczMTk5MSwwIEwgMjAuNTYzNDAxLDUwLjcyNjQ2IDQ4\\\n\
Ljc1LDEuOTA1ODM4IDc2LjkzNjU5OSw1MC43MjY0NTkgMTA1LjEyMzIsOTkuNTQ3MDgxIHoiIHRyYW5z\\\n\
Zm9ybT0ibWF0cml4KDAuOTY2Njg4MTUsMCwwLC0wLjIxMzUwODM3LDUyLjg3Mzk1LDkxOS40NDgzMyki\\\n\
IGlkPSJwYXRoNDU1OSIgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6\\\n\
ZXZlbm9kZDtzdHJva2U6bm9uZSIvPjxwYXRoIGQ9Im0gMTA1LjEyMzIsOTkuNTQ3MDgxIC01Ni4zNzMx\\\n\
OTksMCAtNTYuMzczMTk5MSwwIEwgMjAuNTYzNDAxLDUwLjcyNjQ2IDQ4Ljc1LDEuOTA1ODM4IDc2Ljkz\\\n\
NjU5OSw1MC43MjY0NTkgMTA1LjEyMzIsOTkuNTQ3MDgxIHoiIHRyYW5zZm9ybT0ibWF0cml4KDAsMC45\\\n\
NDkwODg1NCwtMC4yMDA2NjU3NiwwLDQ1LjQ4MzkyNyw5MDYuMDk0MTIpIiBpZD0icGF0aDQ1NTktOC0y\\\n\
IiBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9r\\\n\
ZTpub25lIi8+PC9nPjwvc3ZnPg==",\n\
\n\
		"graphics/scale-fit.svg": "\\\n\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\\\n\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\\\n\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGlkPSJzdmcz\\\n\
NTg5Ij48ZGVmcyBpZD0iZGVmczM1OTEiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NTIuMzYy\\\n\
MTgpIiBpZD0ibGF5ZXIxIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjM1LjQzMzA3\\\n\
MSIgcnk9IjM1LjQzMzA3MSIgeD0iMCIgeT0iMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCw4NTIuMzYy\\\n\
MTgpIiBpZD0icmVjdDQxMTciIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tl\\\n\
Om5vbmUiLz48cmVjdCB3aWR0aD0iMTQ1LjQ2NiIgaGVpZ2h0PSIxMDIuOTUwNTgiIHg9IjI3LjI2NyIg\\\n\
eT0iOTAwLjg4NjkiIGlkPSJyZWN0NDExOSIgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2ZmZmZmZjtz\\\n\
dHJva2Utd2lkdGg6NC45NDY0NjIxNTtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjpy\\\n\
b3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1vcGFjaXR5OjE7c3Ryb2tlLWRhc2hhcnJheTpu\\\n\
b25lIi8+PHBhdGggZD0ibSAxMzAuMzc4OTgsOTk2LjIwNzc2IDMzLjY2MTQyLDAgMCwtMzMuNjYxNDEg\\\n\
LTMzLjY2MTQyLDMzLjY2MTQxIHoiIGlkPSJwYXRoNDQ5NS05IiBzdHlsZT0iZmlsbDojZmZmZmZmO2Zp\\\n\
bGwtb3BhY2l0eToxO3N0cm9rZTpub25lIi8+PHBhdGggZD0ibSAzNS45NTk1OTcsOTYyLjU0NjM0IDAs\\\n\
MzMuNjYxNDIgMzMuNjYxNDA2LDAgLTMzLjY2MTQwNiwtMzMuNjYxNDIgeiIgaWQ9InBhdGg0NDk1LTQi\\\n\
IHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmUiLz48cGF0aCBkPSJt\\\n\
IDE2NC4wNDA0LDk0Mi4xNzgwMyAwLC0zMy42NjE0MiAtMzMuNjYxNDEsMCAzMy42NjE0MSwzMy42NjE0\\\n\
MiB6IiBpZD0icGF0aDQ0OTUtMSIgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtzdHJv\\\n\
a2U6bm9uZSIvPjxwYXRoIGQ9Im0gNjkuNjIxMDA5LDkwOC41MTY2MSAtMzMuNjYxNDE3LDAgMCwzMy42\\\n\
NjE0MiAzMy42NjE0MTcsLTMzLjY2MTQyIHoiIGlkPSJwYXRoNDQ5NSIgc3R5bGU9ImZpbGw6I2ZmZmZm\\\n\
ZjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZSIvPjwvZz48L3N2Zz4=",\n\
\n\
		"graphics/scale-full.svg": "\\\n\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\\\n\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\\\n\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGlkPSJzdmcz\\\n\
NTg5Ij48ZGVmcyBpZD0iZGVmczM1OTEiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NTIuMzYy\\\n\
MTgpIiBpZD0ibGF5ZXIxIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjM1LjQzMzA3\\\n\
MSIgcnk9IjM1LjQzMzA3MSIgeD0iMS4zNjkzNDczZS0xNiIgeT0iODUyLjM2MjE4IiBpZD0icmVjdDQx\\\n\
MTciIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmUiLz48cGF0aCBk\\\n\
PSJtIDEwNS4xMjMyLDk5LjU0NzA4MSAtNTYuMzczMTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2MzQw\\\n\
MSw1MC43MjY0NiA0OC43NSwxLjkwNTgzOCA3Ni45MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5LjU0\\\n\
NzA4MSB6IiB0cmFuc2Zvcm09Im1hdHJpeCgwLDAuNDQ2ODQ5NjQsLTAuMTYwNTMyNjEsMCwxODMuNDY4\\\n\
MzEsOTMwLjU3ODI2KSIgaWQ9InBhdGg0NTU5LTgiIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFj\\\n\
aXR5OjE7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOm5vbmUiLz48cGF0aCBkPSJtIDEwNS4xMjMyLDk5\\\n\
LjU0NzA4MSAtNTYuMzczMTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2MzQwMSw1MC43MjY0NiA0OC43\\\n\
NSwxLjkwNTgzOCA3Ni45MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5LjU0NzA4MSB6IiB0cmFuc2Zv\\\n\
cm09Im1hdHJpeCgwLjc3MzM1MDUzLDAsMCwtMC4xNjA1MzI2MSw2MS43MTQ4NDMsMTAwNi4wMjE1KSIg\\\n\
aWQ9InBhdGg0NTU5LTQiIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxl\\\n\
OmV2ZW5vZGQ7c3Ryb2tlOm5vbmUiLz48cGF0aCBkPSJtIDEwNS4xMjMyLDk5LjU0NzA4MSAtNTYuMzcz\\\n\
MTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2MzQwMSw1MC43MjY0NiA0OC43NSwxLjkwNTgzOCA3Ni45\\\n\
MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5LjU0NzA4MSB6IiB0cmFuc2Zvcm09Im1hdHJpeCgwLDAu\\\n\
NDQ2ODQ5NjQsMC4xNjA1MzI2MSwwLDE2LjUzMTY5MSw5MzAuNTc4MjYpIiBpZD0icGF0aDQ1NTktOC0y\\\n\
IiBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9r\\\n\
ZTpub25lIi8+PHBhdGggZD0ibSAxMDUuMTIzMiw5OS41NDcwODEgLTU2LjM3MzE5OSwwIC01Ni4zNzMx\\\n\
OTkxLDAgTCAyMC41NjM0MDEsNTAuNzI2NDYgNDguNzUsMS45MDU4MzggNzYuOTM2NTk5LDUwLjcyNjQ1\\\n\
OSAxMDUuMTIzMiw5OS41NDcwODEgeiIgdHJhbnNmb3JtPSJtYXRyaXgoMC43NzMzNTA1MywwLDAsMC4x\\\n\
NjA1MzI2MSw2Mi4yOTkxNTksODk4LjcwMjkxKSIgaWQ9InBhdGg0NTU5IiBzdHlsZT0iZmlsbDojZmZm\\\n\
ZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTpub25lIi8+PHJlY3Qgd2lk\\\n\
dGg9IjExNS4zNDU1NCIgaGVpZ2h0PSI1OS40OTIwMjMiIHg9IjQyLjMyNzIyNSIgeT0iOTIyLjYxNjE1\\\n\
IiBpZD0icmVjdDQxMTkiIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRo\\\n\
OjMuMzQ4MzM4Mzc7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tl\\\n\
LW1pdGVybGltaXQ6NDtzdHJva2Utb3BhY2l0eToxO3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIvPjwvZz48\\\n\
L3N2Zz4="\n\
	};\n\
\n\
	function buildDataString(src, mime) {\n\
		return map[src] ?\n\
			"data:" + mime + ";base64," + map[src] :\n\
			src;\n\
	}\n\
\n\
	for (var or in handles) with (handles[or].object) {\n\
		if (typeof src == "object") {\n\
			for (var k in src)\n\
				src[k] = buildDataString(src[k], mime);\n\
		} else {\n\
			src = buildDataString(src, mime);\n\
		}\n\
	}\n\
})();\n\
}\n\
\n\
\n\
function run($) {\n\
/**\n\
  A replacement for the GreaseMonkey function of the same name.\n\
  It creates a new <code>&lt;style&gt;</code> element in the page\n\
  <code>&lt;head&gt;</code> and writes everything there.\n\
  @param {...String} style sheet definitions\n\
*/\n\
function addStyle() {\n\
	if (arguments.length) {\n\
		var i = !arguments.callee.css;\n\
		if (i) {\n\
			var style = document.createElement("style");\n\
			style.type = "text/css";\n\
			style.appendChild(arguments.callee.css = document.createTextNode(arguments[0]));\n\
			document.getElementsByTagName("head")[0].appendChild(style);\n\
		}\n\
\n\
		for(i = Number(i); i < arguments.length; i++) {\n\
			arguments.callee.css.appendData("\\n");\n\
			arguments.callee.css.appendData(arguments[i]);\n\
		}\n\
	}\n\
}\n\
\n\
/**\n\
  @return Returns <code>min</code>, if <code>x</code> evaluates to\n\
    <code>false</code> or if it is greater than <code>x</code>; returns\n\
    <code>x</code> otherwise.\n\
*/\n\
function defaultMin(x, min) {\n\
	return (x && x >= min) ? x : min;\n\
}\n\
\n\
/**\n\
  @resturn Checks if a node has a specific name in a specific XML namespace.\n\
  @type Boolean\n\
*/\n\
function checkTagType(node, namespaceURI, localName) {\n\
	return node.localName == localName && node.namespaceURI == namespaceURI;\n\
}\n\
\n\
/**\n\
  Switches the values behind two keys in an object.\n\
*/\n\
function switchValues(obj, key1, key2) {\n\
	var temp = obj[key1];\n\
	obj[key1] = obj[key2];\n\
	obj[key2] = temp;\n\
	return obj;\n\
}\n\
\n\
\n\
/**\n\
  @constructor\n\
  @class A wrapper around <code>document.evaluate</code>\n\
  @param {Node} [context=document] The default context for the expression\n\
  @param {XPathNSResolver|String} [nsResolver=null] The namespace resolver to\n\
    use. <code>null</null> is an acceptable value and\n\
    <code>&quot;default&quot;</code> will create a default resolver for\n\
    <code>context</code> document.\n\
  @param {Number} [resultType=ANY_TYPE] The desired <a href="http://www.w3.org/TR/DOM-Level-3-XPath/xpath.html#XPathResult">result type</a>.\n\
*/\n\
function XPathSearch(context, nsResolver, resultType)\n\
{\n\
	this.context = context || document;\n\
	this.document = this.context.ownerDocument || this.context;\n\
	this.nsResolver = (nsResolver === "default") ? this.document.createNSResolver(this.document.documentElement) : (nsResolver || null);\n\
	this.resultType = resultType || XPathResult.ANY_TYPE;\n\
	this.result = null;\n\
}\n\
\n\
jQuery.extend(XPathSearch.prototype, {\n\
	/**\n\
	  <p>Evaluates an expression.</p>\n\
	  <p>The previous result is reused and overwritten. If you don\'t want this,\n\
	  set <code>this.result</code> to <code>null</code>.</p>\n\
	  @param {String} expr The expression to evaluate\n\
	  @param {Node} [context] Momentarily overrides the default expression\n\
	    context of this object.\n\
	  @param {Number} [resultType] Momentarily overrides the default result\n\
	    type of this object.\n\
	  @return <code>this</code>\n\
	  @type XPathSearch\n\
	  @member XPathSearch\n\
	*/\n\
	evaluate: function(expr, context, resultType)\n\
	{\n\
		this.result = this.document.evaluate(\n\
				expr,\n\
				context || this.context,\n\
				this.nsResolver,\n\
				resultType || this.resultType,\n\
				this.result);\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  Executes the handler for every individual result (works for for single\n\
	  result types, too; see {@link #singleValue}).\n\
	  @param {Function} fun The handler function\n\
	  @return <code>this</code>\n\
	  @type XPathSearch\n\
	  @member XPathSearch\n\
	*/\n\
	"each": function(fun)\n\
	{\n\
		if (this.result) switch (this.result.resultType) {\n\
			case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:\n\
			case XPathResult.ORDERED_NODE_ITERATOR_TYPE:\n\
				for (var i = 0; !(this.result.invalidIteratorState); i++) {\n\
					fun.call(this.result.iterateNext(), i);\n\
				}\n\
				break;\n\
\n\
			case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:\n\
			case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:\n\
				for (var i = 0; i < this.result.snapshotLength; i++) {\n\
					fun.call(this.result.snapshotItem(i), i);\n\
				}\n\
				break;\n\
\n\
			default:\n\
				var val = this.singleValue();\n\
				if (val !== null) {\n\
					fun.call(val, 0, val);\n\
					break;\n\
				}\n\
		}\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  @return The result of a single value result type, or <code>null</code> if\n\
	    no result is available.\n\
	  @member XPathSearch\n\
	*/\n\
	singleValue: function()\n\
	{\n\
		if (this.result) switch (this.result.resultType) {\n\
			case XPathResult.NUMBER_TYPE:\n\
				return this.result.numberValue;\n\
			case XPathResult.STRING_TYPE:\n\
				return this.result.stringValue;\n\
			case XPathResult.BOOLEAN_TYPE:\n\
				return this.result.booleanValue;\n\
\n\
			case XPathResult.ANY_UNORDERED_NODE_TYPE:\n\
			case XPathResult.FIRST_ORDERED_NODE_TYPE:\n\
				return this.result.singleNodeValue;\n\
\n\
			default:\n\
				return null;\n\
		}\n\
	}\n\
});\n\
\n\
\n\
jQuery.extend(Function, {\n\
	/**\n\
	  @return Checks if an object is a function.\n\
	  @type Boolean\n\
	  @param f Any object\n\
	  @member Function\n\
	  @addon\n\
	*/\n\
	isFunction: function(f) {\n\
		return typeof f == "function";\n\
	}\n\
});\n\
\n\
\n\
\n\
jQuery.extend(Array.prototype, {\n\
	/**\n\
	  @return Checks if this array is empty.\n\
	  @type Boolean\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	isEmpty: function() { return !this.length; },\n\
\n\
	/**\n\
	  @return a new array with the same contents as this one\n\
	  @type Array\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	clone: function() { return this.isEmpty() ? new Array() : this.slice(0); },\n\
\n\
\n\
	/**\n\
	  @return Checks if this array contains a certain entry.\n\
	  @type Boolean\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	contains: function(obj) { return this.indexOf(obj) !== -1; },\n\
\n\
	/**\n\
	  @param obj An object to look for\n\
	  @return The index of <code>obj</code> in this array, or &minus;1 if it\n\
	    doesn\'t occur.\n\
	  @type Number\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	indexOf: function(obj) {\n\
		for (var i=0; i !== this.length; i++) {\n\
			if (this[i] == obj) return i;\n\
		}\n\
		return -1;\n\
	},\n\
\n\
	/**\n\
	  Searches for for elements with a prefix.\n\
	  @param {String} a prefix string\n\
	  @param {Number} [start=0] the start index for the search (wrapped around\n\
	    at the array end)\n\
	  @param {Boolean} [ignoreCase=false] Do a case insensitive search?\n\
	  @param [equal] see {@link #startsWith}\n\
	  @return The index of the first element with the given prefix, or &minus;1\n\
	    if none\n\
	  @type Number\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	findPrefix: function(prefix, start, ignoreCase, equal) {\n\
		prefix = prefix.toString();\n\
		start = start ? start % this.length : 0;\n\
		var filter;\n\
		if (ignoreCase) {\n\
			prefix = prefix.toLowerCase();\n\
			filter = function(s) { return s.toLowerCase(); };\n\
		} else {\n\
			filter = function(s) { return s; };\n\
		}\n\
		var cmp = function(s) { return filter(s.toString()).startsWith(prefix, equal); };\n\
\n\
		if (cmp(this[start])) return start;\n\
		for (var i = (start + 1) % this.length; i !== start; i = (i + 1) % this.length) {\n\
			if (cmp(this[i])) return i;\n\
		}\n\
		return -1;\n\
	},\n\
\n\
	/**\n\
	  @param item The object for which you want a successor.\n\
	  @return The object succeeding <code>item</code> in this array, or the\n\
	    first array entry if this array does not contain <code>item</code> or it\n\
	    is the last entry. For an empty array, this always returns the empty\n\
	    string.\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	next: function(item) {\n\
		return this.length ?\n\
			this[(this.indexOf(item) + 1) % this.length] :\n\
			"";\n\
	},\n\
\n\
	/**\n\
	  Replaces a section of an array with the contents of another array.\n\
	  @param {Array} a The replacement source\n\
	  @param {Number} [offset1=0] The start offset in this array\n\
	  @param {Number} [offset2=0] The start offset in the replacement array\n\
	  @param {Number} [len] The number of elements to replace. No more than\n\
	    <code>a.length &minus; offset2</code> will be copied.\n\
	  @return <code>this</code>\n\
	  @type Array\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	replace: function(a, offset1, offset2, len) {\n\
		if (a.length) {\n\
			if (offset1 === undefined) offset1 = 0;\n\
			if (offset2 === undefined) offset2 = 0;\n\
			len = Math.min(a.length - offset2, (len === undefined) ? Infinity : len);\n\
\n\
			for (var i=0; i < len; i++)\n\
				this[i + offset1] = a[i + offset2];\n\
		}\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  @param {Number} i An index to convert to a &quot;real&quot; index on this\n\
	    array\n\
	  @return Returns the wrapped around index for this array. Positive values\n\
	    start from the first, negative values from the last element.\n\
	  @type Number\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	getIndex: function(i) {\n\
		return (i >= 0) ? i % this.length : this.length - (i + 1) % this.length - 1;\n\
	},\n\
\n\
	/**\n\
	  @param {Number} index The index of the desired entry\n\
	  @return Returns the array entry at the module of the index. If the index\n\
	    is negative, it is counted from the array end.\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	get: function(i) { if (this.length) return this[this.getIndex(i)]; },\n\
\n\
	/**\n\
	  Appends the contents of the passed arrays to this array.\n\
	  @param [...Array] arrays to append to this one\n\
	  @return <code>this</code>\n\
	  @type Array\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	append: function() {\n\
		for (var i=0; i < arguments.length; i++)\n\
			if (arguments[i] instanceof Array || arguments[i] instanceof jQuery)\n\
				for (var j=0; j < arguments[i].length; j++)\n\
					this.push(arguments[i][j]);\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  Invokes <code>callback</code> for every array entry. If the callback\n\
	  returns a value which is not <code>undefined<code> and evaluates to\n\
	  <code>false</code>, this method return immediately.\n\
\n\
	  @param {Function} callback A handler function\n\
	  @param {Number} [start=0] The start index\n\
	  @param {Number} [len] The maximum number of entries to handle\n\
	  @return <code>this</code>\n\
	  @type Array\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	"each": function(callback, start, lenght) {\n\
		start = (start !== undefined) ? this.getIndex(Number(start)) : 0;\n\
		length = (length !== undefined) ? Math.min(length, this.length) : this.length;\n\
		for (var i=start; i < length; i++) {\n\
			var r = callback.call(this[i], i, this[i]);\n\
			if (r !== undefined && !r) break;\n\
		}\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  Sorts this array and returns a duplicate free copy.\n\
	  @return A sorted copy, duplicate-free copy of this array\n\
	  @param {Function} [comparator] A comparator function (see {@link #sort}\n\
	  @member Array\n\
	  @addon\n\
	 */\n\
	unique: function(comparator) {\n\
		if (!this.length) return this;\n\
		this.sort(comparator);\n\
		var a = new Array();\n\
		a.push(this[0]);\n\
		for (var i = 1; i !== this.length; i++) {\n\
			if (this[i] != this[i - 1])\n\
				a.push(this[i]);\n\
		}\n\
		return a;\n\
	}\n\
});\n\
jQuery.extend(Array, {\n\
	/**\n\
	  @return Checks if an object is either no array or empty.\n\
	  @type Boolean\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	isEmpty: function(ar) { return !(ar instanceof Array && ar.length); },\n\
\n\
	/**\n\
	  Turns every arry-like object into a true array.\n\
	  @param obj An array-like object\n\
	  @return <code>obj</code> itself, if it is an array already; an array with\n\
	    all elements accessed via <code>obj[i]</code>, if <code>obj</code> has a\n\
	    positive, numeric <code>length</code> property; an empty array\n\
	    otherwise.\n\
	  @type Array\n\
	  @member Array\n\
	  @addon\n\
	*/\n\
	toArray: function(obj) {\n\
		if (obj instanceof Array)\n\
			return obj;\n\
\n\
		if (typeof obj.length == "number" && obj.length > 0) {\n\
			var a = new Array(obj.length);\n\
			for (var i=a.length-1; i >= 0; i--) a[i] = obj[i];\n\
			return a;\n\
		}\n\
\n\
		return new Array();\n\
	}\n\
});\n\
\n\
\n\
\n\
jQuery.extend(Number.prototype, {\n\
	/**\n\
	  Rounds this number and appends a unit string.\n\
	  @param {String} unit A unit to append to the number\n\
	  @param {Number} [precision=3] The rounding precision\n\
	  @return This number with a unit string\n\
	  @type String\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	toUnit: function(unit, precision) { return this.round(precision) + unit.toString(); },\n\
\n\
	/**\n\
	  @return The precentile representation of this number with 1 decimal digit\n\
	    succeeded by a percent character.\n\
	  @type String\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	percent: function() { return (this * 100).toUnit("%", 1); },\n\
\n\
	/**\n\
	  @return Checks if this number is even.\n\
	  @type Boolean\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	even: function() { return this % 2 === 0; },\n\
\n\
	/**\n\
	  @return Checks if this number is odd.\n\
	  @type Boolean\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	odd: function() { return this % 2 === 1; },\n\
\n\
	/**\n\
	  @param {Number} a The range beginning\n\
	  @param {Number} b The range end\n\
	  @param {Boolean} [exclusive=false] Use an exclusive instead of an\n\
	    inclusive range?\n\
	  @return Checks if this number lies in the given range.\n\
	  @type Boolean\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	between: function(a, b, exclusive) {\n\
		if (b < a) {\n\
			var h = a;\n\
			a = b;\n\
			b = a;\n\
		}\n\
		return exclusive ? a < this && this < b : a <= this && this <= b;\n\
	},\n\
\n\
	/**\n\
	  @param {Number} [precision=3] The precision to round to\n\
	  @return This number rounded to <code>precision</code> decimal digits\n\
	  @type Number\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	round: function(precision) {\n\
		precision = (precision === undefined) ? 1000 :\n\
			(0 <= precision && precision < arguments.callee.fastMap.length) ?\n\
				arguments.callee.fastMap[precision.floor()] :\n\
				Math.pow(10, precision.roundTowards());\n\
		return Math.round(this * precision) / precision;\n\
	},\n\
\n\
	/**\n\
	  @param {Number} [target=0] The number to round towards\n\
	  @return This number rounded to the next integer towards the target\n\
	  @type Number\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	roundTowards: function(target) {\n\
		if (target === undefined) target = 0;\n\
		var floor = this.floor(),\n\
			ceil = this.ceil(),\n\
			delta = Math.abs(this - target);\n\
		return (!delta || delta < 1 && delta.between(Math.abs(floor - target), Math.abs(ceil - target))) ?\n\
			target : (this > target) ? floor : ceil;\n\
	},\n\
\n\
	/**\n\
	  @return The signum of this number\n\
	  @type Number\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	sign: function() { return (this > 0) ? 1 : (this < 0) ? -1 : 0; }\n\
});\n\
Number.prototype.round.fastMap = [1, 10, 100, 1000];\n\
jQuery.each(["ceil", "floor", "abs"], function(i, name) {\n\
	Number.prototype[name] = function() { return Math[name](this); };\n\
});\n\
jQuery.each(["px", "pt", "em", "ex", "deg"], function(i, unit) {\n\
	Number.prototype[unit] = function() { return this.toUnit(unit); };\n\
});\n\
\n\
jQuery.extend(Number, {\n\
	/**\n\
	  @return Checks if an object is a number.\n\
	  @param obj any object\n\
	  @type Boolean\n\
	  @member Number\n\
	  @addon\n\
	*/\n\
	isNumber: function(obj) {\n\
		return typeof obj == "number";\n\
	}\n\
});\n\
\n\
\n\
\n\
if (!String.prototype.trim) {\n\
	String.prototype.trim = function() {\n\
		if (!this) return this;\n\
\n\
		var	s = this.replace(arguments.callee.patterns.matchStart, "");\n\
		if (!s) return "";\n\
\n\
		var ws = arguments.callee.patterns.matchWhiteSpace;\n\
		for (var i = s.length - 1; ws.test(s[i]); i--);\n\
		return s.substring(0, i + 1);\n\
	};\n\
	String.prototype.trim.patterns = {\n\
		matchStart: /^\\s\\s*/,\n\
		matchWhiteSpace: /\\s/\n\
	};\n\
}\n\
jQuery.extend(String.prototype, {\n\
	/**\n\
	  @return The integer representation of this string\n\
	  @type Number\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	toInt: function() { return parseInt(this); },\n\
\n\
	/**\n\
	  @return The float representation of this string\n\
	  @type Number\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	toFloat: function() { return parseFloat(this); },\n\
\n\
	/**\n\
	  @param {..String} strings to match against\n\
	  @return Checks if any argument matches this string.\n\
	  @type Boolean\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	equals: function() {\n\
		for (var i=arguments.length-1; i >= 0; i--) {\n\
			if (this == arguments[i]) return true;\n\
		}\n\
		return false;\n\
	},\n\
\n\
	/**\n\
	  @param {..String} strings to match against\n\
	  @return Checks if this string contains any arguments as a substring.\n\
	  @type Boolean\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	contains: function() {\n\
		for (var i=arguments.length-1; i >= 0; i--) {\n\
			if (this.indexOf(arguments[i]) !== -1)\n\
				return true;\n\
		}\n\
		return false;\n\
	},\n\
\n\
	/**\n\
	  @return Checks if this string has a prefix.\n\
	  @type Boolean\n\
	  @param {String} s The prefix\n\
	  @param {Boolean} [equal=true] If <code>false</code>, check for equality\n\
	    instead of prefix.\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	startsWith: function(s, equal) {\n\
		s = s.toString();\n\
		if (s.length > this.length) return false;\n\
		if (equal === undefined) equal = true;\n\
		var i;\n\
		for (i = 0; i < s.length; i++) {\n\
			if (s.charCodeAt(i) !== this.charCodeAt(i))\n\
				return false;\n\
		}\n\
		return equal || i !== this.length;\n\
	},\n\
\n\
	/**\n\
	  @return Checks if this string has a suffix.\n\
	  @type Boolean\n\
	  @param {String} s The suffix\n\
	  @param {Boolean} [equal=true] If <code>false</code>, check for equality\n\
	    instead of suffix.\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	endsWith: function(s, equal) {\n\
		s = s.toString();\n\
		if (s.length > this.length) return false;\n\
		if (equal === undefined) equal = true;\n\
		var i;\n\
		for (var i=s.length-1; i >= 0; i--) {\n\
			if (s.charCodeAt(i) !== this.charCodeAt(i))\n\
				return false;\n\
		}\n\
		return equal || i !== 0;\n\
	},\n\
\n\
	_split_old: String.prototype.split,\n\
\n\
	/**\n\
	  Replaces the built-in split function so that the delimiter defaults to\n\
	  the regular expression <code>\\s+</code>. The old behaviour can be accessed\n\
	  via {@link #_split_old}.\n\
	  @see http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	split: function(delim, n) {\n\
		return this._split_old(delim || String._DefaultDelimiter, n);\n\
	},\n\
\n\
	/**\n\
	  @return the character at the wrapped around index.\n\
	  @type String\n\
	  @param {Number} i An index (see {@link #getIndex})\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	get: function(i) { return this[this.getIndex(i)]; },\n\
\n\
	/**\n\
	  @return Converts an index to its wrapped around form for this string. If\n\
	    the index is neagtive, count from the string end.\n\
	  @type Number\n\
	  @param {Number} i The index to convert\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	getIndex: function(i) {\n\
		return (this.length) ?\n\
			((i >= 0) ? (i % this.length) : (this.length - i % this.length)) :\n\
			NaN;\n\
	}\n\
});\n\
\n\
jQuery.extend(String, {\n\
	_DefaultDelimiter: /\\s+/g,\n\
\n\
	/**\n\
	  @return a copy of the default delimiter for the split function\n\
	  @type RegExp\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	getDefaultDelimiter: function() { return new RegExp(String._DefaultDelimiter); },\n\
\n\
	/**\n\
	  @return Checks if an object is either no string or empty.\n\
	  @type Boolean\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	isEmpty: function(s) {\n\
		return !(s && typeof s == "string");\n\
	},\n\
\n\
	/**\n\
	  Compares two strings case-insensitively.\n\
	  @param {String} a A string\n\
	  @param {String} b Another string\n\
	  @result 1 if <code>a &gt; b</code>; &minus;1 if <code>a &lt; b</code>;\n\
	    0 if they are equal (except for character case)\n\
	  @type Number\n\
	  @member String\n\
	  @addon\n\
	*/\n\
	compareIgnoreCase: function(a, b) {\n\
		a = a.toLowerCase();\n\
		b = b.toLowerCase();\n\
		return (a < b) ? -1 : (a > b) ? 1 : 0;\n\
	}\n\
});\n\
\n\
\n\
jQuery.extend(Math, {\n\
	deviation: function(a, b) { return Math.abs(a / b - 1); }\n\
});\n\
\n\
\n\
/**\n\
  @return Parses an object and returns an object containing its\n\
    <code>value</code> and CSS <code>unit</code>.\n\
  @type Object\n\
  @param {Object} [obj] (Re)use another object to hold the result values.\n\
  @param {String|Number|SVGLength} s An object containing a length information\n\
*/\n\
function parseCSSLength(obj, s) {\n\
	if (typeof obj != "object") {\n\
		s = obj;\n\
		obj = {};\n\
	}\n\
\n\
	if (s instanceof SVGLength || s && s.toString() == "[object SVGLength]") {\n\
		obj.value = s.value;\n\
		switch (s.unitType) {\n\
			case s.SVG_LENGTHTYPE_NUMBER:     obj.unit = ""; break;\n\
			case s.SVG_LENGTHTYPE_PERCENTAGE: obj.unit = "%"; break;\n\
			case s.SVG_LENGTHTYPE_EMS:        obj.unit = "em"; break;\n\
			case s.SVG_LENGTHTYPE_EXS:        obj.unit = "ex"; break;\n\
			case s.SVG_LENGTHTYPE_PX:         obj.unit = "px"; break;\n\
			case s.SVG_LENGTHTYPE_CM:         obj.unit = "cm"; break;\n\
			case s.SVG_LENGTHTYPE_MM:         obj.unit = "mm"; break;\n\
			case s.SVG_LENGTHTYPE_IN:         obj.unit = "in"; break;\n\
			case s.SVG_LENGTHTYPE_PT:         obj.unit = "pt"; break;\n\
			case s.SVG_LENGTHTYPE_PC:         obj.unit = "pc"; break;\n\
			default: obj.unit = null;\n\
		}\n\
	} else if (typeof s == "number") {\n\
		obj.value = s;\n\
		obj.unit = "";\n\
	} else if (typeof s == "string") {\n\
		s = s.match(arguments.callee.pattern);\n\
		if (s) {\n\
			obj.value = s[1].toFloat();\n\
			obj.unit = s[4];\n\
		} else {\n\
			obj = null;\n\
		}\n\
	} else {\n\
		throw "Unsupported length type: " + s;\n\
		obj = null;\n\
	}\n\
	return obj;\n\
}\n\
parseCSSLength.pattern = /^\\s*([\\+-]?(\\.\\d+|\\d+\\.?\\d*)(e[\\+-]?\\d+)?)(%|em|ex|px|cm|mm|in|pt|pc|)\\s*$/i;\n\
\n\
/**\n\
  Looks for a CSS ruleset in a set of stylesheets with a specific selector.\n\
  @param {StyleSheet|CSSStyleSheet|Array} [stylesheets=document.styleSheets]\n\
    A set of stylesheets\n\
  @param {String} selector A selector to look for\n\
  @return The first ruleset with the given selector\n\
*/\n\
function getCSSRule(stylesheets, selector) {\n\
	if (stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet)) {\n\
		stylesheets = [stylesheets];\n\
	} else if (!(stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet) || stylesheets instanceof Array)) {\n\
		selector = stylesheets;\n\
		stylesheets = document.styleSheets;\n\
	}\n\
\n\
	for (var i=0; i < stylesheets.length; i++) {\n\
		// search in all rules\n\
		for (var j=0; j < stylesheets[i].cssRules.length; j++) {\n\
			if (stylesheets[i].cssRules[j].selectorText == selector)\n\
				return stylesheets[i].cssRules[j];\n\
		}\n\
	}\n\
	return null;\n\
}\n\
\n\
/**\n\
  Changes a rule in a CSS stylesheet.\n\
  @param {StyleSheet|CSSStyleSheet|StyleSheetList|Array}\n\
    [stylesheets=document.styleSheets] A set of stylesheets\n\
  @param {String} selector A selector identifying the rule to modify\n\
  @param {Object|String} style A string identifying the CSS property to change,\n\
    or an object with key-value-pairs of CSS properties and their corresponding\n\
    values\n\
  @param {String} [value] If <code>style</code> is a string, this is the value\n\
    to assign to the CSS property.\n\
  @param {Boolean} [multiple=false] If <code>false</code>, the modification\n\
    stops after the first selector match.\n\
  @return The modified CSS rule, if <code>multiple</code> is <code>false</code>;\n\
    <code>null</code> otherwise\n\
*/\n\
function changeCSSRule(stylesheets, selector, style, value, multiple) {\n\
	if (stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet)) {\n\
		stylesheets = [stylesheets];\n\
	} else if (!(stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet) || stylesheets instanceof Array)) {\n\
		multiple = value;\n\
		value = style;\n\
		style = selector;\n\
		selector = stylesheets;\n\
		stylesheets = document.styleSheets;\n\
	}\n\
\n\
	/*if (jQuery.browser.opera) {\n\
		selector += " { ";\n\
		if (typeof style == "object") {\n\
			for (var key in style)\n\
				selector += convertPropertyToCSSName(key) + ": " + style[key] + "; ";\n\
		} else {\n\
			selector += style + ": " + value + "; ";\n\
		}\n\
		selector += "}";\n\
		addStyle(selector);\n\
		return null;\n\
	}*/\n\
\n\
	// else\n\
	if (typeof style == "object") {\n\
		multiple = Boolean(value);\n\
	} else {\n\
		multiple = Boolean(multiple);\n\
		style = convertCSSNameToProperty(style.toString());\n\
	}\n\
\n\
	// search in all stylesheets\n\
	for (var i=0; i < stylesheets.length; i++) {\n\
		// search in all rules\n\
		for (var j=0; j < stylesheets[i].cssRules.length; j++) {\n\
			if (stylesheets[i].cssRules[j].selectorText == selector) {\n\
				if (typeof style == "object") {\n\
					$.extend(stylesheets[i].cssRules[j].style, style);\n\
				} else {\n\
					stylesheets[i].cssRules[j].style[style] = value;\n\
				}\n\
				if (!multiple) return stylesheets[i].cssRules[j];\n\
			}\n\
		}\n\
	}\n\
	if (!multiple) return null;\n\
}\n\
\n\
/**\n\
  @return Converts a CSS property name to a JavaScript object property name.\n\
  @type String\n\
  @param {String} cssname A CSS property name\n\
*/\n\
function convertCSSNameToProperty(cssname) {\n\
	var prop = "",\n\
		end = cssname.length - 1,\n\
		last = 0;\n\
	for (var i=0; i < end; i++) {\n\
		if (cssname.charCodeAt(i) === 0x2D) {\n\
			prop += cssname.substring(last, i) + cssname[++i].toUpperCase();\n\
			last = i + 1;\n\
		}\n\
	}\n\
	prop = last ? prop + cssname.substring(last) : cssname;\n\
	return prop;\n\
}\n\
\n\
/**\n\
  @return Converts a JavaScript object property name to a CSS property name.\n\
  @type String\n\
  @param {String} prop A JavaScript object property name\n\
*/\n\
function convertPropertyToCSSName(prop) {\n\
	var cssname = "",\n\
		last = 0;\n\
	for (var i=0; i < key.length; i++) {\n\
		if (prop.charChodeAt(i).between(0x41, 0x5A)) {\n\
			cssname += prop.substring(last, i) + "-" + prop[i].toLowerCase();\n\
			last = i + 1;\n\
		}\n\
	}\n\
	cssname = last ? cssname + prop.substring(last) : prop;\n\
	return cssname;\n\
}\n\
\n\
\n\
\n\
/**\n\
  @constructor\n\
  @class The SVG class helps to apply matrix transformations to nodes in an SVG\n\
  document.\n\
  @param {SVG} [template] Use a template object and use one of its children and\n\
    a copy of its transform stack. You must specify <code>index</code>, if you\n\
    use this.\n\
  @param {Number} [index] When using a template, this is the index of the\n\
    template\'s child to use.\n\
  @param {...SVG|jQuery|Array|Object} Arrays of SVG document nodes that will be\n\
    stored in the resulting SVG object. Each node is stored by its numeric index\n\
    just as with arrays.\n\
*/\n\
function SVG(template, index) {\n\
	if (template instanceof SVG && typeof index == "number") {\n\
		this.length = 1;\n\
		this[0] = template[index];\n\
		this.transformStack = template.transformStack.clone();\n\
	} else {\n\
		/**\n\
		  The number of nodes in this object\n\
		*/\n\
		this.length = 0;\n\
		for (var i=0; i < arguments.length; i++) {\n\
			var arg = arguments[i];\n\
			if (arg instanceof SVG || arg instanceof jQuery || arg instanceof Array) {\n\
				for (var j=0; j < arg.length; j++)\n\
					if (arg[j].transform)\n\
						this[this.length++] = arg[j];\n\
			} else if (arg.transform) {\n\
				this[this.length++] = arg;\n\
			}\n\
		}\n\
\n\
		/**\n\
		  The list of transformations applied to the nodes using thid SVG object\n\
		*/\n\
		this.transformStack = new Array();\n\
	}\n\
\n\
	/**\n\
	  The document element of the first SVG node.\n\
	*/\n\
	this.doc = this[0] ? this[0].ownerSVGElement || this[0].ownerDocument.documentElement : null;\n\
}\n\
\n\
jQuery.extend(SVG.fn = SVG.prototype, {\n\
\n\
	/**\n\
	  @return The DOM node at the given index\n\
	  @type Node\n\
	  @param Number i The node index\n\
	  @member SVG\n\
	*/\n\
	get: function(i) { return this[i]; },\n\
\n\
	/**\n\
	  @return A new SVG object containing only the node at the given index\n\
	  @type SVG\n\
	  @param Number i The node index\n\
	  @see SVG\n\
	  @member SVG\n\
	*/\n\
	eq: function(i) { return (this.length > 1) ? new SVG(this, i) : this; },\n\
\n\
	/**\n\
	  @return An array of all DOM nodes in this object or a subarray thereof\n\
	  @type Array\n\
	  @param Number [start=0] The index of the first element to export\n\
	  @param Number [end] The index of the element after last element to export\n\
	  @member SVG\n\
	*/\n\
	all: function(start, end) {\n\
		if (!start || start < 0) start = 0;\n\
		if (!end || end > this.length) end = this.length;\n\
\n\
		var a = new Array(Math.max(end - start, 0));\n\
		for (; start < end; start++) a[start] = this[start];\n\
		return a;\n\
	},\n\
\n\
	/**\n\
	  Invokes a given function on all DOM nodes in this object (similar to\n\
	  {@link jQuery.each}).\n\
	  @param Function callback The function to invoke\n\
	  @return <code>this</code>\n\
	  @type SVG\n\
	  @member SVG\n\
	*/\n\
	"each": function(callback) {\n\
		jQuery.each(this, callback);\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  @return An SVGMatrix object with the 6 given values as entries.\n\
	  @type SVGMatrix\n\
	  @param {...Number} The matrix entries\n\
	  @member SVG\n\
	*/\n\
	matrix: function(a, b, c, d, e, f) {\n\
		var m = this.doc.createSVGMatrix();\n\
		m.a = Number(a);\n\
		m.b = Number(b);\n\
		m.c = Number(c);\n\
		m.d = Number(d);\n\
		m.e = Number(e);\n\
		m.f = Number(f);\n\
		return m;\n\
	},\n\
\n\
	/**\n\
	  Applies a transformation to all SVG nodes.\n\
	  @param {SVGTransform} [transform] A transformation object to use. If none\n\
	    is given, create a new one.\n\
	  @param {SVGMatrix|String} A transformation matrix to use or a string with\n\
	    a transformation name:\n\
	    <ul>\n\
	      <li><code>matrix</code>: use the following 6 arguments as\n\
	        transformation matrix entries (see {@link SVGTransform#setMatrix}).\n\
	        </li>\n\
	      <li><code>skew</code>: use a skew transformation matrix; the following\n\
	        2 arguments are the skew amount for X and Y (see\n\
	        {@link SVGTransform#setSkewX}, {@link SVGTransform#setSkewY}).</li>\n\
	      <li><code>scale</code>: use a scale transformation matrix; the\n\
	        following 2 arguments are the scaling amount for X and Y (=X, if not\n\
	        specified; see {@link SVGTransform#setScale}).</li>\n\
	      <li><code>translate</code>: use a translate transformation matrix; the\n\
	        following 2 arguments are the translation amount for X and Y (see\n\
	        {@link SVGTransform#setTranslate}).</li>\n\
	      <li><code>rotate</code>: use a translate rotation matrix; the\n\
	        following argument is the rotation amount  (see\n\
	        {@link SVGTransform#setRotate}).</li>\n\
	    </ul>\n\
	  @param {...Number} transformation parameters\n\
	  @return the transformation object\n\
	  @type SVGTransform\n\
	  @member SVG\n\
	*/\n\
	transform: function(transform, action, a, b, c, d, e, f) {\n\
		if (transform instanceof SVGTransform && arguments.length === 1) {\n\
			if (jQuery.browser.opera) {\n\
				// opera does not allow us to insert a transform object into multiple transform lists; therefore, create a new transform object\n\
				action = transform.matrix;\n\
				transform = this.doc.createSVGTransform();\n\
				transform.setMatrix(action);\n\
			}\n\
		} else {\n\
			if (transform instanceof SVGMatrix || typeof transform == "string") {\n\
				f = e; e = d; d = c; c = b; b = a; a = action;\n\
				action = transform;\n\
				transform = null;\n\
			}\n\
\n\
			if (!(transform instanceof SVGTransform)) transform = this.doc.createSVGTransform();\n\
			if (action instanceof SVGMatrix) {\n\
				transform.setMatrix(action);\n\
			} else if (typeof action == "string") {\n\
				if (action == "matrix") {\n\
					transform.setMatrix(this.matrix(a, b, c, d, e, f));\n\
				} else if (action == "skew") {\n\
					transform.setSkewX(a);\n\
					transform.setSkewY(b);\n\
				} else if (action == "scale") {\n\
					transform.setScale(a, isNaN(b) ? a : b);\n\
				} else {\n\
					var t = "set" + action[0].toUpperCase() + action.substring(1);\n\
					if (!Function.isFunction(transform[t])) throw "\\""+action+"\\" is an unknown transformation kind."\n\
					transform[t](a, b, c, d, e, f);\n\
				}\n\
			}\n\
		}\n\
		return transform;\n\
	},\n\
\n\
	/**\n\
	  Applies a transformation to all DOM nodes on this object. If the same\n\
	  transformation object already exists in the list, the old entry is removed.\n\
	  @param {SVGTransform|SVGMatrix|String} transform See the\n\
	    <code>transform</code> argument on {@link #transform}.\n\
	  @param {Number} pos The transformation is inserted into the transformation\n\
	    list at this index\n\
	  @param {...Number} transformation arguments\n\
	  @return The performed transformation\n\
	  @type SVGTransform\n\
	  @see #transform\n\
	  @member SVG\n\
	*/\n\
	insertBefore: function(transform, pos, a, b, c, d, e, f) {\n\
		if (!(transform instanceof SVGTransform))\n\
			transform = this.transform(transform, a, b, c, d, e, f);\n\
\n\
		// apply the transformation to the DOM nodes\n\
		if (this.length) {\n\
			for (var i=this.length-1; i >= 0; i--) {\n\
				if (pos >= this[i].transform.baseVal.numberOfItems) {\n\
					this[i].transform.baseVal.appendItem(i ? this.transform(transform) : transform);\n\
				} else {\n\
					this[i].transform.baseVal.insertItemBefore(i ? this.transform(transform) : transform, pos);\n\
				}\n\
			}\n\
\n\
			// store the transformation in the stack but remove previous occurences of the same transformation\n\
			var stackpos = this.transformStack.indexOf(transform);\n\
			if (stackpos !== -1 && pos !== stackpos && pos < this.transformStack.length - 1)\n\
				this.transformStack.splice(stackpos, 1);\n\
			if (pos >= this.transformStack.length) {\n\
				this.transformStack.push(transform);\n\
			} else {\n\
				this.transformStack.splice(Math.max(pos, 0), 0, transform);\n\
			}\n\
		}\n\
		return transform;\n\
	},\n\
\n\
	/**\n\
	  Adds a transformation to the tail of all transformation lists.\n\
	  @param {SVGTransform|SVGMatrix|String} transform See the\n\
	    <code>transform</code> argument on {@link #transform}.\n\
	  @param {...Number} transformation arguments\n\
	  @return The performed transformation\n\
	  @type SVGTransform\n\
	  @see #insertBefore\n\
	  @member SVG\n\
	*/\n\
	push: function(transform, a, b, c, d, e, f) {\n\
		return this.insertBefore(transform, Infinity, a, b, c, d, e, f, g);\n\
	},\n\
\n\
	/**\n\
	  Adds a transformation to the head of all transformation lists.\n\
	  @param {SVGTransform|SVGMatrix|String} transform See the\n\
	    <code>transform</code> argument on {@link #transform}.\n\
	  @param {...Number} transformation arguments\n\
	  @return The performed transformation\n\
	  @type SVGTransform\n\
	  @see #insertBefore\n\
	  @member SVG\n\
	*/\n\
	unshift: function(transform, a, b, c, d, e, f) {\n\
		return this.insertBefore(transform, 0, a, b, c, d, e, f, g);\n\
	},\n\
\n\
	/**\n\
	  Removes a transformation in the stack from the stack and all SVG nodes.\n\
	  @param {SVGTransform|Number} transform The index of the transformation in\n\
	    the transform stack, or the SVGTransform object to remove itself\n\
	  @return <code>this</code>\n\
	  @type SVG\n\
	  @member SVG\n\
	*/\n\
	remove: function(transform) {\n\
		var pos;\n\
		if (typeof transform == "number") {\n\
			pos = transform.min(this.transformStack.length - 1);\n\
			transform = this.transformStack[pos];\n\
		} else {\n\
			pos = this.transformStack.indexOf(transform);\n\
		}\n\
\n\
		if (pos !== -1)\n\
			this.transformStack.splice(pos, 1);\n\
\n\
		if (transform) {\n\
			for (var i=this.length-1; i >= 0; i--) {\n\
				for (var j=0; j < this[i].transform.baseVal.numberOfItems; j++) {\n\
					if (transform === this[i].transform.baseVal.getItem(j)) {\n\
						this[i].transform.baseVal.removeItem(j);\n\
						break;\n\
					}\n\
				}\n\
			}\n\
		}\n\
\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  Removes the first transformation in the stack from all SVG nodes.\n\
	  @return <code>this</code>\n\
	  @type SVG\n\
	  @member SVG\n\
	*/\n\
	shift: function() { return this.remove(0); },\n\
\n\
	/**\n\
	  Removes the last transformation in the stack from all SVG nodes.\n\
	  @return <code>this</code>\n\
	  @type SVG\n\
	  @member SVG\n\
	*/\n\
	pop: function() { return this.remove(Infinity); },\n\
\n\
	/**\n\
	  Changes the transformation at a given stack position. If there is no entry\n\
	  at that position, it will be pushed onto the stack.\n\
	  @param {SVGTransform|SVGMatrix|String} transform See the\n\
	    <code>transform</code> argument on {@link #transform}.\n\
	  @param {Number} pos The transformation is inserted into the transformation\n\
	    list at this index\n\
	  @param {...Number} transformation arguments\n\
	  @see #push\n\
	  @see #insertBefore\n\
	  @return The resulting transformation object\n\
	  @type SVGTransform\n\
	  @member SVG\n\
	*/\n\
	change: function(action, pos, a, b, c, d, e, f) {\n\
		var transform = this.transformStack[pos];\n\
		if (!transform) return this.push(action, a, b, c, d, e, f);\n\
\n\
		this.transform(transform, action, a, b, c, d, e, f);\n\
		if (jQuery.browser.opera) {\n\
			for (var i=this.length-1; i >= 0; i--)\n\
				this[i].transform.baseVal.getItem(Math.min(pos, this[i].transform.baseVal.numberOfItems - 1)).setMatrix(transform.matrix);\n\
		}\n\
		return transform;\n\
	}\n\
});\n\
jQuery.each(["translate", "rotate", "skew", "matrix", "scale"], function(i, name) {\n\
	var fname = name[0].toUpperCase() + name.substring(1);\n\
	jQuery.each(["push", "unshift", "change"], function(j, prefix) {\n\
		SVG.fn[prefix + fname] = function(pos, a, b, c, d, e, f) { return this[prefix](name, pos, a, b, c, d, e, f); };\n\
	});\n\
});\n\
SVG.namespaceURI = "http://www.w3.org/2000/svg";\n\
\n\
jQuery.extend(SVG, {\n\
	/**\n\
	  @return Checks if a node contains (<code>&lt;object&gt;</code> or\n\
	    <code>&lt;embed&gt;</code> nodes) or is part of an SVG document.\n\
	  @type Boolean\n\
	  @member SVG\n\
	*/\n\
	isSVGObject: function(node) {\n\
		var d = node.contentDocument;\n\
		d = (d || node).documentElement;\n\
		return Boolean(d && checkTagType(d, SVG.namespaceURI, "svg") || node.ownerSVGElement);\n\
	},\n\
\n\
	/**\n\
	  This function is the default namespace resolver for SVG documents.\n\
	  @return Returns the SVG namespace URI for a prefix\n\
	    <code>&quot;svg&quot;</code>, or <code>null</code> otherwise.\n\
	  @type String\n\
	  @member SVG\n\
	*/\n\
	lookupNamespaceURIDefault: function(prefix) {\n\
		return (prefix.equals("svg", "")) ? SVG.namespaceURI : null;\n\
	}\n\
});\n\
\n\
\n\
\n\
jQuery.fn.extend({\n\
	/**\n\
	  @return The maximally allowed height of the first element, which\n\
	    depends on a local property of that element or a global setting.\n\
	  @type Number\n\
	  @member jQuery\n\
	  @addon\n\
	*/\n\
	getMaxHeight: function() {\n\
		var h = window.innerHeight * (this[0].maxHeightRatio || GlobalSettings.image.maxHeightRatio || 1) - this.offset().top;\n\
		return (this[0].navigatorMaxHeight = Math.max(h, this[0].maxHeightMin || GlobalSettings.image.minHeightAbs || 0).ceil()).px();\n\
	},\n\
\n\
	/**\n\
	  Cycles the classes of all elements based on the passed class name array or\n\
	  one set as a property to the DOM elements.\n\
	  If an element contains a cycle class, that class is replaced by the next\n\
	  of the class name array. If it does not contain such a class name, the\n\
	  first is appended to its current class names.\n\
	  @param {Array} [cycle] class names to cycle through\n\
	  @param {...String} You can also specify the class names as argument list\n\
	    instead of an array.\n\
	  @return <code>this</this>\n\
	  @type jQuery\n\
	  @member jQuery\n\
	  @addon\n\
	*/\n\
	cycleClass: function(cycle) {\n\
		if (!(cycle instanceof Array)) cycle = arguments;\n\
		for (var i=this.length-1; i >= 0; i--) {\n\
			var cycle_current = cycle.length ? cycle : this[i].cycleClasses;\n\
			if ((cycle_current === cycle) && Array.isEmpty(cycle_current)) continue;\n\
\n\
			var classes = this[i].className.trim().split();\n\
			if (classes.length === 1 && !classes[0].length) classes = [];\n\
\n\
			var pos = -1, j;\n\
			for (j = 0; j < cycle_current.length; j++) {\n\
				if ((pos = classes.indexOf(cycle_current[j])) !== -1)\n\
					break;\n\
			}\n\
\n\
			if (pos === -1) {\n\
				this[i].className = this[i].className.length ? this[i].className + " " + cycle_current[0] : cycle_current[0];\n\
			} else {\n\
				classes.splice(pos, 1);\n\
				this[i].className = (classes.length) ? classes.join(" ") + " " + cycle_current.get(j + 1) : cycle_current.get(j + 1);\n\
			}\n\
		}\n\
		return this;\n\
	},\n\
\n\
	_offset_old: jQuery.fn.offset,\n\
\n\
	/**\n\
	  Replaces the old offset function with one that recursively adds all\n\
	  offsets of the first element up to a given parent node.\n\
	  If the function does not encounter that node, it adds all offsets until\n\
	  the <code>&lt;body&gt;</code> node.\n\
	  @param {Node|jQuery} [parent=document.body] The parent node to calculate\n\
	    the relative offset to\n\
	  @return An object containing the <code>left</code> and <code>top</code>\n\
	    offsets\n\
	  @type Object\n\
	  @member jQuery\n\
	  @addon\n\
	*/\n\
	offset: function(parent) {\n\
		if (parent instanceof jQuery) parent = parent[0];\n\
		if (!parent) parent = document.body;\n\
		if (this[0] === parent || this[0] === document.body || this[0] === document.documentElement)\n\
			return {top: 0, left: 0};\n\
\n\
		// else\n\
		var offset = $(this[0].offsetParent).offset(parent),\n\
			style = window.getComputedStyle(this[0], null);\n\
		offset.top += this[0].offsetTop\n\
			+ (!jQuery.browser.opera && style.borderTopWidth.toFloat())\n\
			+ style.paddingTop.toFloat();\n\
		offset.left += this[0].offsetLeft\n\
			+ (!jQuery.browser.opera && style.borderLeftWidth.toFloat())\n\
			+ style.paddingLeft.toFloat();\n\
		return offset;\n\
	},\n\
\n\
	/**\n\
	  This is supposed to be a workaround for misinterpreted\n\
	  <code style="white-space: nowrap;">max-height</code> CSS properties. You\n\
	  need to call this everytime the\n\
	  <code style="white-space: nowrap;">max-height</code> value changes and,\n\
	  for relative values, everytime its related value changes (i. e. the\n\
	  parent client height for &quot;%&quot; or the font size for &quot;em&quot;\n\
	  or &quot;ex&quot;).\n\
	  @return <code>this</this>\n\
	  @type jQuery\n\
	  @member jQuery\n\
	  @addon\n\
	*/\n\
	maxDimWorkaround: function() {\n\
		if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) {\n\
			for (var i=this.length-1; i >= 0; i--) {\n\
				var classes = this[i].parentNode.parentNode.className.split();\n\
				this[i].style.height = classes.contains("scaled") ? GlobalSettings.image.minHeightAbs.px() : "";\n\
				//this[i].style.width = classes.contains("full") ? (i ? this.eq(i) : this).naturalDimensions().width.px() : "";\n\
			}\n\
		}\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  @returns An object with the natural <code>width</code> and\n\
	    <code>height</code> of the first element (i. e. images). If there is no\n\
	    such entry with a natural size, both values are 0.\n\
	  @type Object\n\
	  @member jQuery\n\
	  @addon\n\
	*/\n\
	naturalDimensions: function() {\n\
		if (this[0]) {\n\
			if (this[0].naturalWidth !== undefined) {\n\
				if (this[0].naturalWidth || this[0].naturalHeight)\n\
					return {width: this[0].naturalWidth, height: this[0].naturalHeight};\n\
\n\
			} else if (this[0].width || this[0].height) {\n\
				var img;\n\
				if (this[0] instanceof HTMLImageElement) {\n\
					img = this[0].cloneNode(false);\n\
					this[0].naturalWidth = img.width;\n\
					this[0].naturalHeight = img.height;\n\
				} else {\n\
					img = this[0];\n\
				}\n\
				return {width: img.width, height: img.height};\n\
			}\n\
		}\n\
		return {width: 0, height: 0};\n\
	},\n\
\n\
	/**\n\
	  Invokes a navigator action using the given options, or, if no action is\n\
	  given, returns the {@link Navigator} object associated to the first\n\
	  element.\n\
	  @param {String} [action] Perform an action on the associated navigator.\n\
	    <ul>\n\
	      <li><code>add</code>: If any of them has no navigator object, a new\n\
	        one is created and stored with the element; see\n\
	        {@link Navigator#add}</li>\n\
	      <li><code>resize</code>: see {@link Navigator#resize}</li>\n\
	      <li><code>bind</code>: see {@link Navigator#bind}; the necessary parameters may be passed as a\n\
	        single options object with key-value-pairs.</li>\n\
	      <li><code>getOrientation</code>: If invoked on a navigator handle,\n\
	        returns the orientation of that handle.</li>\n\
	      <li><code>image</code>: If invoked on a navigator handle, returns the\n\
	        corresponding image node (wrapped in a {@link jQuery} object).</li>\n\
	    </ul>\n\
	  @param {Object} [options] options passed to the invoked action\n\
	  @member jQuery\n\
	  @addon\n\
	*/\n\
	navigator: function(action, options) {\n\
		if (!arguments.length)\n\
			return this.data(Navigator._dataKey);\n\
\n\
		if (typeof action == "string") {\n\
			action = action.toLowerCase();\n\
\n\
			if (action == "getorientation") {\n\
				var orientation = null;\n\
				if (this.data(Navigator._dataKey)) {\n\
					var classNames = this[0].className.split();\n\
					for (var i=classNames.length-1; i >= 0; i--) {\n\
						if (classNames[i].startsWith(Navigator.classNames.handle.prefix))\n\
							return classNames[i].substring(Navigator.classNames.handle.prefix.length);\n\
					}\n\
				}\n\
				return null;\n\
			}\n\
\n\
			if (action == "image") {\n\
				var nav = this.data(Navigator._dataKey);\n\
				return nav ? nav.img : null;\n\
			}\n\
\n\
			if (Navigator._publicMethods.contains(action)) {\n\
				for (var i=0; i < this.length; i++) {\n\
					var o = i ? this.eq(i) : this,\n\
						nav = o.data(Navigator._dataKey);\n\
					if (nav instanceof Navigator) {\n\
						nav[action](options);\n\
					} else if (action == "add") {\n\
						nav = new Navigator(o, options);\n\
						o.data(Navigator._dataKey, nav);\n\
					}\n\
				}\n\
			}\n\
		}\n\
		return this;\n\
	}\n\
});\n\
\n\
jQuery.browser.majorVersion = jQuery.browser.version.toFloat();\n\
jQuery.extend(jQuery.support, {\n\
	transform: (function() {\n\
		var n = document.createElement("div");\n\
		if (n.filters) return true;\n\
		var properties = ["transform", "MozTransform", "WebkitTransform", "KhtmlTransform", "OTransform"];\n\
		for (var i=0; i < properties.length; i++) {\n\
			if (n.style[properties[i]] !== undefined)\n\
				return true;\n\
		}\n\
		return false;\n\
	})()\n\
});\n\
\n\
\n\
/**\n\
  @constructor\n\
  @class <p>This class helps displaying handy icons in front of an image (or in\n\
    principle any other HTML element with dimensions).</p>\n\
    <p>The icons are surrounded by sensitive areas that you can bind event\n\
    handlers to. They adapt in size and position depending on the image\n\
    dimensions and some global settings.</p>\n\
  @param {Node|jQuery} img An image node\n\
  @param {Object} options An option object\n\
  @see #add\n\
*/\n\
function Navigator(img, options) {\n\
	/**\n\
	  The image to build this navigator upon.\n\
	*/\n\
	this.img = (img instanceof jQuery && img.length > 1) ? img.eq(0) : $(img);\n\
\n\
	/**\n\
	  The root object of this navigator.\n\
	*/\n\
	this.root = $(this.img[0].parentNode.parentNode);\n\
\n\
	/**\n\
	  The handle containers of this navigator stored by their orientation\n\
	*/\n\
	this.container = {};\n\
\n\
	/**\n\
	  The handle containers of this navigator stored in an array for easy\n\
	  wrapping in a jQuery object\n\
	*/\n\
	this.container_array = new Array();\n\
\n\
	/**\n\
	  Chaches the UI handle groups.\n\
	  Access this value by the \'getHandleUIObjectGroups\' method.\n\
	*/\n\
	this._handleUIObjectGroups = null;\n\
\n\
	/**\n\
	  Caches the SVG object with all SVG nodes relevant for scale transformation.\n\
	  Access this value by the \'getSVGObject\' method.\n\
	*/\n\
	this._handleSVGObject = null;\n\
\n\
	/**\n\
	  Stores the current handle icon scaling ratio an the corresponding\n\
	  SVGTransform object.\n\
	*/\n\
	this._currentScale = {ratio: 1, transform: null};\n\
\n\
	if (typeof options == "object") {\n\
		this.root.addClass(Navigator.classNames.root[0]);\n\
		this.add(options);\n\
	}\n\
\n\
	Navigator.navigators.push(this);\n\
\n\
	/**\n\
	  Displays the natural and the current image dimension\n\
	*/\n\
	this.dimensionDisplay = this.dimensionDisplayBg = null;\n\
};\n\
\n\
jQuery.extend(Navigator.prototype, {\n\
	/**\n\
	  Adds new handles to this navigator and the underlying image.\n\
	  @param {Object} options Must contain key-value-pairs of orientations\n\
	    (left, right, top, bottom, center) and link targets or callback methods.\n\
	  @return <code>this</code>\n\
	  @type Navigator\n\
	  @member Navigator\n\
	*/\n\
	add: function(options) {\n\
		var img = this.img[0];\n\
\n\
		// create a template handle node\n\
		var template = document.createElement("a");\n\
		if (GlobalSettings.debug < 2) template.style.display = "none";\n\
		template.appendChild(document.createElement("div"));\n\
\n\
		var container_new = new Array();\n\
		for (var or in options) if (options[or] && GlobalSettings.handles[or]) {\n\
			// create one handle for each (valid) orientation\n\
			var HSettings = GlobalSettings.handles[or];\n\
			var handle = template.cloneNode(true);\n\
			handle.className = Navigator.classNames.handle[0] + " " + Navigator.classNames.handle.prefix + or;\n\
\n\
			if (typeof HSettings.object.src == "object") {\n\
				// take care of handles with multiple icons\n\
				for (var key in HSettings.object.src)\n\
					handle.firstChild.appendChild(this._makeUIObject(HSettings.object.src[key], HSettings.object.mime, key, HSettings.rotation));\n\
			} else {\n\
				handle.firstChild.appendChild(this._makeUIObject(HSettings.object.src, HSettings.object.mime, "all", HSettings.rotation));\n\
			}\n\
\n\
			// store the container of the new handle\n\
			if (this.container[or]) {\n\
				// remove old handles and don\'t reappend existing handles\n\
				this.container[or].parentNode.removeChild(this.container[or]);\n\
				this.container_array[this.container_array.indexOf(this.container[or])] = handle;\n\
			} else {\n\
				this.container_array.push(handle);\n\
			}\n\
\n\
			handle.addEventListener(\n\
				jQuery.browser.mozilla ? "DOMMouseScroll" : "mousewheel",\n\
				function(evt) { handleScrolling(evt, img.parentNode); },\n\
				false);\n\
\n\
			this.container[or] = handle;\n\
			container_new.push(handle);\n\
		}\n\
\n\
		if (container_new.length) {\n\
			container_new = $(container_new);\n\
\n\
			// we need at least 2 parent nodes to the image\n\
			if (img.parentNode === document.body) {\n\
				var div = document.createElement("div");\n\
				document.body.insertBefore(div, img);\n\
				div.appendChild(img);\n\
			}\n\
\n\
			// ensure that the 2nd parent has no \'static\' position\n\
			with (img.parentNode.parentNode) {\n\
				if (!style.position.equals("relative", "absolute", "fixed"))\n\
					style.position = "relative";\n\
			}\n\
\n\
			// append the new handles\n\
			this.img.parent().parent().append(container_new);\n\
\n\
			var nav = this;\n\
			container_new[container_new.length - 1].firstChild.lastChild.addEventListener("load",\n\
				function(evt) {\n\
					this.removeEventListener(evt.type, arguments.callee, evt.bubbles);\n\
					nav.resize();\n\
					if (GlobalSettings.debug < 2)\n\
						container_new\n\
							.hover(Navigator._onmouseover, Navigator._onmouseout)\n\
							.css("display", "");\n\
					if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8)\n\
						container_new.find("object").css("display", "");\n\
\n\
					for (var or in options)\n\
						nav.bind(or, "click", options[or]);\n\
\n\
				}, false);\n\
\n\
			// clear caches and store the Navigator object on the containers\n\
			this._handleUIObjects = null;\n\
			this._handleSVGObject = null;\n\
			container_new.data(Navigator._dataKey, this);\n\
		}\n\
\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  @return Retrieves the handle icon set.\n\
	  @type jQuery\n\
	  @param {Number|String|Node|jQuery} A handle container (posssibly wrapped\n\
	    in a {@link jQuery}), an orientation, or a container index\n\
	  @member Navigator\n\
	*/\n\
	getHandleUIObjectGroup: function(i) {\n\
		if (i instanceof jQuery) i = i[0];\n\
		return $((typeof i == "object" && typeof i.className == "string") ?\n\
			(this.container_array.contains(i) ? i.firstChild.childNodes : []) :\n\
			((typeof i == "number") ? this.container_array : this.container)[i].firstChild.childNodes)\n\
	},\n\
\n\
	/**\n\
	  @return An object of key-value-pairs of all handle icon sets keyed by\n\
	    their orientation.\n\
	  @type Object\n\
	  @member Navigator\n\
	*/\n\
	getHandleUIObjectGroups: function() {\n\
		if (this._handleUIObjectGroups === null) {\n\
			this._handleUIObjectGroups = {};\n\
			for (var or in this.container)\n\
				this._handleUIObjectGroups[or] = this.getHandleUIObjectGroup(or);\n\
		}\n\
		return this._handleUIObjectGroups;\n\
	},\n\
\n\
	/**\n\
	  @return An SVG object with all SVG nodes relevant for (scaling)\n\
	    transformations.\n\
	  @type SVG\n\
	*/\n\
	getHandleSVGObject: function() {\n\
		if (this._handleSVGObject === null) {\n\
			var handleUI = this.getHandleUIObjectGroups(),\n\
				svg = new Array();\n\
			for (var or in handleUI)\n\
				for (var i=handleUI[or].length-1; i >= 0; i--) {\n\
					if (SVG.isSVGObject(handleUI[or][i]))\n\
						svg.push(Navigator.getRelevantSVGNode(handleUI[or][i]));\n\
				}\n\
			this._handleSVGObject = new SVG(svg);\n\
		}\n\
		return this._handleSVGObject;\n\
	},\n\
\n\
	/**\n\
	  Binds a href string or an event handler with a callback method to a handle\n\
	  and its icon.\n\
	  @param {String|Object} orientation An object with all arguments of this\n\
	    function as properties, or an orientation string\n\
	  @param {String} type The event type to listen to\n\
	  @param {Function} callback The event handler\n\
	  @param {Boolean} [useCapture=false] The 3rd argument of\n\
	    {@link Node.addEventListener}\n\
	  @return <code>this</code>\n\
	  @type Navigator\n\
	  @member Navigator\n\
	*/\n\
	bind: function(orientation, type, callback, useCapture) {\n\
		if (typeof orientation == "object") {\n\
			type = orientation.type;\n\
			callback = orientation.callback;\n\
			useCapture = orientation.useCapture;\n\
			orientation = orientation.orientation;\n\
		}\n\
\n\
		if (callback && this.container[orientation]) {\n\
			useCapture = Boolean(useCapture);\n\
			if (typeof callback == "string") {\n\
				this.container[orientation].href = callback;\n\
				callback = Navigator._redirect;\n\
			}\n\
\n\
			this.container[orientation].addEventListener(type, callback, useCapture);\n\
			var handleUI = this.getHandleUIObjectGroup(orientation);\n\
			if (handleUI) for (var i=handleUI.length-1; i >= 0; i--) {\n\
				if (SVG.isSVGObject(handleUI[i])) {\n\
					handleUI[i].contentDocument.documentElement.addEventListener(type, Navigator.forwardEvent, useCapture);\n\
					handleUI[i].contentDocument.documentElement.style.cursor = "pointer";\n\
				}\n\
			}\n\
		}\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  Displays an overlay box with the image dimensions.\n\
	  @return <code>this</code>\n\
	  @type Navigator\n\
	  @member Navigator\n\
	*/\n\
	drawDimension: function() {\n\
		var natDim = this.img.naturalDimensions();\n\
		if (!this.dimensionDisplay) {\n\
			this.dimensionDisplayBg = document.createElement("div");\n\
			this.dimensionDisplayBg.className = "image-dimension-background";\n\
			this.root[0].appendChild(this.dimensionDisplayBg);\n\
\n\
			//this.root.append(this.dimensionDisplay = $(\'<div class="image-dimension"><span>\'+ natDim.width + \'\\u00d7\' + natDim.height + \'</span><span/></div>\'));\n\
			this.dimensionDisplay = document.createElement("div");\n\
			this.dimensionDisplay.className = "image-dimension";\n\
			this.dimensionDisplay.innerHTML = "<span>" + natDim.width + "\\u00d7" + natDim.height + "</span><span/>"\n\
			this.root[0].appendChild(this.dimensionDisplay);\n\
		}\n\
		this.dimensionDisplay.lastChild.textContent = (natDim.width !== this.img[0].width || natDim.height !== this.img[0].height) ? " @ " + this.img[0].width + "\\u00d7" + this.img[0].height : "";\n\
		this.dimensionDisplayBg.textContent = this.dimensionDisplay.textContent;\n\
		return this;\n\
	},\n\
\n\
	/**\n\
	  Creates a new icon element with the given source/data and class attributes.\n\
	  If the MIME type is not supported by the <img> tag, use <object> instead.\n\
	  @param {String} src The <code>src</code> attribute\n\
	  @param {String} mime The MIME <code>type</code> attribute\n\
	  @param {String} [className] The <code>class</code> attribute\n\
	  @param {Number} [rotation] Applies an SVG rotation of\n\
	    <code>rotation</code> &times; 90° for browsers that don\'t support CSS\n\
	    rotation.\n\
	  @return The image/object node\n\
	  @type Node\n\
	  @member Navigator\n\
	  @private\n\
	*/\n\
	_makeUIObject: function(src, mime, className, rotation) {\n\
		var objectTag;\n\
		var pos = mime.indexOf("/");\n\
		if (pos === -1 || mime.substring(0, pos) == "image" && Navigator.imageMimeTypes.contains(mime.substring(pos + 1))) {\n\
			objectTag = document.createElement("img");\n\
			objectTag.src = src;\n\
		} else {\n\
			if (jQuery.browser.opera && jQuery.browser.majorVersion < 9.8) {\n\
				objectTag = document.createElement("iframe");\n\
				objectTag.setAttribute("frameborder", "0");\n\
				objectTag.scrolling = "no";\n\
				objectTag.src = src;\n\
			} else {\n\
				objectTag = document.createElement("object");\n\
				objectTag.type = mime;\n\
				if (jQuery.browser.msie) objectTag.innerHTML = \'<param name="wmode" value="transparent"/>\';\n\
				objectTag.data = src;\n\
			}\n\
			if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) objectTag.style.display = "inline";\n\
\n\
			if (rotation && !jQuery.support.transform)\n\
				objectTag.addEventListener("load", function(evt) {\n\
					this.removeEventListener(evt.type, arguments.callee, evt.bubbles);\n\
					if (SVG.isSVGObject(objectTag)) {\n\
						var l1 = new SVG(Navigator.getRelevantSVGNode(objectTag));\n\
						if (!l1[0]) alert("debug!");debugger;\n\
						l1.insertBefore("rotate",\n\
							l1[0].transform.baseVal.numberOfItems - 1,\n\
							rotation * 90, l1.doc.width.baseVal.value / 2, l1.doc.height.baseVal.value / 2);\n\
					} else alert("debug!");debugger;\n\
				}, false);\n\
				/*0,  // TAG:SVGloaded-waitamount - for Firefox 3.1 or earlier and Opera raise this value, if the left handle points to the right (this is the amount of milliseconds to wait until the SVG content finished loading)\n\
				objectTag, rotation * 90);*/\n\
\n\
			if (!GlobalSettings.scroll.horizontalMouseWheelPresent || objectTag.tagName.toLowerCase() == "iframe") {\n\
				var img = this.img[0];\n\
				objectTag.addEventListener("load", function(evt) {\n\
					this.removeEventListener(evt.type, arguments.callee, evt.bubbles);\n\
					objectTag.contentDocument.addEventListener(jQuery.browser.mozilla ? "DOMMouseScroll" : "mousewheel",\n\
						function(evt) {\n\
							handleScrolling(evt, img.parentNode);\n\
						}, false);\n\
				}, false);\n\
			}\n\
		}\n\
		if (className) objectTag.className = className;\n\
		return objectTag;\n\
	},\n\
\n\
	/**\n\
	  Adapts all handles to the current image dimensions.\n\
	  @return <code>this</code>\n\
	  @type Navigator\n\
	  @member Navigator\n\
	*/\n\
	resize: function() {\n\
		var img = this.img[0],\n\
			parent = img.parentNode,\n\
			handleContraintsRatio = 1,\n\
			style = {}, r = {},\n\
\n\
			// retrieve the image viewport dimension and offset (we don\'t want the handles to scroll out of view)\n\
			v = {\n\
				width:  Math.min(img.width, parent.clientWidth),\n\
				height: Math.min(img.height, parent.clientHeight),\n\
				offset: this.img.offset(img.offsetParent)\n\
			};\n\
\n\
		var handles = $(Navigator.classNames.handle.css, parent.parentNode);\n\
		for (var or in this.container) {\n\
			var settings = GlobalSettings.handles[or];\n\
\n\
			// calculate and apply the absolute handle position and dimension\n\
			style.top    = v.offset.top + v.height * settings.offsetTop;\n\
			style.left   = v.offset.left + v.width * settings.offsetLeft + (or == "right");\n\
			style.height = v.height * settings.ratioVert;\n\
			style.width  = v.width * settings.ratioHoriz;\n\
			for (var key in style)\n\
				this.container[or].style[key] = style[key].px();\n\
\n\
			// look for the greatest scaling ratio that keeps all icons within the bounds of their handle\n\
			var handleUI = this.getHandleUIObjectGroup(or);\n\
			if (handleUI) for (var i=handleUI.length-1; i >= 0; i--) {\n\
				if (SVG.isSVGObject(handleUI[i])) {\n\
					r.width = handleUI[i].contentDocument.documentElement.width.baseVal.value;\n\
					r.height = handleUI[i].contentDocument.documentElement.height.baseVal.value;\n\
				} else {\n\
					alert("debug!");debugger;\n\
					$.extend(r, handleUI.eq(0).naturalDimensions());\n\
				}\n\
				if (settings.rotation.odd()) switchValues(r, "width", "height");\n\
				handleContraintsRatio = Math.min(handleContraintsRatio, style.width / r.width, style.height / r.height);\n\
			}\n\
		}\n\
\n\
		var changed = Math.deviation(handleContraintsRatio, this._currentScale.ratio) >= 0.01;\n\
		// we must rescale, if the required ratio is different from the current ratio\n\
		if (changed) {\n\
			if (!this._currentScale.transform) {\n\
				this._currentScale.transform = this.getHandleSVGObject().unshiftScale(handleContraintsRatio);\n\
			} else {\n\
				this.getHandleSVGObject().changeScale(0, handleContraintsRatio);\n\
			}\n\
		}\n\
\n\
		if (changed || jQuery.browser.opera) {\n\
			// the SVG ransformation does not affect <object>, <embed>, or <img> tags; recalculate their dimensions\n\
			r.width = {};\n\
			r.height = {};\n\
			var handleUI = this.getHandleUIObjectGroups();\n\
			for (var or in handleUI) {\n\
				for (var i=handleUI[or].length-1; i >= 0; i--) {\n\
					if (SVG.isSVGObject(handleUI[or][i])) {\n\
						parseCSSLength(r.width, handleUI[or][i].contentDocument.documentElement.width.baseVal);\n\
						parseCSSLength(r.height, handleUI[or][i].contentDocument.documentElement.height.baseVal);\n\
					} else {\n\
						alert("debug!");debugger;\n\
						var natDim = handleUI[or].eq(0).naturalDimensions();\n\
						parseCSSLength(r.width, natDim.width);\n\
						parseCSSLength(r.height, natDim.height);\n\
					}\n\
					if (GlobalSettings.handles[or].rotation.odd()) switchValues(r, "width", "height");\n\
					handleUI[or][i].style.width = (r.width.value * handleContraintsRatio).toUnit(r.width.unit || "px");\n\
					handleUI[or][i].style.height = (r.height.value * handleContraintsRatio).toUnit(r.height.unit || "px");\n\
\n\
					// Opera (10) does somehow not correctly understand \'width\' and \'height\'\n\
					if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) {\n\
						if (or.equals("left", "right", "center"))\n\
							handleUI[or][i].style.top = ((this.container[or].clientHeight - handleUI[or][i].clientHeight) / 2).px();\n\
						if (or.equals("top", "bottom", "center"))\n\
							handleUI[or][i].style.left = ((this.container[or].clientWidth - handleUI[or][i].clientWidth) / 2).px();\n\
					}\n\
				}\n\
			}\n\
			this._currentScale.ratio = handleContraintsRatio;\n\
		}\n\
\n\
		if (GlobalSettings.image.showDimensions) this.drawDimension();\n\
\n\
		return this;\n\
	}\n\
});\n\
\n\
Navigator.classNames = "jquery-ui-navigator";\n\
jQuery.extend(Navigator, {\n\
	/**\n\
	  The key used to store Navigator objects on DOM elements\n\
	*/\n\
	_dataKey: "plugin-navigator",\n\
\n\
	/**\n\
	  Names of methods that can be invoked through jQuery.fn.navigator\n\
	*/\n\
	_publicMethods: ["add", "resize", "bind"],\n\
\n\
	/**\n\
	  Stores all Navigator objects in the current context.\n\
	*/\n\
	navigators: new Array(),\n\
\n\
	/**\n\
	  Commonly supported MIME types for <img> tags\n\
	*/\n\
	imageMimeTypes: ["jpeg", "gif", "png", "bmp", "x-ms-bmp"],\n\
\n\
	/**\n\
	  Common mouse-over event handler for navigation handles. It makes them fade\n\
	  in and fade out after some time.\n\
	  @member Navigator\n\
	  @private\n\
	*/\n\
	_onmouseover: function() {\n\
		this.firstChild.style.visibility = "visible";\n\
		var o = $(this).stop().fadeTo(jQuery.fx.speeds._default * GlobalSettings.handleSettings.speedfactor, GlobalSettings.handleSettings.opacity);\n\
\n\
		if (GlobalSettings.handleSettings.hideAfter > 0) {\n\
			setTimeout(\n\
				function(o, Navigator) { Navigator._onmouseout.call(o); },\n\
				GlobalSettings.handleSettings.hideAfter,\n\
				o, Navigator);\n\
		}\n\
	},\n\
\n\
	/**\n\
	  Common mouse-out event handler for navigations handles. It makes them fade\n\
	  out.\n\
	  @member Navigator\n\
	  @private\n\
	*/\n\
	_onmouseout: function() {\n\
		$(this).stop().fadeTo(jQuery.fx.speeds.slow * GlobalSettings.handleSettings.speedfactor, 0,\n\
			function() { this.firstChild.style.visibility = ""; });\n\
	},\n\
\n\
	/**\n\
	  Redirects the browser to the link target of the event target. It prevents\n\
	  the default behaviour.\n\
	  @param [evt] Then event object\n\
	  @return <code>false</code>\n\
	  @type Boolean\n\
	  @member Navigator\n\
	  @private\n\
	*/\n\
	_redirect: function(evt) {\n\
		if (GlobalSettings.debug) {\n\
			alert(this.href);\n\
		} else {\n\
			window.location.href = this.href;\n\
		}\n\
		if (evt) evt.preventDefault();\n\
		return false;\n\
	},\n\
\n\
	/**\n\
	  Forwards an event of an enclosed document to its enclosing node in the\n\
	  parent document.\n\
	  @param evt Then event object to forward\n\
	  @return The forwarded event object\n\
	  @member Navigator\n\
	*/\n\
	forwardEvent: function(evt) {\n\
		var handles = $(Navigator.classNames.handle.css);\n\
		for (var i=handles.length-1; i >= 0; i--) {\n\
			var children = handles[i].firstChild.childNodes;\n\
			for (var j=children.length-1; j >= 0; j--) {\n\
				if (children[j].contentDocument === evt.target.ownerDocument) {\n\
					var myevent;\n\
					if (evt.type.contains("mouse", "click")) {\n\
						myevent = document.createEvent("MouseEvent");\n\
						myevent.initMouseEvent(evt.type, evt.bubbles, evt.cancelable, window,\n\
							evt.detail, evt.screenX, evt.screenY, evt.clientX, evt.clientY,\n\
							evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, evt.button, evt.relatedTarget);\n\
					} else {\n\
						myevent = document.createEvent("Event");\n\
						myevent.initEvent(evt.type, evt.bubbles, evt.cancelable);\n\
					}\n\
					myevent = children[j].dispatchEvent(myevent);\n\
					if (!myevent) evt.preventDefault();\n\
					return myevent;\n\
				}\n\
			}\n\
		}\n\
	},\n\
\n\
	/**\n\
	  @return The first SVG group node for a navigation handler.\n\
	  @type Node\n\
	  @param {Node} obj The node containing the SVG document\n\
	  @member Navigator\n\
	*/\n\
	getRelevantSVGNode: function(obj) {\n\
		// look up the first SVG group node (assumingly this is layer 1)\n\
		return obj.contentDocument.evaluate(\n\
				"//svg:g",\n\
				obj.contentDocument,\n\
				SVG.lookupNamespaceURIDefault,\n\
				XPathResult.FIRST_ORDERED_NODE_TYPE,\n\
				null\n\
			).singleNodeValue;\n\
	},\n\
\n\
	/**\n\
	  The class names used to identify various navigator elements\n\
	  @type Object\n\
	  @member Navigator\n\
	*/\n\
	classNames: {\n\
		root: Navigator.classNames,\n\
		handle: Navigator.classNames + "-handle"\n\
	}\n\
});\n\
(function() {\n\
	for (var key in Navigator.classNames) {\n\
		Navigator.classNames[key] = {\n\
			0: Navigator.classNames[key],\n\
			css: "." + Navigator.classNames[key],\n\
			prefix: Navigator.classNames[key] + "-"\n\
		};\n\
	}\n\
\n\
	// CSS rules used by navigators\n\
	addStyle(\n\
		Navigator.classNames.handle.css+" { display: table; position: absolute; cursor: pointer; opacity: " + ((GlobalSettings.debug < 2) ? 0 : 0.5) +  "; }",\n\
		Navigator.classNames.handle.css+" > * { display: table-cell; visibility: " + ((GlobalSettings.debug < 2) ? "hidden" : "visible") + "; }",\n\
		Navigator.classNames.handle.css+" > * > * { overflow: hidden; display: none; max-width: 100%; max-height: 100%; }",\n\
\n\
		Navigator.classNames.handle.css+"-right > * { vertical-align: middle; text-align: right; }",\n\
		Navigator.classNames.handle.css+"-left > * { vertical-align: middle; text-align: left; }",\n\
		Navigator.classNames.handle.css+"-top > * { vertical-align: top; text-align: center; }",\n\
		Navigator.classNames.handle.css+"-bottom > * { vertical-align: bottom; text-align: center; }",\n\
		Navigator.classNames.handle.css+"-center > * { vertical-align: middle; text-align: center; }",\n\
\n\
		".image-dimension, .image-dimension-background { position: absolute; top: 1em; right: 1em; text-align: right; padding: 0.2em 0.3em; font-size: 85%; }",\n\
		".image-dimension { color: #FF942B; }",\n\
		".image-dimension-background { color: #222; background-color: #222; opacity: 0.5; border-radius: 0.25em; -moz-border-radius: 0.25em; -webkit-border-radius: 0.25em; -khtml-border-radius: 0.25em; -o-border-radius: 0.25em; }"\n\
	);\n\
\n\
	if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) {\n\
		addStyle(\n\
			Navigator.classNames.handle.css+" > * { position: relative; }",\n\
			Navigator.classNames.handle.css+" > * > * { position: absolute; }",\n\
			Navigator.classNames.handle.css+"-right > * > * { right: 0; }",\n\
			Navigator.classNames.handle.css+"-left > * > * { left: 0; }",\n\
			Navigator.classNames.handle.css+"-top > * > * { top: 0; }",\n\
			Navigator.classNames.handle.css+"-bottom > * > * { bottom: 0; }"\n\
		);\n\
	}\n\
\n\
	// CSS rules for rotated handle icons\n\
	var s = Navigator.classNames.handle.css+" .all";\n\
	for (var or in GlobalSettings.handles) with (GlobalSettings.handles[or]) {\n\
		if (rotation) {\n\
			var deg = (rotation * 90).deg();\n\
			addStyle(\n\
Navigator.classNames.handle.css + "-" + or + " > * > * {\\n\\\n\
	transform: rotate("+deg+");\\n\\\n\
	-moz-transform: rotate("+deg+");\\n\\\n\
	-webkit-transform: rotate("+deg+");\\n\\\n\
	-khtml-transform: rotate("+deg+");\\n\\\n\
	-o-transform: rotate("+deg+");\\n\\\n\
	filter: progid:DXImageTransform.Microsoft.BasicImage(rotation="+rotation+");\\n\\\n\
}");\n\
		}\n\
\n\
		// CSS rules for handle with multiple icons\n\
		if (typeof object.src == "object") {\n\
			for (var key in object.src)\n\
				 s += ",\\n" + Navigator.classNames.root.css + "." + key + " > ." + Navigator.classNames.handle.prefix + or + " ." + key;\n\
		}\n\
	}\n\
	s += "\\n\\t{ display: inline; }";\n\
	addStyle(s);\n\
})();\n\
\n\
\n\
\n\
/**\n\
  <p>Polls the image object until its dimensions are known. Then calculates the\n\
  available space and stores the corresponding cycle class names to the future\n\
  navigator root element.</p>\n\
  <p>Additionally it registers an event handler for window resizing that invokes\n\
  {@link resizeImage}.</p>\n\
  @param evt Indicates to the function, that it is used as an event handler\n\
    (i. e. when polling ready state changes or resizing). <em>You should set\n\
    this to <code>null</code>!</em>\n\
  @param {Node|jQuery} [img] The image node to put nagivators on. <em>You must\n\
    set this, when\n\
  @param {Number} [timeout] The next timeout interval length (if any)\n\
*/\n\
function adjustImage(evt, img, timeout) {\n\
	if (!img || img instanceof jQuery && !img.length) return false;\n\
	img = $(img);\n\
	var natDim = img.naturalDimensions();\n\
\n\
	// check if we have the dimensions\n\
	if (natDim.width) {\n\
		var navigator_options = {\n\
			right: document.getElementById("nextBar").href,\n\
			left: document.getElementById("prevBar").href,\n\
		};\n\
\n\
		if (natDim.width >= 100 && natDim.height >= 100)\n\
			addStyle("#prevBar, #nextBar { display: none; }");\n\
\n\
		if (natDim.width > img[0].parentNode.clientWidth * GlobalSettings.image.maxWidthRatio)\n\
			$(img[0].parentNode.parentNode).addClass("big");\n\
		img.maxDimWorkaround();\n\
\n\
		if (natDim.width > img[0].parentNode.clientWidth * GlobalSettings.image.maxWidthRatio || natDim.height > img.getMaxHeight().toFloat()) {\n\
			// the image is larger than the default scaled size\n\
			navigator_options.center = resizeImage;\n\
\n\
			// choose the display modes (as style class names)\n\
			if (img[0].parentNode.clientWidth < natDim.width) {\n\
				img[0].parentNode.parentNode.cycleClasses = GlobalSettings.image.classes.fit;\n\
			} else {\n\
				img[0].parentNode.parentNode.cycleClasses = GlobalSettings.image.classes.noFit;\n\
				// rearrange the center handle icon order\n\
				GlobalSettings.handles.center.object.src.scaled = GlobalSettings.handles.center.object.src["fit-width"];\n\
				delete GlobalSettings.handles.center.object.src["fit-width"];\n\
			}\n\
\n\
			arguments.callee.registerResizeHandler(img);\n\
		} else {\n\
			arguments.callee.registerResizeHandler(img);\n\
		}\n\
\n\
		// make image background white (for transparent images)\n\
		if (!img[0].complete && evt == "timeout") {\n\
			img.load(function() { img.addClass("loaded"); });\n\
		} else {\n\
			img.addClass("loaded");\n\
		}\n\
\n\
		img.navigator("add", navigator_options);\n\
\n\
	} else if (evt == "timeout") {\n\
		// increase (or set) the new polling interval\n\
		timeout = defaultMin(\n\
			timeout * GlobalSettings.image.polling.increaseFactor,\n\
			GlobalSettings.image.polling.minInterval);\n\
\n\
		if (timeout <= GlobalSettings.image.polling.maxInterval) {\n\
			// set next poll\n\
			window.setTimeout(adjustImage, timeout.floor(), evt, img, timeout);\n\
		} else {\n\
			/*\n\
			  As the ultimate solution after exceeding the maximum polling intervall,\n\
			  set a "load" event handler. We don\'t want to restart polling afterwards\n\
			  (therefore the above check for \'if (evt == "timeout")\').\n\
			*/\n\
			img.load(function(evt) {\n\
				adjustImage(evt, img);\n\
				img.navigator("resize");\n\
			});\n\
		}\n\
	}\n\
}\n\
\n\
adjustImage.registerResizeHandler = function(img) {\n\
	window.addEventListener("resize",\n\
		function(evt) {\n\
			changeCSSRulesOnResize(img);\n\
			adjustImage(evt);\n\
		},\n\
		false);\n\
};\n\
\n\
function changeCSSRulesOnResize(img) {\n\
	var oldMaxHeight = img[0].navigatorMaxHeight,\n\
		newMaxHeightPx = img.getMaxHeight();\n\
	if (Math.deviation(oldMaxHeight, img[0].navigatorMaxHeight) >= 0.01)\n\
		changeCSSRule(\n\
			addStyle.css.parentNode.sheet,\n\
			Navigator.classNames.root.css+".scaled #"+img[0].id,\n\
			"max-height", newMaxHeightPx);\n\
}\n\
\n\
/**\n\
  Prepares the image for the use with navigators. That means, to unregister\n\
  existing events, add a few CSS rules and check the image dimensions.\n\
*/\n\
function prepareImage() {\n\
	var img = document.getElementById("image");\n\
	if (img) {\n\
		// we need both methods for cross browser compatibility\n\
		img.onclick = undefined;\n\
		img.removeAttribute("onclick");\n\
\n\
		var img_id = "#" + img.id,\n\
			imgC_id = "#" + img.parentNode.id;\n\
		img = $(img);\n\
\n\
		addStyle(\n\
			imgC_id+" { margin: 1em 0 !important; text-align: center; }",\n\
			Navigator.classNames.root.css+" iframe { border: 0; }",\n\
			Navigator.classNames.root.css+".scaled "+img_id+" { max-height: " + img.getMaxHeight() + "; max-width: " + GlobalSettings.image.maxWidthRatio.percent() + "; }",\n\
			Navigator.classNames.root.css+".fit-width.big "+imgC_id+" { margin-top: " + (img[0].parentNode.parentNode.clientWidth * (1 - GlobalSettings.image.maxWidthRatio) / 2).px() + " !important; }",\n\
			Navigator.classNames.root.css+".fit-width "+img_id+" { max-height: none; max-width: " + GlobalSettings.image.maxWidthRatio.percent() + "; }",\n\
			Navigator.classNames.root.css+".full.big "+imgC_id+" { margin-top: 0 !important; }",// max-height: " + (window.innerHeight * 0.95).px() + "; }",\n\
			//Navigator.classNames.root.css+".full.big "+img_id+" { border: 0; }",\n\
			img_id+" { margin: 0 !important; display: inline !important; cursor: auto !important }",\n\
			img_id+".loaded { background-color: white; }"\n\
		);\n\
\n\
		img.removeClass(GlobalSettings.image.classes.fit.join(" "));\n\
		img[0].parentNode.addEventListener(jQuery.browser.mozilla ? "DOMMouseScroll" : "mousewheel", handleScrolling, false);\n\
		$(img[0].parentNode.parentNode).addClass(GlobalSettings.image.classes["default"]);\n\
		adjustImage("timeout", img);\n\
	}\n\
}\n\
\n\
/**\n\
  Handles a resize event. That can either be a window resizing or a click on the\n\
  center navigator handle.\n\
  @param evt The event object\n\
*/\n\
function resizeImage(evt) {\n\
	if (evt.currentTarget === window && evt.type == "resize") {\n\
		// window resizing: resize all navigators\n\
		for (var i=Navigator.navigators.length-1; i >= 0; i--) {\n\
			var nav = Navigator.navigators[i];\n\
			nav.root[(nav.img[0].naturalWidth > nav.img[0].parentNode.clientWidth * GlobalSettings.image.maxWidthRatio) ? "addClass" : "removeClass"]("big");\n\
			nav.img.maxDimWorkaround();\n\
			nav.resize();\n\
		}\n\
\n\
		/*if (Navigator.navigators.length === 1) with (Navigator.navigators[0]) {\n\
			if (img[0].height > img[0].parentNode.clientHeight || img[0].width > img[0].parentNode.clientWidth)\n\
				img[0].parentNode.focus();\n\
			window.scroll(0, img[0].parentNode.parentNode.previousSibling.offsetTop);\n\
		}*/\n\
\n\
	} else {\n\
		// click on center handle: cycle Navigator root element classes and resize navigators\n\
		var nav = $(evt.currentTarget).navigator(),\n\
			img = nav.img;\n\
		nav.root.cycleClass();\n\
		img.maxDimWorkaround();\n\
		nav.resize();\n\
\n\
		// additionally, scroll the image into the view and focus the image container for easier key-based scrolling\n\
		if (!nav.root.hasClass("scaled")) {\n\
			window.scroll(0, nav.root[0].previousSibling.previousSibling.offsetTop);\n\
			if (img[0].height > img[0].parentNode.clientHeight || img[0].width > img[0].parentNode.clientWidth)\n\
					img[0].parentNode.focus();\n\
		}\n\
	}\n\
}\n\
\n\
/**\n\
  Creates a <code>&lt;link&gt;</code> tag in the <code>&lt;head;</code> section\n\
  based on the given parameters.\n\
  @param {String} rel The link name (its <code>rel</code> or <code>rev</code>\n\
    attribute)\n\
  @param {String} href The link reference\n\
  @param {String} [title] The link title\n\
  @param {Boolean} [backward=false] Indicate a backward relation by using the\n\
    <code>rev</code> instead of the <code>rel</code> attribute.\n\
  @return The link node\n\
  @type Node\n\
*/\n\
function createLogicLink(rel, href, title, backward) {\n\
	var link = document.createElement("link");\n\
	link[backward ? "rev" : "rel"] = rel;\n\
	link.href = href;\n\
	if (title) link.title = title;\n\
	document.getElementsByTagName("head")[0].appendChild(link);\n\
	return link;\n\
}\n\
\n\
/**\n\
  Creates logical references and the corrensponding <code>&lt;link&gt;</code>\n\
  tags.\n\
  @param {Object} A set of pairs relating node IDs to link names; the logical\n\
    references are constructed based on these.\n\
*/\n\
function createLinks(links) {\n\
	for (var id in links) {\n\
		var a = document.getElementById(id);\n\
		a.rel = links[id];\n\
\n\
		var title;\n\
		if (a.title.toLowerCase().startsWith(links[id])) {\n\
			title = a.href.substring(a.href.lastIndexOf("/") + 1);\n\
		} else if (a.title) {\n\
			title = a.title;\n\
		} else {\n\
			title = $("*[title]:first", a)[0];\n\
			title = title ? title.title : null;\n\
		}\n\
\n\
		createLogicLink(links[id], a.href, title);\n\
	}\n\
}\n\
\n\
/**\n\
  A scrolling handler for horizontal scrolling when no 2nd mouse wheel is\n\
  present\n\
*/\n\
function handleScrolling(evt, target) {\n\
	if (evt.target.ownerDocument !== document || !GlobalSettings.scroll.horizontalMouseWheelPresent && evt.altKey && (evt.axis === undefined || evt.axis === evt.VERTICAL_AXIS))\n\
	{\n\
		var delta = evt.wheelDelta ? evt.wheelDelta / -120 : evt.detail.sign()\n\
		var horizontally = (evt.axis === undefined) ? evt.altKey :\n\
				GlobalSettings.scroll.horizontalMouseWheelPresent ?\n\
					evt.axis === evt.HORIZONAL_AXIS :\n\
					evt.altKey;\n\
\n\
		scrollSmoothly(\n\
			horizontally ?\n\
				target || ((evt.target.ownerDocument === document) ?\n\
					evt.currentTarget :\n\
					document.getElementById("imageContainer")) :\n\
				window,\n\
			GlobalSettings.scroll.length / GlobalSettings.scroll.count * delta,\n\
			GlobalSettings.scroll.count,\n\
			horizontally,\n\
			GlobalSettings.scroll.interval);\n\
		evt.preventDefault();\n\
	}\n\
}\n\
\n\
/**\n\
  Scrolls an object smoothly in multiple steps.\n\
  @param {Node} target The object to scroll\n\
  @param {Number} step The scroll step size in pixels\n\
  @param {Number} count The remaining scroll steps\n\
  @param {Boolean} horizontally Scroll horizontally instead of vertically?\n\
  @param {Number} interval The scroll step interval length in milliseconds\n\
*/\n\
function scrollSmoothly(target, step, count, horizontally, interval) {\n\
	if (count > 0) {\n\
		if (Function.isFunction(target.scrollBy)) {\n\
			if (horizontally) {\n\
				target.scrollBy(step, 0);\n\
			} else {\n\
				target.scrollBy(0, step);\n\
			}\n\
		} else {\n\
			target[horizontally ? "scrollLeft" : "scrollTop"] += step;\n\
		}\n\
		setTimeout(scrollSmoothly, interval, target, step, count - 1, horizontally, interval);\n\
	}\n\
}\n\
\n\
/**\n\
  Handles special keyboard shortcuts, i. e. submitting the comment form or\n\
  completing a user name.\n\
*/\n\
function CommentWindowsKeyPressHandlerFunction(evt) {\n\
	switch (evt.keyCode) {\n\
		case 13:  // DOM_VK_RETURN\n\
			if (evt.ctrlKey && this.value) {\n\
				evt.preventDefault();\n\
				SubmitCommentForm(this);\n\
				return false;\n\
			}\n\
			break;\n\
\n\
		case 9:  // DOM_VK_TAB\n\
			if (this.selectionStart > 0 && this.selectionStart === this.selectionEnd) {\n\
				evt.preventDefault();\n\
				CompleteUsername(this);\n\
				return false;\n\
			}\n\
			break;\n\
\n\
		default:\n\
			if (CompleteUsername.usernames) {\n\
				CompleteUsername.usernames.lastPrefix = null;\n\
			}\n\
	}\n\
}\n\
\n\
/**\n\
  Submits the comment form just after replacing some text patterns (if selected\n\
  in the options).\n\
  @param {Node} textarea The comment textarea node\n\
*/\n\
function SubmitCommentForm(textarea) {\n\
	if (GlobalSettings.behavior.comments.custom_replacements)\n\
		textarea.value = textarea.value\n\
			.replace(/\\.\\.\\.*/g, "\\u2026")\n\
			.replace(/\\s*---*\\s*/g, "\\u2013")\n\
			.replace(/(^|\\s)([:;8])([\\(\\)\\[\\]\\{\\}\\/\\\\\\|pPDoO])($|\\s)/g, "$1$2-$3$4");\n\
\n\
	if (textarea.form.elements.addComment != "hidden") {\n\
		var h = textarea.form.elements.addComment.cloneNode(true);\n\
		h.type = "hidden";\n\
		h.removeAttribute("class");\n\
		textarea.form.elements.addComment.name += "-button";\n\
		textarea.form.appendChild(h);\n\
	}\n\
	textarea.form.submit();\n\
}\n\
\n\
/**\n\
  Performs user name completion in a textarea.\n\
  @param {Node} textarea The textarea to work on\n\
*/\n\
function CompleteUsername(textarea) {\n\
	var u = arguments.callee.usernames;\n\
	if (!u) {\n\
		u = arguments.callee.usernames = {\n\
			//u: null,\n\
			map: new Object(),\n\
			lastPrefix: null,\n\
			//lastIndex: null,\n\
			//lastStart: null,\n\
			userHrefRegexp: /(?:^|\\/)user\\/[^\\/]+\\/?$/,\n\
			prefixRegexp: /@?([^\\s@]+)$/\n\
		};\n\
		u.u = $.map($(".userInfo .name a, .commentHead a"), function(a, i) {\n\
				if (u.userHrefRegexp.test(a.href)) {\n\
					var n = a.textContent.trim(),\n\
						l = n.toLowerCase();\n\
					u.map[l] = n;\n\
					return l;\n\
				}\n\
				return null;\n\
			})\n\
			.unique(String.compareIgnoreCase);\n\
	}\n\
\n\
	if (u.u.length) {\n\
		//alert("debug!");debugger;\n\
		if (!u.lastPrefix) {\n\
			u.lastPrefix = textarea.value.substring(0, textarea.selectionStart).match(u.prefixRegexp);\n\
			if (!u.lastPrefix) return;\n\
			u.lastPrefix = u.lastPrefix[1];\n\
			u.lastStart = textarea.selectionStart - u.lastPrefix.length;\n\
			u.lastIndex = -1;\n\
		}\n\
\n\
		if (u.lastIndex !== null) {\n\
			u.lastIndex = u.u.findPrefix(u.lastPrefix, u.lastIndex + 1, true, false);\n\
			if (u.lastIndex !== -1) {\n\
				var username = u.map[u.u[u.lastIndex]];\n\
				textarea.value = textarea.value.substring(0, u.lastStart)\n\
					+ username + textarea.value.substring(textarea.selectionStart);\n\
				textarea.selectionEnd = textarea.selectionStart = u.lastStart + username.length;\n\
				return username;\n\
			}\n\
			// else\n\
			u.lastIndex = null;\n\
		}\n\
	}\n\
}\n\
\n\
/**\n\
  Prefetches an image on lowbird.\n\
  @param {String} The ID of a link element prefixed by a hash, the URI of the\n\
    image page, or the image itself\n\
*/\n\
function prefetchImage(uri) {\n\
	if (uri.charCodeAt(0) === 0x23) { // 0x23 == "#"\n\
		uri = document.getElementById(uri.substring(1));\n\
		if (!(uri && uri.nodeName == "A")) return;\n\
		uri = uri.getAttribute("href");\n\
	}\n\
	if (uri.contains("/view/") && (!uri.contains("://") || uri.startsWith(location.protocol + "//" + location.host + "/"))) {\n\
		$.get(uri, arguments.callee.getImageByPage, "html");\n\
	} else if (uri.contains("/data/images/")) {\n\
		arguments.callee.getImageByUri(uri);\n\
	}\n\
}\n\
prefetchImage.getImageByUri = function(uri) {\n\
	var img = new Image();\n\
	img.src = uri;\n\
	return img;\n\
};\n\
prefetchImage.getImageByPage = function(page, status) {\n\
	if (page) {\n\
		var doc = $(page)[0].ownerDocument;\n\
		if (doc) {\n\
			var img = doc.getElementById("image");\n\
			if (img)\n\
				return prefetchImage.getImageByUri(img.src);\n\
		}\n\
	}\n\
};\n\
\n\
\n\
changeCSSRule("html", "height", null);\n\
\n\
(function(font) {\n\
	if (font) {\n\
		if (font === true)\n\
			font = "sans-serif";\n\
\n\
		addStyle(\n\
			\'body, textarea, input { font-family: \'+font+\'; }\',\n\
			"#imageInfo { line-height: 140%; }",\n\
			"input.button { border-color: #666; }",\n\
			".comment { overflow: auto; }"\n\
		);\n\
	}\n\
})(GlobalSettings.page.style.changeFont);\n\
\n\
/*\n\
  The following anonymous function unleashes the action of this script upon loading.\n\
*/\n\
$(function() {\n\
	// (re)move a few page elements based on global settings\n\
	if (GlobalSettings.page.teaser == "hide") {\n\
		$(".teaser:first").remove();\n\
	} else if (GlobalSettings.page.teaser == "move end") {\n\
		$(".teaser:first")\n\
			.find("script").remove().end()\n\
			.insertAfter(".comments:first").css("margin-top", "3em");\n\
	}\n\
	if (GlobalSettings.page.navigation == "hide")\n\
		$(".center:first").remove();\n\
\n\
	// create logical links (even though unfortunately no major browser uses them by default)\n\
	createLinks({\n\
		prevBar: "prev",\n\
		nextBar: "next",\n\
		home: "start"\n\
	});\n\
\n\
	// start creating navigators\n\
	prepareImage();\n\
\n\
	with ($("form.addComment:first")[0]) {\n\
		if (!id) {\n\
			id = "addCommentForm";\n\
		} else {\n\
			alert("debug!");debugger;\n\
			if (globalSettings.debug) alert("The commentary form already has the ID \\"" + id + "\\".");\n\
		}\n\
	}\n\
	document.forms.addCommentForm.elements.content.addEventListener("keydown", CommentWindowsKeyPressHandlerFunction, false);\n\
\n\
	// replace the default tag submit behaviour because it doesn\'t clear the new tag field afterwards\n\
	GlobalSettings.image.id = new XPathSearch().evaluate("@onsubmit", document.forms.addTag, XPathResult.STRING_TYPE).result.stringValue.match(/\\d{3,}/)[0].toInt();\n\
	document.forms.addTag.onsubmit = undefined;\n\
	document.forms.addTag.removeAttribute("onsubmit");\n\
	document.forms.addTag.elements.save.onclick = undefined;\n\
	document.forms.addTag.elements.save.removeAttribute("onclick");\n\
	document.forms.addTag.elements.save.type = "submit";\n\
	document.forms.addTag.addEventListener("submit", function(evt) {\n\
		addTags(GlobalSettings.image.id, this.elements.tagText);\n\
		this.elements.tagText.value = "";\n\
		evt.preventDefault();\n\
	}, false);\n\
\n\
	// prefetch images\n\
	if (GlobalSettings.prefetch.previousImage) prefetchImage("#prevBar");\n\
	if (GlobalSettings.prefetch.nextImage) prefetchImage("#nextBar");\n\
});\n\
\n\
}\n\
\n\
\n\
/**\n\
  Binds a javascript node with a remote source into the page header.\n\
  @param {String} src The URI of the script\n\
  @param {String} [data] If this argument is a string, the script content is\n\
    set to the string instead of loading it from <code>src</code>.\n\
  @param {Function} [callback] The callback for when the script is loaded or\n\
    <code>condition</code> is <code>false</code>.\n\
  @param {Boolean} [condition] Must be <code>true</code> to load the script;\n\
    otherwise only the callback is invoked.\n\
  @return The script node (if any)\n\
*/\n\
function load_script(src, data, callback, condition) {\n\
	if (typeof data == "function") {\n\
		condition = callback;\n\
		callback = data;\n\
		data = null;\n\
	}\n\
\n\
	if (condition) {\n\
		var script = document.createElement("script");\n\
		script.type = "text/javascript";\n\
		if (typeof data == "string") {\n\
			script.textContent = data;\n\
			if (typeof callback == "function")\n\
				callback(true);\n\
		} else {\n\
			if (typeof callback == "function")\n\
				script.addEventListener("load", callback, false);\n\
			script.src = src;\n\
		}\n\
		document.documentElement.firstChild.appendChild(script);\n\
		return script;\n\
	} else if (typeof callback == "function") {\n\
		callback(false);\n\
	}\n\
}\n\
\n\
\n\
load_script(\n\
	(window.location.protocol == "file:") ? "jquery.js" : "http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js",\n\
	function() {\n\
		jQuery.noConflict();\n\
		run(jQuery);\n\
	},\n\
	!window.jQuery);\n\
\n\
})();\n\
';
document.documentElement.firstChild.appendChild(script);
