/** @fileoverview
  <h2>Lowbird Image Navigator</h2>

  <p>This script is supposed to &quot;enhance&quot; image browsing on
  <a href="http://www.lowbird.com">lowbird.com</a>.</p>

  <p>It replaces the blue navigation bars at each side of the page with
  semi-transparent navigation handles placed in front of the image. These
  handles only appear with a fade effect when hovered.</p>
  <p>Furthermore it introduces a new image display size mode that fits the image
  horizontally into the browser window&mdash;but only for sufficently large
  images. Plus, it hides ads and changes the font to to the default sans-serif,
  if configured to do so.</p>

  <p><em>System requirements:</em> this works only in Firefox 3+ so far. WebKit
  (Konqueror and Safari) and Chrome/Chromium should work as well, but I didn't
  test it. Opera 10 is all bitchy about the
  <code style="white-space: nowrap;">max-height</code> CSS property, so it
  doesn't work there and probably won't until the vendor fixes that; and of
  course neither does Internet Explorer 'cause no SVG support (although a plugin
  from Adobe may provide that support).</p>


  <p>created by
  <a href="http://www.lowbird.com/board/member.php?u=1158)">dekaden|Z</a><br>
  Please contact me for bugs, suggestions and general feedback! <tt>:-&gt;</tt>
  </p>
*/


(function() {

/**
  You can adjust these factors to fit the maximum ratio of the image to its
  container (the space between the blue sidebars for the width and between the
  header and the navigation (&quot;prev home next&quot;) for the height.
*/
var GlobalSettings = {
	/**
	  Options for moving/hiding &quot;useless&quot; page elements (notably
	  advertisement)
	*/
	page: {
		/**
		  <ul>
		    <li><code>&quot;hide&quot;</code> removes the ad teaser.</li>
		    <li><code>&quot;move end&quot;</code> moves the ad teaser behind the
		      comments.</li>
		    <li>Any other value does nothing.</li>
		  </ul>
		*/
		teaser: null,

		/**
		  <ul>
		    <li><code>&quot;hide<code>&quot; removes the navgation right below
		      the image.</li>
		    <li>Any other value does nothing.</li>
		  </ul>
		*/
		navigation: "hide",

		style: {
			/**
			  Changes the default font font family and a few other things.
			  <ul>
			    <li><code>true</code> sets the font family to sans-serif.</li>
			    <li><code>false</code> prevents these changes completely.</li>
			    <li><code>[any string]</code> sets the font family to that
			      string. Please use valid CSS notation and enclose font names
			      with spaces in single or double quotation marks.</li>
			    <li>Any other value results to undefined behaviour.</li>
			  </ul>
			*/
			changeFont: true
		}
	},

	/**
	  Options for the image dimensions and the CSS classes to use
	*/
	image: {
		/**
		  The maximum width as ratio of the totally available space
		  (depends on the width of the parent element)
		*/
		maxWidthRatio: 0.99,

		/**
		  The maximum height as ratio of the window height
		*/
		maxHeightRatio: 0.8,

		/**
		  The minimum height in pixels
		*/
		minHeightAbs: 600,

		/**
		  The classes we use for the different display modes
		*/
		classes: {
			/**
			  The image does not fit the default dimensions
			*/
			fit: ["scaled", "fit-width", "full"],

			/**
			  The image fits the default dimensions
			*/
			noFit: ["scaled", "full"],

			/**
			  The class to use as default (when the page is displayed first)
			*/
			"default": "scaled"
		},

		/**
		  <p><strong>DO NOT TOUCH THESE !!!</strong></p>

		  <p>These values control the polling intervals when we need to wait for
		  the image to load the part containing its dimensions.</p>
		*/
		polling: {
			maxInterval: 10000,  // in milliseconds
			minInterval: 50,
			increaseFactor: 1.25
		},

		/**
		  If true, displays a little box in the top right-hand corner with the
		  natural and the current image dimensions.
		*/
		showDimensions: true
	},

	/**
	  Settings for the control icons placed in front of the image and their
	  sensitive areas
	*/
	handles: {
		right: {
			/**
			  The horizontal ratio of the icon (depending on the image dimensions)
			*/
			ratioHoriz: 1/5,

			/**
			  The vertical ratio of the icon (depending on the image dimensions)
			*/
			ratioVert: 1,

			/**
			  The relative offset from the image top
			*/
			offsetTop: 0,

			/**
			  The realtive offset from the left side of the image
			*/
			offsetLeft: 4/5,

			object: {
				/**
				  The source of the image data of the icon
				*/
				src: "graphics/right.svg",

				/**
				  The MIME type of the source of the icon image data
				*/
				mime: "image/svg+xml"
			},

			/**
			  Rotate the icon by the value set below times 90°
			*/
			rotation: 0
		},
		left: {
			ratioHoriz: 1/5,
			ratioVert: 1,
			offsetTop: 0,
			offsetLeft: 0,
			object: { src: "graphics/right.svg", mime: "image/svg+xml" },
			rotation: 2
		},
		top: {
			ratioHoriz: 1,
			ratioVert: 1/4,
			offsetTop: 0,
			offsetLeft: 0,
			object: { src: "graphics/right.svg", mime: "image/svg+xml" },
			rotation: 1
		},
		bottom: {
			ratioHoriz: 1,
			ratioVert: 1/4,
			offsetTop: 3/4,
			offsetLeft: 0,
			object: { src: "graphics/right.svg", mime: "image/svg+xml" },
			rotation: 3
		},
		center: {
			ratioHoriz: 2/5,
			ratioVert: 2/4,
			offsetTop: 1/4,
			offsetLeft: 1.5/5,
			object: {
				/**
				  Each key defines the icon data for a specific display class
				*/
				src: {
					scaled: "graphics/scale-fit.svg",
					"fit-width": "graphics/scale-full.svg",
					full: "graphics/scale-small.svg"
				},
				mime: "image/svg+xml"
			},
			rotation: 0
		}
	},

	/**
	  A few common settings for all handles
	*/
	handleSettings: {
		/**
		  The handle opacity
		*/
		opacity: 0.5,

		/**
		  A factor for icon fading delays. 0 means no fading.
		*/
		speedfactor: 1,

		/**
		  Handles disappear after the indicated delay (in milliseconds).
		  0 means no disappearing.
		*/
		hideAfter: 1000
	},

	/**
	  Image scrolling options (with mouse wheel)
	*/
	scroll: {
		/**
		  The scroll amount factor (in pixels)
		*/
		length: 200,

		/**
		  For smooth scrolling, set the number of scrolling steps.
		  Set to 1 to disable smooth scrolling.
		*/
		count: 10,

		/**
		  The interval in milliseconds between two smooth scrolling steps
		*/
		interval: 10,

		/**
		  Set to <code>true</code> if you have a working horizontal scrolling
		  device (i. e. a 2nd mouse wheel or a touch pad). If you don't, set to
		  <code>false</code> and press the ALT key during scrolling to scroll
		  horizontally.
		*/
		horizontalMouseWheelPresent: true
	},

	prefetch: {
		/**
		  Prefetch next image.
		*/
		nextImage: true,

		/**
		  Prefetch previous image.
		*/
		previousImage: true
	},

	behavior: {
		comments: {
			custom_replacements: true // @sed custom_replacements: false
		}
	},

	/**
	  Defines the debug level. 0 means no debugging.
	*/
	debug: Number(window.location.protocol == "file:") // @sed debug: 0
};

with (GlobalSettings) {
	if (debug && image.minHeightAbs > 400) image.minHeightAbs = 400;


// Replace icon file references with base64 encoded data
if (!debug) (function() {
	var map = {
		"graphics/right.svg": "\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMDAiIGlkPSJoYW5k\
bGUiPjxkZWZzIGlkPSJkZWZzNCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTg1Mi4zNjIxOCki\
IGlkPSJsYXllcjEiPjxwYXRoIGQ9Im0gMjAsODUyLjM2MjE2IGMgLTExLjA4LDAgLTIwLDguOTIgLTIw\
LDIwIGwgMCwxNjAuMDAwMDQgYyAwLDExLjA4IDguOTIsMjAgMjAsMjAgbCAxMDIuMDYyNSwwIDcuOTM3\
NSwwIDIwLDAgMCwtMjAgMCwtMTYwLjAwMDA0IDAsLTIwIC0yMCwwIC03LjkzNzUsMCAtMTAyLjA2MjUs\
MCB6IiBpZD0iYmdyZWN0IiBzdHlsZT0iZmlsbDojMDAwMDAwIi8+PHBhdGggZD0ibSA0MS4zOTc0NDYs\
MTEuOTA2NjA4IC0xOC4xODgwMjMsMTAuNTAwODU5IC0xOC4xODgwMjE2LDEwLjUwMDg2IDAsLTIxLjAw\
MTcyIDAsLTIxLjAwMTcxODMgMTguMTg4MDIyNiwxMC41MDA4NTk3IHoiIHRyYW5zZm9ybT0ibWF0cml4\
KDEuOTMwODA3MywwLDAsMy4xMTg1OTAyLDM3LjczNzkzOSw5MTUuMjMwMzQpIiBpZD0iYXJyb3ciIHN0\
eWxlPSJmaWxsOiNmZmZmZmY7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjIuMDM3NjExNDg7c3Ry\
b2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLW9wYWNpdHk6MTtzdHJv\
a2UtZGFzaGFycmF5Om5vbmUiLz48L2c+PC9zdmc+",

		"graphics/scale-small.svg": "\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGlkPSJzdmcz\
NTg5Ij48ZGVmcyBpZD0iZGVmczM1OTEiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NTIuMzYy\
MTgpIiBpZD0ibGF5ZXIxIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjM1LjQzMzA3\
MSIgcnk9IjM1LjQzMzA3MSIgeD0iMCIgeT0iMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCw4NTIuMzYy\
MTgpIiBpZD0icmVjdDQxMTciIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tl\
Om5vbmUiLz48cmVjdCB3aWR0aD0iOTUuOTA5NzQ0IiBoZWlnaHQ9IjQ5LjQ2NzU3NSIgeD0iNTIuMDQ1\
MTI4IiB5PSI5MjcuNjI4MzYiIGlkPSJyZWN0NDExOSIgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2Zm\
ZmZmZjtzdHJva2Utd2lkdGg6Mi43ODQxNDEwNjtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5l\
am9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1vcGFjaXR5OjE7c3Ryb2tlLWRhc2hh\
cnJheTpub25lIi8+PHBhdGggZD0ibSAxMDUuMTIzMiw5OS41NDcwODEgLTU2LjM3MzE5OSwwIC01Ni4z\
NzMxOTkxLDAgTCAyMC41NjM0MDEsNTAuNzI2NDYgNDguNzUsMS45MDU4MzggNzYuOTM2NTk5LDUwLjcy\
NjQ1OSAxMDUuMTIzMiw5OS41NDcwODEgeiIgdHJhbnNmb3JtPSJtYXRyaXgoMCwwLjk0OTA4ODU0LDAu\
MjAwNjY1NzYsMCwxNTQuNTE2MDgsOTA2LjA5NDEyKSIgaWQ9InBhdGg0NTU5LTgiIHN0eWxlPSJmaWxs\
OiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOm5vbmUiLz48cGF0\
aCBkPSJtIDEwNS4xMjMyLDk5LjU0NzA4MSAtNTYuMzczMTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2\
MzQwMSw1MC43MjY0NiA0OC43NSwxLjkwNTgzOCA3Ni45MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5\
LjU0NzA4MSB6IiB0cmFuc2Zvcm09Im1hdHJpeCgwLjk2NjY4ODE1LDAsMCwwLjIxMzUwODM3LDUyLjI4\
OTYzNCw5ODUuMjc2MDgpIiBpZD0icGF0aDQ1NTktNCIgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9w\
YWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZSIvPjxwYXRoIGQ9Im0gMTA1LjEyMzIs\
OTkuNTQ3MDgxIC01Ni4zNzMxOTksMCAtNTYuMzczMTk5MSwwIEwgMjAuNTYzNDAxLDUwLjcyNjQ2IDQ4\
Ljc1LDEuOTA1ODM4IDc2LjkzNjU5OSw1MC43MjY0NTkgMTA1LjEyMzIsOTkuNTQ3MDgxIHoiIHRyYW5z\
Zm9ybT0ibWF0cml4KDAuOTY2Njg4MTUsMCwwLC0wLjIxMzUwODM3LDUyLjg3Mzk1LDkxOS40NDgzMyki\
IGlkPSJwYXRoNDU1OSIgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6\
ZXZlbm9kZDtzdHJva2U6bm9uZSIvPjxwYXRoIGQ9Im0gMTA1LjEyMzIsOTkuNTQ3MDgxIC01Ni4zNzMx\
OTksMCAtNTYuMzczMTk5MSwwIEwgMjAuNTYzNDAxLDUwLjcyNjQ2IDQ4Ljc1LDEuOTA1ODM4IDc2Ljkz\
NjU5OSw1MC43MjY0NTkgMTA1LjEyMzIsOTkuNTQ3MDgxIHoiIHRyYW5zZm9ybT0ibWF0cml4KDAsMC45\
NDkwODg1NCwtMC4yMDA2NjU3NiwwLDQ1LjQ4MzkyNyw5MDYuMDk0MTIpIiBpZD0icGF0aDQ1NTktOC0y\
IiBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9r\
ZTpub25lIi8+PC9nPjwvc3ZnPg==",

		"graphics/scale-fit.svg": "\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGlkPSJzdmcz\
NTg5Ij48ZGVmcyBpZD0iZGVmczM1OTEiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NTIuMzYy\
MTgpIiBpZD0ibGF5ZXIxIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjM1LjQzMzA3\
MSIgcnk9IjM1LjQzMzA3MSIgeD0iMCIgeT0iMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCw4NTIuMzYy\
MTgpIiBpZD0icmVjdDQxMTciIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tl\
Om5vbmUiLz48cmVjdCB3aWR0aD0iMTQ1LjQ2NiIgaGVpZ2h0PSIxMDIuOTUwNTgiIHg9IjI3LjI2NyIg\
eT0iOTAwLjg4NjkiIGlkPSJyZWN0NDExOSIgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2ZmZmZmZjtz\
dHJva2Utd2lkdGg6NC45NDY0NjIxNTtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjpy\
b3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1vcGFjaXR5OjE7c3Ryb2tlLWRhc2hhcnJheTpu\
b25lIi8+PHBhdGggZD0ibSAxMzAuMzc4OTgsOTk2LjIwNzc2IDMzLjY2MTQyLDAgMCwtMzMuNjYxNDEg\
LTMzLjY2MTQyLDMzLjY2MTQxIHoiIGlkPSJwYXRoNDQ5NS05IiBzdHlsZT0iZmlsbDojZmZmZmZmO2Zp\
bGwtb3BhY2l0eToxO3N0cm9rZTpub25lIi8+PHBhdGggZD0ibSAzNS45NTk1OTcsOTYyLjU0NjM0IDAs\
MzMuNjYxNDIgMzMuNjYxNDA2LDAgLTMzLjY2MTQwNiwtMzMuNjYxNDIgeiIgaWQ9InBhdGg0NDk1LTQi\
IHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmUiLz48cGF0aCBkPSJt\
IDE2NC4wNDA0LDk0Mi4xNzgwMyAwLC0zMy42NjE0MiAtMzMuNjYxNDEsMCAzMy42NjE0MSwzMy42NjE0\
MiB6IiBpZD0icGF0aDQ0OTUtMSIgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtzdHJv\
a2U6bm9uZSIvPjxwYXRoIGQ9Im0gNjkuNjIxMDA5LDkwOC41MTY2MSAtMzMuNjYxNDE3LDAgMCwzMy42\
NjE0MiAzMy42NjE0MTcsLTMzLjY2MTQyIHoiIGlkPSJwYXRoNDQ5NSIgc3R5bGU9ImZpbGw6I2ZmZmZm\
ZjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZSIvPjwvZz48L3N2Zz4=",

		"graphics/scale-full.svg": "\
PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2ZyB4\
bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5v\
cmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGlkPSJzdmcz\
NTg5Ij48ZGVmcyBpZD0iZGVmczM1OTEiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NTIuMzYy\
MTgpIiBpZD0ibGF5ZXIxIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjM1LjQzMzA3\
MSIgcnk9IjM1LjQzMzA3MSIgeD0iMS4zNjkzNDczZS0xNiIgeT0iODUyLjM2MjE4IiBpZD0icmVjdDQx\
MTciIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmUiLz48cGF0aCBk\
PSJtIDEwNS4xMjMyLDk5LjU0NzA4MSAtNTYuMzczMTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2MzQw\
MSw1MC43MjY0NiA0OC43NSwxLjkwNTgzOCA3Ni45MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5LjU0\
NzA4MSB6IiB0cmFuc2Zvcm09Im1hdHJpeCgwLDAuNDQ2ODQ5NjQsLTAuMTYwNTMyNjEsMCwxODMuNDY4\
MzEsOTMwLjU3ODI2KSIgaWQ9InBhdGg0NTU5LTgiIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFj\
aXR5OjE7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOm5vbmUiLz48cGF0aCBkPSJtIDEwNS4xMjMyLDk5\
LjU0NzA4MSAtNTYuMzczMTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2MzQwMSw1MC43MjY0NiA0OC43\
NSwxLjkwNTgzOCA3Ni45MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5LjU0NzA4MSB6IiB0cmFuc2Zv\
cm09Im1hdHJpeCgwLjc3MzM1MDUzLDAsMCwtMC4xNjA1MzI2MSw2MS43MTQ4NDMsMTAwNi4wMjE1KSIg\
aWQ9InBhdGg0NTU5LTQiIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxl\
OmV2ZW5vZGQ7c3Ryb2tlOm5vbmUiLz48cGF0aCBkPSJtIDEwNS4xMjMyLDk5LjU0NzA4MSAtNTYuMzcz\
MTk5LDAgLTU2LjM3MzE5OTEsMCBMIDIwLjU2MzQwMSw1MC43MjY0NiA0OC43NSwxLjkwNTgzOCA3Ni45\
MzY1OTksNTAuNzI2NDU5IDEwNS4xMjMyLDk5LjU0NzA4MSB6IiB0cmFuc2Zvcm09Im1hdHJpeCgwLDAu\
NDQ2ODQ5NjQsMC4xNjA1MzI2MSwwLDE2LjUzMTY5MSw5MzAuNTc4MjYpIiBpZD0icGF0aDQ1NTktOC0y\
IiBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9r\
ZTpub25lIi8+PHBhdGggZD0ibSAxMDUuMTIzMiw5OS41NDcwODEgLTU2LjM3MzE5OSwwIC01Ni4zNzMx\
OTkxLDAgTCAyMC41NjM0MDEsNTAuNzI2NDYgNDguNzUsMS45MDU4MzggNzYuOTM2NTk5LDUwLjcyNjQ1\
OSAxMDUuMTIzMiw5OS41NDcwODEgeiIgdHJhbnNmb3JtPSJtYXRyaXgoMC43NzMzNTA1MywwLDAsMC4x\
NjA1MzI2MSw2Mi4yOTkxNTksODk4LjcwMjkxKSIgaWQ9InBhdGg0NTU5IiBzdHlsZT0iZmlsbDojZmZm\
ZmZmO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTpub25lIi8+PHJlY3Qgd2lk\
dGg9IjExNS4zNDU1NCIgaGVpZ2h0PSI1OS40OTIwMjMiIHg9IjQyLjMyNzIyNSIgeT0iOTIyLjYxNjE1\
IiBpZD0icmVjdDQxMTkiIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRo\
OjMuMzQ4MzM4Mzc7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tl\
LW1pdGVybGltaXQ6NDtzdHJva2Utb3BhY2l0eToxO3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIvPjwvZz48\
L3N2Zz4="
	};

	function buildDataString(src, mime) {
		return map[src] ?
			"data:" + mime + ";base64," + map[src] :
			src;
	}

	for (var or in handles) with (handles[or].object) {
		if (typeof src == "object") {
			for (var k in src)
				src[k] = buildDataString(src[k], mime);
		} else {
			src = buildDataString(src, mime);
		}
	}
})();
}


function run($) {
/**
  A replacement for the GreaseMonkey function of the same name.
  It creates a new <code>&lt;style&gt;</code> element in the page
  <code>&lt;head&gt;</code> and writes everything there.
  @param {...String} style sheet definitions
*/
function addStyle() {
	if (arguments.length) {
		var i = !arguments.callee.css;
		if (i) {
			var style = document.createElement("style");
			style.type = "text/css";
			style.appendChild(arguments.callee.css = document.createTextNode(arguments[0]));
			document.getElementsByTagName("head")[0].appendChild(style);
		}

		for(i = Number(i); i < arguments.length; i++) {
			arguments.callee.css.appendData("\n");
			arguments.callee.css.appendData(arguments[i]);
		}
	}
}

/**
  @return Returns <code>min</code>, if <code>x</code> evaluates to
    <code>false</code> or if it is greater than <code>x</code>; returns
    <code>x</code> otherwise.
*/
function defaultMin(x, min) {
	return (x && x >= min) ? x : min;
}

/**
  @resturn Checks if a node has a specific name in a specific XML namespace.
  @type Boolean
*/
function checkTagType(node, namespaceURI, localName) {
	return node.localName == localName && node.namespaceURI == namespaceURI;
}

/**
  Switches the values behind two keys in an object.
*/
function switchValues(obj, key1, key2) {
	var temp = obj[key1];
	obj[key1] = obj[key2];
	obj[key2] = temp;
	return obj;
}


/**
  @constructor
  @class A wrapper around <code>document.evaluate</code>
  @param {Node} [context=document] The default context for the expression
  @param {XPathNSResolver|String} [nsResolver=null] The namespace resolver to
    use. <code>null</null> is an acceptable value and
    <code>&quot;default&quot;</code> will create a default resolver for
    <code>context</code> document.
  @param {Number} [resultType=ANY_TYPE] The desired <a href="http://www.w3.org/TR/DOM-Level-3-XPath/xpath.html#XPathResult">result type</a>.
*/
function XPathSearch(context, nsResolver, resultType)
{
	this.context = context || document;
	this.document = this.context.ownerDocument || this.context;
	this.nsResolver = (nsResolver === "default") ? this.document.createNSResolver(this.document.documentElement) : (nsResolver || null);
	this.resultType = resultType || XPathResult.ANY_TYPE;
	this.result = null;
}

jQuery.extend(XPathSearch.prototype, {
	/**
	  <p>Evaluates an expression.</p>
	  <p>The previous result is reused and overwritten. If you don't want this,
	  set <code>this.result</code> to <code>null</code>.</p>
	  @param {String} expr The expression to evaluate
	  @param {Node} [context] Momentarily overrides the default expression
	    context of this object.
	  @param {Number} [resultType] Momentarily overrides the default result
	    type of this object.
	  @return <code>this</code>
	  @type XPathSearch
	  @member XPathSearch
	*/
	evaluate: function(expr, context, resultType)
	{
		this.result = this.document.evaluate(
				expr,
				context || this.context,
				this.nsResolver,
				resultType || this.resultType,
				this.result);
		return this;
	},

	/**
	  Executes the handler for every individual result (works for for single
	  result types, too; see {@link #singleValue}).
	  @param {Function} fun The handler function
	  @return <code>this</code>
	  @type XPathSearch
	  @member XPathSearch
	*/
	"each": function(fun)
	{
		if (this.result) switch (this.result.resultType) {
			case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
			case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
				for (var i = 0; !(this.result.invalidIteratorState); i++) {
					fun.call(this.result.iterateNext(), i);
				}
				break;

			case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
			case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
				for (var i = 0; i < this.result.snapshotLength; i++) {
					fun.call(this.result.snapshotItem(i), i);
				}
				break;

			default:
				var val = this.singleValue();
				if (val !== null) {
					fun.call(val, 0, val);
					break;
				}
		}
		return this;
	},

	/**
	  @return The result of a single value result type, or <code>null</code> if
	    no result is available.
	  @member XPathSearch
	*/
	singleValue: function()
	{
		if (this.result) switch (this.result.resultType) {
			case XPathResult.NUMBER_TYPE:
				return this.result.numberValue;
			case XPathResult.STRING_TYPE:
				return this.result.stringValue;
			case XPathResult.BOOLEAN_TYPE:
				return this.result.booleanValue;

			case XPathResult.ANY_UNORDERED_NODE_TYPE:
			case XPathResult.FIRST_ORDERED_NODE_TYPE:
				return this.result.singleNodeValue;

			default:
				return null;
		}
	}
});


jQuery.extend(Function, {
	/**
	  @return Checks if an object is a function.
	  @type Boolean
	  @param f Any object
	  @member Function
	  @addon
	*/
	isFunction: function(f) {
		return typeof f == "function";
	}
});



jQuery.extend(Array.prototype, {
	/**
	  @return Checks if this array is empty.
	  @type Boolean
	  @member Array
	  @addon
	*/
	isEmpty: function() { return !this.length; },

	/**
	  @return a new array with the same contents as this one
	  @type Array
	  @member Array
	  @addon
	*/
	clone: function() { return this.isEmpty() ? new Array() : this.slice(0); },


	/**
	  @return Checks if this array contains a certain entry.
	  @type Boolean
	  @member Array
	  @addon
	*/
	contains: function(obj) { return this.indexOf(obj) !== -1; },

	/**
	  @param obj An object to look for
	  @return The index of <code>obj</code> in this array, or &minus;1 if it
	    doesn't occur.
	  @type Number
	  @member Array
	  @addon
	*/
	indexOf: function(obj) {
		for (var i=0; i !== this.length; i++) {
			if (this[i] == obj) return i;
		}
		return -1;
	},

	/**
	  Searches for for elements with a prefix.
	  @param {String} a prefix string
	  @param {Number} [start=0] the start index for the search (wrapped around
	    at the array end)
	  @param {Boolean} [ignoreCase=false] Do a case insensitive search?
	  @param [equal] see {@link #startsWith}
	  @return The index of the first element with the given prefix, or &minus;1
	    if none
	  @type Number
	  @member Array
	  @addon
	*/
	findPrefix: function(prefix, start, ignoreCase, equal) {
		prefix = prefix.toString();
		start = start ? start % this.length : 0;
		var filter;
		if (ignoreCase) {
			prefix = prefix.toLowerCase();
			filter = function(s) { return s.toLowerCase(); };
		} else {
			filter = function(s) { return s; };
		}
		var cmp = function(s) { return filter(s.toString()).startsWith(prefix, equal); };

		if (cmp(this[start])) return start;
		for (var i = (start + 1) % this.length; i !== start; i = (i + 1) % this.length) {
			if (cmp(this[i])) return i;
		}
		return -1;
	},

	/**
	  @param item The object for which you want a successor.
	  @return The object succeeding <code>item</code> in this array, or the
	    first array entry if this array does not contain <code>item</code> or it
	    is the last entry. For an empty array, this always returns the empty
	    string.
	  @member Array
	  @addon
	*/
	next: function(item) {
		return this.length ?
			this[(this.indexOf(item) + 1) % this.length] :
			"";
	},

	/**
	  Replaces a section of an array with the contents of another array.
	  @param {Array} a The replacement source
	  @param {Number} [offset1=0] The start offset in this array
	  @param {Number} [offset2=0] The start offset in the replacement array
	  @param {Number} [len] The number of elements to replace. No more than
	    <code>a.length &minus; offset2</code> will be copied.
	  @return <code>this</code>
	  @type Array
	  @member Array
	  @addon
	*/
	replace: function(a, offset1, offset2, len) {
		if (a.length) {
			if (offset1 === undefined) offset1 = 0;
			if (offset2 === undefined) offset2 = 0;
			len = Math.min(a.length - offset2, (len === undefined) ? Infinity : len);

			for (var i=0; i < len; i++)
				this[i + offset1] = a[i + offset2];
		}
		return this;
	},

	/**
	  @param {Number} i An index to convert to a &quot;real&quot; index on this
	    array
	  @return Returns the wrapped around index for this array. Positive values
	    start from the first, negative values from the last element.
	  @type Number
	  @member Array
	  @addon
	*/
	getIndex: function(i) {
		return (i >= 0) ? i % this.length : this.length - (i + 1) % this.length - 1;
	},

	/**
	  @param {Number} index The index of the desired entry
	  @return Returns the array entry at the module of the index. If the index
	    is negative, it is counted from the array end.
	  @member Array
	  @addon
	*/
	get: function(i) { if (this.length) return this[this.getIndex(i)]; },

	/**
	  Appends the contents of the passed arrays to this array.
	  @param [...Array] arrays to append to this one
	  @return <code>this</code>
	  @type Array
	  @member Array
	  @addon
	*/
	append: function() {
		for (var i=0; i < arguments.length; i++)
			if (arguments[i] instanceof Array || arguments[i] instanceof jQuery)
				for (var j=0; j < arguments[i].length; j++)
					this.push(arguments[i][j]);
		return this;
	},

	/**
	  Invokes <code>callback</code> for every array entry. If the callback
	  returns a value which is not <code>undefined<code> and evaluates to
	  <code>false</code>, this method return immediately.

	  @param {Function} callback A handler function
	  @param {Number} [start=0] The start index
	  @param {Number} [len] The maximum number of entries to handle
	  @return <code>this</code>
	  @type Array
	  @member Array
	  @addon
	*/
	"each": function(callback, start, lenght) {
		start = (start !== undefined) ? this.getIndex(Number(start)) : 0;
		length = (length !== undefined) ? Math.min(length, this.length) : this.length;
		for (var i=start; i < length; i++) {
			var r = callback.call(this[i], i, this[i]);
			if (r !== undefined && !r) break;
		}
		return this;
	},

	/**
	  Sorts this array and returns a duplicate free copy.
	  @return A sorted copy, duplicate-free copy of this array
	  @param {Function} [comparator] A comparator function (see {@link #sort}
	  @member Array
	  @addon
	 */
	unique: function(comparator) {
		if (!this.length) return this;
		this.sort(comparator);
		var a = new Array();
		a.push(this[0]);
		for (var i = 1; i !== this.length; i++) {
			if (this[i] != this[i - 1])
				a.push(this[i]);
		}
		return a;
	}
});
jQuery.extend(Array, {
	/**
	  @return Checks if an object is either no array or empty.
	  @type Boolean
	  @member Array
	  @addon
	*/
	isEmpty: function(ar) { return !(ar instanceof Array && ar.length); },

	/**
	  Turns every arry-like object into a true array.
	  @param obj An array-like object
	  @return <code>obj</code> itself, if it is an array already; an array with
	    all elements accessed via <code>obj[i]</code>, if <code>obj</code> has a
	    positive, numeric <code>length</code> property; an empty array
	    otherwise.
	  @type Array
	  @member Array
	  @addon
	*/
	toArray: function(obj) {
		if (obj instanceof Array)
			return obj;

		if (typeof obj.length == "number" && obj.length > 0) {
			var a = new Array(obj.length);
			for (var i=a.length-1; i >= 0; i--) a[i] = obj[i];
			return a;
		}

		return new Array();
	}
});



jQuery.extend(Number.prototype, {
	/**
	  Rounds this number and appends a unit string.
	  @param {String} unit A unit to append to the number
	  @param {Number} [precision=3] The rounding precision
	  @return This number with a unit string
	  @type String
	  @member Number
	  @addon
	*/
	toUnit: function(unit, precision) { return this.round(precision) + unit.toString(); },

	/**
	  @return The precentile representation of this number with 1 decimal digit
	    succeeded by a percent character.
	  @type String
	  @member Number
	  @addon
	*/
	percent: function() { return (this * 100).toUnit("%", 1); },

	/**
	  @return Checks if this number is even.
	  @type Boolean
	  @member Number
	  @addon
	*/
	even: function() { return this % 2 === 0; },

	/**
	  @return Checks if this number is odd.
	  @type Boolean
	  @member Number
	  @addon
	*/
	odd: function() { return this % 2 === 1; },

	/**
	  @param {Number} a The range beginning
	  @param {Number} b The range end
	  @param {Boolean} [exclusive=false] Use an exclusive instead of an
	    inclusive range?
	  @return Checks if this number lies in the given range.
	  @type Boolean
	  @member Number
	  @addon
	*/
	between: function(a, b, exclusive) {
		if (b < a) {
			var h = a;
			a = b;
			b = a;
		}
		return exclusive ? a < this && this < b : a <= this && this <= b;
	},

	/**
	  @param {Number} [precision=3] The precision to round to
	  @return This number rounded to <code>precision</code> decimal digits
	  @type Number
	  @member Number
	  @addon
	*/
	round: function(precision) {
		precision = (precision === undefined) ? 1000 :
			(0 <= precision && precision < arguments.callee.fastMap.length) ?
				arguments.callee.fastMap[precision.floor()] :
				Math.pow(10, precision.roundTowards());
		return Math.round(this * precision) / precision;
	},

	/**
	  @param {Number} [target=0] The number to round towards
	  @return This number rounded to the next integer towards the target
	  @type Number
	  @member Number
	  @addon
	*/
	roundTowards: function(target) {
		if (target === undefined) target = 0;
		var floor = this.floor(),
			ceil = this.ceil(),
			delta = Math.abs(this - target);
		return (!delta || delta < 1 && delta.between(Math.abs(floor - target), Math.abs(ceil - target))) ?
			target : (this > target) ? floor : ceil;
	},

	/**
	  @return The signum of this number
	  @type Number
	  @member Number
	  @addon
	*/
	sign: function() { return (this > 0) ? 1 : (this < 0) ? -1 : 0; }
});
Number.prototype.round.fastMap = [1, 10, 100, 1000];
jQuery.each(["ceil", "floor", "abs"], function(i, name) {
	Number.prototype[name] = function() { return Math[name](this); };
});
jQuery.each(["px", "pt", "em", "ex", "deg"], function(i, unit) {
	Number.prototype[unit] = function() { return this.toUnit(unit); };
});

jQuery.extend(Number, {
	/**
	  @return Checks if an object is a number.
	  @param obj any object
	  @type Boolean
	  @member Number
	  @addon
	*/
	isNumber: function(obj) {
		return typeof obj == "number";
	}
});



if (!String.prototype.trim) {
	String.prototype.trim = function() {
		if (!this) return this;

		var	s = this.replace(arguments.callee.patterns.matchStart, "");
		if (!s) return "";

		var ws = arguments.callee.patterns.matchWhiteSpace;
		for (var i = s.length - 1; ws.test(s[i]); i--);
		return s.substring(0, i + 1);
	};
	String.prototype.trim.patterns = {
		matchStart: /^\s\s*/,
		matchWhiteSpace: /\s/
	};
}
jQuery.extend(String.prototype, {
	/**
	  @return The integer representation of this string
	  @type Number
	  @member String
	  @addon
	*/
	toInt: function() { return parseInt(this); },

	/**
	  @return The float representation of this string
	  @type Number
	  @member String
	  @addon
	*/
	toFloat: function() { return parseFloat(this); },

	/**
	  @param {..String} strings to match against
	  @return Checks if any argument matches this string.
	  @type Boolean
	  @member String
	  @addon
	*/
	equals: function() {
		for (var i=arguments.length-1; i >= 0; i--) {
			if (this == arguments[i]) return true;
		}
		return false;
	},

	/**
	  @param {..String} strings to match against
	  @return Checks if this string contains any arguments as a substring.
	  @type Boolean
	  @member String
	  @addon
	*/
	contains: function() {
		for (var i=arguments.length-1; i >= 0; i--) {
			if (this.indexOf(arguments[i]) !== -1)
				return true;
		}
		return false;
	},

	/**
	  @return Checks if this string has a prefix.
	  @type Boolean
	  @param {String} s The prefix
	  @param {Boolean} [equal=true] If <code>false</code>, check for equality
	    instead of prefix.
	  @member String
	  @addon
	*/
	startsWith: function(s, equal) {
		s = s.toString();
		if (s.length > this.length) return false;
		if (equal === undefined) equal = true;
		var i;
		for (i = 0; i < s.length; i++) {
			if (s.charCodeAt(i) !== this.charCodeAt(i))
				return false;
		}
		return equal || i !== this.length;
	},

	/**
	  @return Checks if this string has a suffix.
	  @type Boolean
	  @param {String} s The suffix
	  @param {Boolean} [equal=true] If <code>false</code>, check for equality
	    instead of suffix.
	  @member String
	  @addon
	*/
	endsWith: function(s, equal) {
		s = s.toString();
		if (s.length > this.length) return false;
		if (equal === undefined) equal = true;
		var i;
		for (var i=s.length-1; i >= 0; i--) {
			if (s.charCodeAt(i) !== this.charCodeAt(i))
				return false;
		}
		return equal || i !== 0;
	},

	_split_old: String.prototype.split,

	/**
	  Replaces the built-in split function so that the delimiter defaults to
	  the regular expression <code>\s+</code>. The old behaviour can be accessed
	  via {@link #_split_old}.
	  @see http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf
	  @member String
	  @addon
	*/
	split: function(delim, n) {
		return this._split_old(delim || String._DefaultDelimiter, n);
	},

	/**
	  @return the character at the wrapped around index.
	  @type String
	  @param {Number} i An index (see {@link #getIndex})
	  @member String
	  @addon
	*/
	get: function(i) { return this[this.getIndex(i)]; },

	/**
	  @return Converts an index to its wrapped around form for this string. If
	    the index is neagtive, count from the string end.
	  @type Number
	  @param {Number} i The index to convert
	  @member String
	  @addon
	*/
	getIndex: function(i) {
		return (this.length) ?
			((i >= 0) ? (i % this.length) : (this.length - i % this.length)) :
			NaN;
	}
});

jQuery.extend(String, {
	_DefaultDelimiter: /\s+/g,

	/**
	  @return a copy of the default delimiter for the split function
	  @type RegExp
	  @member String
	  @addon
	*/
	getDefaultDelimiter: function() { return new RegExp(String._DefaultDelimiter); },

	/**
	  @return Checks if an object is either no string or empty.
	  @type Boolean
	  @member String
	  @addon
	*/
	isEmpty: function(s) {
		return !(s && typeof s == "string");
	},

	/**
	  Compares two strings case-insensitively.
	  @param {String} a A string
	  @param {String} b Another string
	  @result 1 if <code>a &gt; b</code>; &minus;1 if <code>a &lt; b</code>;
	    0 if they are equal (except for character case)
	  @type Number
	  @member String
	  @addon
	*/
	compareIgnoreCase: function(a, b) {
		a = a.toLowerCase();
		b = b.toLowerCase();
		return (a < b) ? -1 : (a > b) ? 1 : 0;
	}
});


jQuery.extend(Math, {
	deviation: function(a, b) { return Math.abs(a / b - 1); }
});


/**
  @return Parses an object and returns an object containing its
    <code>value</code> and CSS <code>unit</code>.
  @type Object
  @param {Object} [obj] (Re)use another object to hold the result values.
  @param {String|Number|SVGLength} s An object containing a length information
*/
function parseCSSLength(obj, s) {
	if (typeof obj != "object") {
		s = obj;
		obj = {};
	}

	if (s instanceof SVGLength || s && s.toString() == "[object SVGLength]") {
		obj.value = s.value;
		switch (s.unitType) {
			case s.SVG_LENGTHTYPE_NUMBER:     obj.unit = ""; break;
			case s.SVG_LENGTHTYPE_PERCENTAGE: obj.unit = "%"; break;
			case s.SVG_LENGTHTYPE_EMS:        obj.unit = "em"; break;
			case s.SVG_LENGTHTYPE_EXS:        obj.unit = "ex"; break;
			case s.SVG_LENGTHTYPE_PX:         obj.unit = "px"; break;
			case s.SVG_LENGTHTYPE_CM:         obj.unit = "cm"; break;
			case s.SVG_LENGTHTYPE_MM:         obj.unit = "mm"; break;
			case s.SVG_LENGTHTYPE_IN:         obj.unit = "in"; break;
			case s.SVG_LENGTHTYPE_PT:         obj.unit = "pt"; break;
			case s.SVG_LENGTHTYPE_PC:         obj.unit = "pc"; break;
			default: obj.unit = null;
		}
	} else if (typeof s == "number") {
		obj.value = s;
		obj.unit = "";
	} else if (typeof s == "string") {
		s = s.match(arguments.callee.pattern);
		if (s) {
			obj.value = s[1].toFloat();
			obj.unit = s[4];
		} else {
			obj = null;
		}
	} else {
		throw "Unsupported length type: " + s;
		obj = null;
	}
	return obj;
}
parseCSSLength.pattern = /^\s*([\+-]?(\.\d+|\d+\.?\d*)(e[\+-]?\d+)?)(%|em|ex|px|cm|mm|in|pt|pc|)\s*$/i;

/**
  Looks for a CSS ruleset in a set of stylesheets with a specific selector.
  @param {StyleSheet|CSSStyleSheet|Array} [stylesheets=document.styleSheets]
    A set of stylesheets
  @param {String} selector A selector to look for
  @return The first ruleset with the given selector
*/
function getCSSRule(stylesheets, selector) {
	if (stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet)) {
		stylesheets = [stylesheets];
	} else if (!(stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet) || stylesheets instanceof Array)) {
		selector = stylesheets;
		stylesheets = document.styleSheets;
	}

	for (var i=0; i < stylesheets.length; i++) {
		// search in all rules
		for (var j=0; j < stylesheets[i].cssRules.length; j++) {
			if (stylesheets[i].cssRules[j].selectorText == selector)
				return stylesheets[i].cssRules[j];
		}
	}
	return null;
}

/**
  Changes a rule in a CSS stylesheet.
  @param {StyleSheet|CSSStyleSheet|StyleSheetList|Array}
    [stylesheets=document.styleSheets] A set of stylesheets
  @param {String} selector A selector identifying the rule to modify
  @param {Object|String} style A string identifying the CSS property to change,
    or an object with key-value-pairs of CSS properties and their corresponding
    values
  @param {String} [value] If <code>style</code> is a string, this is the value
    to assign to the CSS property.
  @param {Boolean} [multiple=false] If <code>false</code>, the modification
    stops after the first selector match.
  @return The modified CSS rule, if <code>multiple</code> is <code>false</code>;
    <code>null</code> otherwise
*/
function changeCSSRule(stylesheets, selector, style, value, multiple) {
	if (stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet)) {
		stylesheets = [stylesheets];
	} else if (!(stylesheets instanceof (window.StyleSheet || window.CSSStyleSheet) || stylesheets instanceof Array)) {
		multiple = value;
		value = style;
		style = selector;
		selector = stylesheets;
		stylesheets = document.styleSheets;
	}

	/*if (jQuery.browser.opera) {
		selector += " { ";
		if (typeof style == "object") {
			for (var key in style)
				selector += convertPropertyToCSSName(key) + ": " + style[key] + "; ";
		} else {
			selector += style + ": " + value + "; ";
		}
		selector += "}";
		addStyle(selector);
		return null;
	}*/

	// else
	if (typeof style == "object") {
		multiple = Boolean(value);
	} else {
		multiple = Boolean(multiple);
		style = convertCSSNameToProperty(style.toString());
	}

	// search in all stylesheets
	for (var i=0; i < stylesheets.length; i++) {
		// search in all rules
		for (var j=0; j < stylesheets[i].cssRules.length; j++) {
			if (stylesheets[i].cssRules[j].selectorText == selector) {
				if (typeof style == "object") {
					$.extend(stylesheets[i].cssRules[j].style, style);
				} else {
					stylesheets[i].cssRules[j].style[style] = value;
				}
				if (!multiple) return stylesheets[i].cssRules[j];
			}
		}
	}
	if (!multiple) return null;
}

/**
  @return Converts a CSS property name to a JavaScript object property name.
  @type String
  @param {String} cssname A CSS property name
*/
function convertCSSNameToProperty(cssname) {
	var prop = "",
		end = cssname.length - 1,
		last = 0;
	for (var i=0; i < end; i++) {
		if (cssname.charCodeAt(i) === 0x2D) {
			prop += cssname.substring(last, i) + cssname[++i].toUpperCase();
			last = i + 1;
		}
	}
	prop = last ? prop + cssname.substring(last) : cssname;
	return prop;
}

/**
  @return Converts a JavaScript object property name to a CSS property name.
  @type String
  @param {String} prop A JavaScript object property name
*/
function convertPropertyToCSSName(prop) {
	var cssname = "",
		last = 0;
	for (var i=0; i < key.length; i++) {
		if (prop.charChodeAt(i).between(0x41, 0x5A)) {
			cssname += prop.substring(last, i) + "-" + prop[i].toLowerCase();
			last = i + 1;
		}
	}
	cssname = last ? cssname + prop.substring(last) : prop;
	return cssname;
}



/**
  @constructor
  @class The SVG class helps to apply matrix transformations to nodes in an SVG
  document.
  @param {SVG} [template] Use a template object and use one of its children and
    a copy of its transform stack. You must specify <code>index</code>, if you
    use this.
  @param {Number} [index] When using a template, this is the index of the
    template's child to use.
  @param {...SVG|jQuery|Array|Object} Arrays of SVG document nodes that will be
    stored in the resulting SVG object. Each node is stored by its numeric index
    just as with arrays.
*/
function SVG(template, index) {
	if (template instanceof SVG && typeof index == "number") {
		this.length = 1;
		this[0] = template[index];
		this.transformStack = template.transformStack.clone();
	} else {
		/**
		  The number of nodes in this object
		*/
		this.length = 0;
		for (var i=0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (arg instanceof SVG || arg instanceof jQuery || arg instanceof Array) {
				for (var j=0; j < arg.length; j++)
					if (arg[j].transform)
						this[this.length++] = arg[j];
			} else if (arg.transform) {
				this[this.length++] = arg;
			}
		}

		/**
		  The list of transformations applied to the nodes using thid SVG object
		*/
		this.transformStack = new Array();
	}

	/**
	  The document element of the first SVG node.
	*/
	this.doc = this[0] ? this[0].ownerSVGElement || this[0].ownerDocument.documentElement : null;
}

jQuery.extend(SVG.fn = SVG.prototype, {

	/**
	  @return The DOM node at the given index
	  @type Node
	  @param Number i The node index
	  @member SVG
	*/
	get: function(i) { return this[i]; },

	/**
	  @return A new SVG object containing only the node at the given index
	  @type SVG
	  @param Number i The node index
	  @see SVG
	  @member SVG
	*/
	eq: function(i) { return (this.length > 1) ? new SVG(this, i) : this; },

	/**
	  @return An array of all DOM nodes in this object or a subarray thereof
	  @type Array
	  @param Number [start=0] The index of the first element to export
	  @param Number [end] The index of the element after last element to export
	  @member SVG
	*/
	all: function(start, end) {
		if (!start || start < 0) start = 0;
		if (!end || end > this.length) end = this.length;

		var a = new Array(Math.max(end - start, 0));
		for (; start < end; start++) a[start] = this[start];
		return a;
	},

	/**
	  Invokes a given function on all DOM nodes in this object (similar to
	  {@link jQuery.each}).
	  @param Function callback The function to invoke
	  @return <code>this</code>
	  @type SVG
	  @member SVG
	*/
	"each": function(callback) {
		jQuery.each(this, callback);
		return this;
	},

	/**
	  @return An SVGMatrix object with the 6 given values as entries.
	  @type SVGMatrix
	  @param {...Number} The matrix entries
	  @member SVG
	*/
	matrix: function(a, b, c, d, e, f) {
		var m = this.doc.createSVGMatrix();
		m.a = Number(a);
		m.b = Number(b);
		m.c = Number(c);
		m.d = Number(d);
		m.e = Number(e);
		m.f = Number(f);
		return m;
	},

	/**
	  Applies a transformation to all SVG nodes.
	  @param {SVGTransform} [transform] A transformation object to use. If none
	    is given, create a new one.
	  @param {SVGMatrix|String} A transformation matrix to use or a string with
	    a transformation name:
	    <ul>
	      <li><code>matrix</code>: use the following 6 arguments as
	        transformation matrix entries (see {@link SVGTransform#setMatrix}).
	        </li>
	      <li><code>skew</code>: use a skew transformation matrix; the following
	        2 arguments are the skew amount for X and Y (see
	        {@link SVGTransform#setSkewX}, {@link SVGTransform#setSkewY}).</li>
	      <li><code>scale</code>: use a scale transformation matrix; the
	        following 2 arguments are the scaling amount for X and Y (=X, if not
	        specified; see {@link SVGTransform#setScale}).</li>
	      <li><code>translate</code>: use a translate transformation matrix; the
	        following 2 arguments are the translation amount for X and Y (see
	        {@link SVGTransform#setTranslate}).</li>
	      <li><code>rotate</code>: use a translate rotation matrix; the
	        following argument is the rotation amount  (see
	        {@link SVGTransform#setRotate}).</li>
	    </ul>
	  @param {...Number} transformation parameters
	  @return the transformation object
	  @type SVGTransform
	  @member SVG
	*/
	transform: function(transform, action, a, b, c, d, e, f) {
		if (transform instanceof SVGTransform && arguments.length === 1) {
			if (jQuery.browser.opera) {
				// opera does not allow us to insert a transform object into multiple transform lists; therefore, create a new transform object
				action = transform.matrix;
				transform = this.doc.createSVGTransform();
				transform.setMatrix(action);
			}
		} else {
			if (transform instanceof SVGMatrix || typeof transform == "string") {
				f = e; e = d; d = c; c = b; b = a; a = action;
				action = transform;
				transform = null;
			}

			if (!(transform instanceof SVGTransform)) transform = this.doc.createSVGTransform();
			if (action instanceof SVGMatrix) {
				transform.setMatrix(action);
			} else if (typeof action == "string") {
				if (action == "matrix") {
					transform.setMatrix(this.matrix(a, b, c, d, e, f));
				} else if (action == "skew") {
					transform.setSkewX(a);
					transform.setSkewY(b);
				} else if (action == "scale") {
					transform.setScale(a, isNaN(b) ? a : b);
				} else {
					var t = "set" + action[0].toUpperCase() + action.substring(1);
					if (!Function.isFunction(transform[t])) throw "\""+action+"\" is an unknown transformation kind."
					transform[t](a, b, c, d, e, f);
				}
			}
		}
		return transform;
	},

	/**
	  Applies a transformation to all DOM nodes on this object. If the same
	  transformation object already exists in the list, the old entry is removed.
	  @param {SVGTransform|SVGMatrix|String} transform See the
	    <code>transform</code> argument on {@link #transform}.
	  @param {Number} pos The transformation is inserted into the transformation
	    list at this index
	  @param {...Number} transformation arguments
	  @return The performed transformation
	  @type SVGTransform
	  @see #transform
	  @member SVG
	*/
	insertBefore: function(transform, pos, a, b, c, d, e, f) {
		if (!(transform instanceof SVGTransform))
			transform = this.transform(transform, a, b, c, d, e, f);

		// apply the transformation to the DOM nodes
		if (this.length) {
			for (var i=this.length-1; i >= 0; i--) {
				if (pos >= this[i].transform.baseVal.numberOfItems) {
					this[i].transform.baseVal.appendItem(i ? this.transform(transform) : transform);
				} else {
					this[i].transform.baseVal.insertItemBefore(i ? this.transform(transform) : transform, pos);
				}
			}

			// store the transformation in the stack but remove previous occurences of the same transformation
			var stackpos = this.transformStack.indexOf(transform);
			if (stackpos !== -1 && pos !== stackpos && pos < this.transformStack.length - 1)
				this.transformStack.splice(stackpos, 1);
			if (pos >= this.transformStack.length) {
				this.transformStack.push(transform);
			} else {
				this.transformStack.splice(Math.max(pos, 0), 0, transform);
			}
		}
		return transform;
	},

	/**
	  Adds a transformation to the tail of all transformation lists.
	  @param {SVGTransform|SVGMatrix|String} transform See the
	    <code>transform</code> argument on {@link #transform}.
	  @param {...Number} transformation arguments
	  @return The performed transformation
	  @type SVGTransform
	  @see #insertBefore
	  @member SVG
	*/
	push: function(transform, a, b, c, d, e, f) {
		return this.insertBefore(transform, Infinity, a, b, c, d, e, f, g);
	},

	/**
	  Adds a transformation to the head of all transformation lists.
	  @param {SVGTransform|SVGMatrix|String} transform See the
	    <code>transform</code> argument on {@link #transform}.
	  @param {...Number} transformation arguments
	  @return The performed transformation
	  @type SVGTransform
	  @see #insertBefore
	  @member SVG
	*/
	unshift: function(transform, a, b, c, d, e, f) {
		return this.insertBefore(transform, 0, a, b, c, d, e, f, g);
	},

	/**
	  Removes a transformation in the stack from the stack and all SVG nodes.
	  @param {SVGTransform|Number} transform The index of the transformation in
	    the transform stack, or the SVGTransform object to remove itself
	  @return <code>this</code>
	  @type SVG
	  @member SVG
	*/
	remove: function(transform) {
		var pos;
		if (typeof transform == "number") {
			pos = transform.min(this.transformStack.length - 1);
			transform = this.transformStack[pos];
		} else {
			pos = this.transformStack.indexOf(transform);
		}

		if (pos !== -1)
			this.transformStack.splice(pos, 1);

		if (transform) {
			for (var i=this.length-1; i >= 0; i--) {
				for (var j=0; j < this[i].transform.baseVal.numberOfItems; j++) {
					if (transform === this[i].transform.baseVal.getItem(j)) {
						this[i].transform.baseVal.removeItem(j);
						break;
					}
				}
			}
		}

		return this;
	},

	/**
	  Removes the first transformation in the stack from all SVG nodes.
	  @return <code>this</code>
	  @type SVG
	  @member SVG
	*/
	shift: function() { return this.remove(0); },

	/**
	  Removes the last transformation in the stack from all SVG nodes.
	  @return <code>this</code>
	  @type SVG
	  @member SVG
	*/
	pop: function() { return this.remove(Infinity); },

	/**
	  Changes the transformation at a given stack position. If there is no entry
	  at that position, it will be pushed onto the stack.
	  @param {SVGTransform|SVGMatrix|String} transform See the
	    <code>transform</code> argument on {@link #transform}.
	  @param {Number} pos The transformation is inserted into the transformation
	    list at this index
	  @param {...Number} transformation arguments
	  @see #push
	  @see #insertBefore
	  @return The resulting transformation object
	  @type SVGTransform
	  @member SVG
	*/
	change: function(action, pos, a, b, c, d, e, f) {
		var transform = this.transformStack[pos];
		if (!transform) return this.push(action, a, b, c, d, e, f);

		this.transform(transform, action, a, b, c, d, e, f);
		if (jQuery.browser.opera) {
			for (var i=this.length-1; i >= 0; i--)
				this[i].transform.baseVal.getItem(Math.min(pos, this[i].transform.baseVal.numberOfItems - 1)).setMatrix(transform.matrix);
		}
		return transform;
	}
});
jQuery.each(["translate", "rotate", "skew", "matrix", "scale"], function(i, name) {
	var fname = name[0].toUpperCase() + name.substring(1);
	jQuery.each(["push", "unshift", "change"], function(j, prefix) {
		SVG.fn[prefix + fname] = function(pos, a, b, c, d, e, f) { return this[prefix](name, pos, a, b, c, d, e, f); };
	});
});
SVG.namespaceURI = "http://www.w3.org/2000/svg";

jQuery.extend(SVG, {
	/**
	  @return Checks if a node contains (<code>&lt;object&gt;</code> or
	    <code>&lt;embed&gt;</code> nodes) or is part of an SVG document.
	  @type Boolean
	  @member SVG
	*/
	isSVGObject: function(node) {
		var d = node.contentDocument;
		d = (d || node).documentElement;
		return Boolean(d && checkTagType(d, SVG.namespaceURI, "svg") || node.ownerSVGElement);
	},

	/**
	  This function is the default namespace resolver for SVG documents.
	  @return Returns the SVG namespace URI for a prefix
	    <code>&quot;svg&quot;</code>, or <code>null</code> otherwise.
	  @type String
	  @member SVG
	*/
	lookupNamespaceURIDefault: function(prefix) {
		return (prefix.equals("svg", "")) ? SVG.namespaceURI : null;
	}
});



jQuery.fn.extend({
	/**
	  @return The maximally allowed height of the first element, which
	    depends on a local property of that element or a global setting.
	  @type Number
	  @member jQuery
	  @addon
	*/
	getMaxHeight: function() {
		var h = window.innerHeight * (this[0].maxHeightRatio || GlobalSettings.image.maxHeightRatio || 1) - this.offset().top;
		return (this[0].navigatorMaxHeight = Math.max(h, this[0].maxHeightMin || GlobalSettings.image.minHeightAbs || 0).ceil()).px();
	},

	/**
	  Cycles the classes of all elements based on the passed class name array or
	  one set as a property to the DOM elements.
	  If an element contains a cycle class, that class is replaced by the next
	  of the class name array. If it does not contain such a class name, the
	  first is appended to its current class names.
	  @param {Array} [cycle] class names to cycle through
	  @param {...String} You can also specify the class names as argument list
	    instead of an array.
	  @return <code>this</this>
	  @type jQuery
	  @member jQuery
	  @addon
	*/
	cycleClass: function(cycle) {
		if (!(cycle instanceof Array)) cycle = arguments;
		for (var i=this.length-1; i >= 0; i--) {
			var cycle_current = cycle.length ? cycle : this[i].cycleClasses;
			if ((cycle_current === cycle) && Array.isEmpty(cycle_current)) continue;

			var classes = this[i].className.trim().split();
			if (classes.length === 1 && !classes[0].length) classes = [];

			var pos = -1, j;
			for (j = 0; j < cycle_current.length; j++) {
				if ((pos = classes.indexOf(cycle_current[j])) !== -1)
					break;
			}

			if (pos === -1) {
				this[i].className = this[i].className.length ? this[i].className + " " + cycle_current[0] : cycle_current[0];
			} else {
				classes.splice(pos, 1);
				this[i].className = (classes.length) ? classes.join(" ") + " " + cycle_current.get(j + 1) : cycle_current.get(j + 1);
			}
		}
		return this;
	},

	_offset_old: jQuery.fn.offset,

	/**
	  Replaces the old offset function with one that recursively adds all
	  offsets of the first element up to a given parent node.
	  If the function does not encounter that node, it adds all offsets until
	  the <code>&lt;body&gt;</code> node.
	  @param {Node|jQuery} [parent=document.body] The parent node to calculate
	    the relative offset to
	  @return An object containing the <code>left</code> and <code>top</code>
	    offsets
	  @type Object
	  @member jQuery
	  @addon
	*/
	offset: function(parent) {
		if (parent instanceof jQuery) parent = parent[0];
		if (!parent) parent = document.body;
		if (this[0] === parent || this[0] === document.body || this[0] === document.documentElement)
			return {top: 0, left: 0};

		// else
		var offset = $(this[0].offsetParent).offset(parent),
			style = window.getComputedStyle(this[0], null);
		offset.top += this[0].offsetTop
			+ (!jQuery.browser.opera && style.borderTopWidth.toFloat())
			+ style.paddingTop.toFloat();
		offset.left += this[0].offsetLeft
			+ (!jQuery.browser.opera && style.borderLeftWidth.toFloat())
			+ style.paddingLeft.toFloat();
		return offset;
	},

	/**
	  This is supposed to be a workaround for misinterpreted
	  <code style="white-space: nowrap;">max-height</code> CSS properties. You
	  need to call this everytime the
	  <code style="white-space: nowrap;">max-height</code> value changes and,
	  for relative values, everytime its related value changes (i. e. the
	  parent client height for &quot;%&quot; or the font size for &quot;em&quot;
	  or &quot;ex&quot;).
	  @return <code>this</this>
	  @type jQuery
	  @member jQuery
	  @addon
	*/
	maxDimWorkaround: function() {
		if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) {
			for (var i=this.length-1; i >= 0; i--) {
				var classes = this[i].parentNode.parentNode.className.split();
				this[i].style.height = classes.contains("scaled") ? GlobalSettings.image.minHeightAbs.px() : "";
				//this[i].style.width = classes.contains("full") ? (i ? this.eq(i) : this).naturalDimensions().width.px() : "";
			}
		}
		return this;
	},

	/**
	  @returns An object with the natural <code>width</code> and
	    <code>height</code> of the first element (i. e. images). If there is no
	    such entry with a natural size, both values are 0.
	  @type Object
	  @member jQuery
	  @addon
	*/
	naturalDimensions: function() {
		if (this[0]) {
			if (this[0].naturalWidth !== undefined) {
				if (this[0].naturalWidth || this[0].naturalHeight)
					return {width: this[0].naturalWidth, height: this[0].naturalHeight};

			} else if (this[0].width || this[0].height) {
				var img;
				if (this[0] instanceof HTMLImageElement) {
					img = this[0].cloneNode(false);
					this[0].naturalWidth = img.width;
					this[0].naturalHeight = img.height;
				} else {
					img = this[0];
				}
				return {width: img.width, height: img.height};
			}
		}
		return {width: 0, height: 0};
	},

	/**
	  Invokes a navigator action using the given options, or, if no action is
	  given, returns the {@link Navigator} object associated to the first
	  element.
	  @param {String} [action] Perform an action on the associated navigator.
	    <ul>
	      <li><code>add</code>: If any of them has no navigator object, a new
	        one is created and stored with the element; see
	        {@link Navigator#add}</li>
	      <li><code>resize</code>: see {@link Navigator#resize}</li>
	      <li><code>bind</code>: see {@link Navigator#bind}; the necessary parameters may be passed as a
	        single options object with key-value-pairs.</li>
	      <li><code>getOrientation</code>: If invoked on a navigator handle,
	        returns the orientation of that handle.</li>
	      <li><code>image</code>: If invoked on a navigator handle, returns the
	        corresponding image node (wrapped in a {@link jQuery} object).</li>
	    </ul>
	  @param {Object} [options] options passed to the invoked action
	  @member jQuery
	  @addon
	*/
	navigator: function(action, options) {
		if (!arguments.length)
			return this.data(Navigator._dataKey);

		if (typeof action == "string") {
			action = action.toLowerCase();

			if (action == "getorientation") {
				var orientation = null;
				if (this.data(Navigator._dataKey)) {
					var classNames = this[0].className.split();
					for (var i=classNames.length-1; i >= 0; i--) {
						if (classNames[i].startsWith(Navigator.classNames.handle.prefix))
							return classNames[i].substring(Navigator.classNames.handle.prefix.length);
					}
				}
				return null;
			}

			if (action == "image") {
				var nav = this.data(Navigator._dataKey);
				return nav ? nav.img : null;
			}

			if (Navigator._publicMethods.contains(action)) {
				for (var i=0; i < this.length; i++) {
					var o = i ? this.eq(i) : this,
						nav = o.data(Navigator._dataKey);
					if (nav instanceof Navigator) {
						nav[action](options);
					} else if (action == "add") {
						nav = new Navigator(o, options);
						o.data(Navigator._dataKey, nav);
					}
				}
			}
		}
		return this;
	}
});

jQuery.browser.majorVersion = jQuery.browser.version.toFloat();
jQuery.extend(jQuery.support, {
	transform: (function() {
		var n = document.createElement("div");
		if (n.filters) return true;
		var properties = ["transform", "MozTransform", "WebkitTransform", "KhtmlTransform", "OTransform"];
		for (var i=0; i < properties.length; i++) {
			if (n.style[properties[i]] !== undefined)
				return true;
		}
		return false;
	})()
});


/**
  @constructor
  @class <p>This class helps displaying handy icons in front of an image (or in
    principle any other HTML element with dimensions).</p>
    <p>The icons are surrounded by sensitive areas that you can bind event
    handlers to. They adapt in size and position depending on the image
    dimensions and some global settings.</p>
  @param {Node|jQuery} img An image node
  @param {Object} options An option object
  @see #add
*/
function Navigator(img, options) {
	/**
	  The image to build this navigator upon.
	*/
	this.img = (img instanceof jQuery && img.length > 1) ? img.eq(0) : $(img);

	/**
	  The root object of this navigator.
	*/
	this.root = $(this.img[0].parentNode.parentNode);

	/**
	  The handle containers of this navigator stored by their orientation
	*/
	this.container = {};

	/**
	  The handle containers of this navigator stored in an array for easy
	  wrapping in a jQuery object
	*/
	this.container_array = new Array();

	/**
	  Chaches the UI handle groups.
	  Access this value by the 'getHandleUIObjectGroups' method.
	*/
	this._handleUIObjectGroups = null;

	/**
	  Caches the SVG object with all SVG nodes relevant for scale transformation.
	  Access this value by the 'getSVGObject' method.
	*/
	this._handleSVGObject = null;

	/**
	  Stores the current handle icon scaling ratio an the corresponding
	  SVGTransform object.
	*/
	this._currentScale = {ratio: 1, transform: null};

	if (typeof options == "object") {
		this.root.addClass(Navigator.classNames.root[0]);
		this.add(options);
	}

	Navigator.navigators.push(this);

	/**
	  Displays the natural and the current image dimension
	*/
	this.dimensionDisplay = this.dimensionDisplayBg = null;
};

jQuery.extend(Navigator.prototype, {
	/**
	  Adds new handles to this navigator and the underlying image.
	  @param {Object} options Must contain key-value-pairs of orientations
	    (left, right, top, bottom, center) and link targets or callback methods.
	  @return <code>this</code>
	  @type Navigator
	  @member Navigator
	*/
	add: function(options) {
		var img = this.img[0];

		// create a template handle node
		var template = document.createElement("a");
		if (GlobalSettings.debug < 2) template.style.display = "none";
		template.appendChild(document.createElement("div"));

		var container_new = new Array();
		for (var or in options) if (options[or] && GlobalSettings.handles[or]) {
			// create one handle for each (valid) orientation
			var HSettings = GlobalSettings.handles[or];
			var handle = template.cloneNode(true);
			handle.className = Navigator.classNames.handle[0] + " " + Navigator.classNames.handle.prefix + or;

			if (typeof HSettings.object.src == "object") {
				// take care of handles with multiple icons
				for (var key in HSettings.object.src)
					handle.firstChild.appendChild(this._makeUIObject(HSettings.object.src[key], HSettings.object.mime, key, HSettings.rotation));
			} else {
				handle.firstChild.appendChild(this._makeUIObject(HSettings.object.src, HSettings.object.mime, "all", HSettings.rotation));
			}

			// store the container of the new handle
			if (this.container[or]) {
				// remove old handles and don't reappend existing handles
				this.container[or].parentNode.removeChild(this.container[or]);
				this.container_array[this.container_array.indexOf(this.container[or])] = handle;
			} else {
				this.container_array.push(handle);
			}

			handle.addEventListener(
				jQuery.browser.mozilla ? "DOMMouseScroll" : "mousewheel",
				function(evt) { handleScrolling(evt, img.parentNode); },
				false);

			this.container[or] = handle;
			container_new.push(handle);
		}

		if (container_new.length) {
			container_new = $(container_new);

			// we need at least 2 parent nodes to the image
			if (img.parentNode === document.body) {
				var div = document.createElement("div");
				document.body.insertBefore(div, img);
				div.appendChild(img);
			}

			// ensure that the 2nd parent has no 'static' position
			with (img.parentNode.parentNode) {
				if (!style.position.equals("relative", "absolute", "fixed"))
					style.position = "relative";
			}

			// append the new handles
			this.img.parent().parent().append(container_new);

			var nav = this;
			container_new[container_new.length - 1].firstChild.lastChild.addEventListener("load",
				function(evt) {
					this.removeEventListener(evt.type, arguments.callee, evt.bubbles);
					nav.resize();
					if (GlobalSettings.debug < 2)
						container_new
							.hover(Navigator._onmouseover, Navigator._onmouseout)
							.css("display", "");
					if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8)
						container_new.find("object").css("display", "");

					for (var or in options)
						nav.bind(or, "click", options[or]);

				}, false);

			// clear caches and store the Navigator object on the containers
			this._handleUIObjects = null;
			this._handleSVGObject = null;
			container_new.data(Navigator._dataKey, this);
		}

		return this;
	},

	/**
	  @return Retrieves the handle icon set.
	  @type jQuery
	  @param {Number|String|Node|jQuery} A handle container (posssibly wrapped
	    in a {@link jQuery}), an orientation, or a container index
	  @member Navigator
	*/
	getHandleUIObjectGroup: function(i) {
		if (i instanceof jQuery) i = i[0];
		return $((typeof i == "object" && typeof i.className == "string") ?
			(this.container_array.contains(i) ? i.firstChild.childNodes : []) :
			((typeof i == "number") ? this.container_array : this.container)[i].firstChild.childNodes)
	},

	/**
	  @return An object of key-value-pairs of all handle icon sets keyed by
	    their orientation.
	  @type Object
	  @member Navigator
	*/
	getHandleUIObjectGroups: function() {
		if (this._handleUIObjectGroups === null) {
			this._handleUIObjectGroups = {};
			for (var or in this.container)
				this._handleUIObjectGroups[or] = this.getHandleUIObjectGroup(or);
		}
		return this._handleUIObjectGroups;
	},

	/**
	  @return An SVG object with all SVG nodes relevant for (scaling)
	    transformations.
	  @type SVG
	*/
	getHandleSVGObject: function() {
		if (this._handleSVGObject === null) {
			var handleUI = this.getHandleUIObjectGroups(),
				svg = new Array();
			for (var or in handleUI)
				for (var i=handleUI[or].length-1; i >= 0; i--) {
					if (SVG.isSVGObject(handleUI[or][i]))
						svg.push(Navigator.getRelevantSVGNode(handleUI[or][i]));
				}
			this._handleSVGObject = new SVG(svg);
		}
		return this._handleSVGObject;
	},

	/**
	  Binds a href string or an event handler with a callback method to a handle
	  and its icon.
	  @param {String|Object} orientation An object with all arguments of this
	    function as properties, or an orientation string
	  @param {String} type The event type to listen to
	  @param {Function} callback The event handler
	  @param {Boolean} [useCapture=false] The 3rd argument of
	    {@link Node.addEventListener}
	  @return <code>this</code>
	  @type Navigator
	  @member Navigator
	*/
	bind: function(orientation, type, callback, useCapture) {
		if (typeof orientation == "object") {
			type = orientation.type;
			callback = orientation.callback;
			useCapture = orientation.useCapture;
			orientation = orientation.orientation;
		}

		if (callback && this.container[orientation]) {
			useCapture = Boolean(useCapture);
			if (typeof callback == "string") {
				this.container[orientation].href = callback;
				callback = Navigator._redirect;
			}

			this.container[orientation].addEventListener(type, callback, useCapture);
			var handleUI = this.getHandleUIObjectGroup(orientation);
			if (handleUI) for (var i=handleUI.length-1; i >= 0; i--) {
				if (SVG.isSVGObject(handleUI[i])) {
					handleUI[i].contentDocument.documentElement.addEventListener(type, Navigator.forwardEvent, useCapture);
					handleUI[i].contentDocument.documentElement.style.cursor = "pointer";
				}
			}
		}
		return this;
	},

	/**
	  Displays an overlay box with the image dimensions.
	  @return <code>this</code>
	  @type Navigator
	  @member Navigator
	*/
	drawDimension: function() {
		var natDim = this.img.naturalDimensions();
		if (!this.dimensionDisplay) {
			this.dimensionDisplayBg = document.createElement("div");
			this.dimensionDisplayBg.className = "image-dimension-background";
			this.root[0].appendChild(this.dimensionDisplayBg);

			//this.root.append(this.dimensionDisplay = $('<div class="image-dimension"><span>'+ natDim.width + '\u00d7' + natDim.height + '</span><span/></div>'));
			this.dimensionDisplay = document.createElement("div");
			this.dimensionDisplay.className = "image-dimension";
			this.dimensionDisplay.innerHTML = "<span>" + natDim.width + "\u00d7" + natDim.height + "</span><span/>"
			this.root[0].appendChild(this.dimensionDisplay);
		}
		this.dimensionDisplay.lastChild.textContent = (natDim.width !== this.img[0].width || natDim.height !== this.img[0].height) ? " @ " + this.img[0].width + "\u00d7" + this.img[0].height : "";
		this.dimensionDisplayBg.textContent = this.dimensionDisplay.textContent;
		return this;
	},

	/**
	  Creates a new icon element with the given source/data and class attributes.
	  If the MIME type is not supported by the <img> tag, use <object> instead.
	  @param {String} src The <code>src</code> attribute
	  @param {String} mime The MIME <code>type</code> attribute
	  @param {String} [className] The <code>class</code> attribute
	  @param {Number} [rotation] Applies an SVG rotation of
	    <code>rotation</code> &times; 90° for browsers that don't support CSS
	    rotation.
	  @return The image/object node
	  @type Node
	  @member Navigator
	  @private
	*/
	_makeUIObject: function(src, mime, className, rotation) {
		var objectTag;
		var pos = mime.indexOf("/");
		if (pos === -1 || mime.substring(0, pos) == "image" && Navigator.imageMimeTypes.contains(mime.substring(pos + 1))) {
			objectTag = document.createElement("img");
			objectTag.src = src;
		} else {
			if (jQuery.browser.opera && jQuery.browser.majorVersion < 9.8) {
				objectTag = document.createElement("iframe");
				objectTag.setAttribute("frameborder", "0");
				objectTag.scrolling = "no";
				objectTag.src = src;
			} else {
				objectTag = document.createElement("object");
				objectTag.type = mime;
				if (jQuery.browser.msie) objectTag.innerHTML = '<param name="wmode" value="transparent"/>';
				objectTag.data = src;
			}
			if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) objectTag.style.display = "inline";

			if (rotation && !jQuery.support.transform)
				objectTag.addEventListener("load", function(evt) {
					this.removeEventListener(evt.type, arguments.callee, evt.bubbles);
					if (SVG.isSVGObject(objectTag)) {
						var l1 = new SVG(Navigator.getRelevantSVGNode(objectTag));
						if (!l1[0]) alert("debug!");debugger;
						l1.insertBefore("rotate",
							l1[0].transform.baseVal.numberOfItems - 1,
							rotation * 90, l1.doc.width.baseVal.value / 2, l1.doc.height.baseVal.value / 2);
					} else alert("debug!");debugger;
				}, false);
				/*0,  // TAG:SVGloaded-waitamount - for Firefox 3.1 or earlier and Opera raise this value, if the left handle points to the right (this is the amount of milliseconds to wait until the SVG content finished loading)
				objectTag, rotation * 90);*/

			if (!GlobalSettings.scroll.horizontalMouseWheelPresent || objectTag.tagName.toLowerCase() == "iframe") {
				var img = this.img[0];
				objectTag.addEventListener("load", function(evt) {
					this.removeEventListener(evt.type, arguments.callee, evt.bubbles);
					objectTag.contentDocument.addEventListener(jQuery.browser.mozilla ? "DOMMouseScroll" : "mousewheel",
						function(evt) {
							handleScrolling(evt, img.parentNode);
						}, false);
				}, false);
			}
		}
		if (className) objectTag.className = className;
		return objectTag;
	},

	/**
	  Adapts all handles to the current image dimensions.
	  @return <code>this</code>
	  @type Navigator
	  @member Navigator
	*/
	resize: function() {
		var img = this.img[0],
			parent = img.parentNode,
			handleContraintsRatio = 1,
			style = {}, r = {},

			// retrieve the image viewport dimension and offset (we don't want the handles to scroll out of view)
			v = {
				width:  Math.min(img.width, parent.clientWidth),
				height: Math.min(img.height, parent.clientHeight),
				offset: this.img.offset(img.offsetParent)
			};

		var handles = $(Navigator.classNames.handle.css, parent.parentNode);
		for (var or in this.container) {
			var settings = GlobalSettings.handles[or];

			// calculate and apply the absolute handle position and dimension
			style.top    = v.offset.top + v.height * settings.offsetTop;
			style.left   = v.offset.left + v.width * settings.offsetLeft + (or == "right");
			style.height = v.height * settings.ratioVert;
			style.width  = v.width * settings.ratioHoriz;
			for (var key in style)
				this.container[or].style[key] = style[key].px();

			// look for the greatest scaling ratio that keeps all icons within the bounds of their handle
			var handleUI = this.getHandleUIObjectGroup(or);
			if (handleUI) for (var i=handleUI.length-1; i >= 0; i--) {
				if (SVG.isSVGObject(handleUI[i])) {
					r.width = handleUI[i].contentDocument.documentElement.width.baseVal.value;
					r.height = handleUI[i].contentDocument.documentElement.height.baseVal.value;
				} else {
					alert("debug!");debugger;
					$.extend(r, handleUI.eq(0).naturalDimensions());
				}
				if (settings.rotation.odd()) switchValues(r, "width", "height");
				handleContraintsRatio = Math.min(handleContraintsRatio, style.width / r.width, style.height / r.height);
			}
		}

		var changed = Math.deviation(handleContraintsRatio, this._currentScale.ratio) >= 0.01;
		// we must rescale, if the required ratio is different from the current ratio
		if (changed) {
			if (!this._currentScale.transform) {
				this._currentScale.transform = this.getHandleSVGObject().unshiftScale(handleContraintsRatio);
			} else {
				this.getHandleSVGObject().changeScale(0, handleContraintsRatio);
			}
		}

		if (changed || jQuery.browser.opera) {
			// the SVG ransformation does not affect <object>, <embed>, or <img> tags; recalculate their dimensions
			r.width = {};
			r.height = {};
			var handleUI = this.getHandleUIObjectGroups();
			for (var or in handleUI) {
				for (var i=handleUI[or].length-1; i >= 0; i--) {
					if (SVG.isSVGObject(handleUI[or][i])) {
						parseCSSLength(r.width, handleUI[or][i].contentDocument.documentElement.width.baseVal);
						parseCSSLength(r.height, handleUI[or][i].contentDocument.documentElement.height.baseVal);
					} else {
						alert("debug!");debugger;
						var natDim = handleUI[or].eq(0).naturalDimensions();
						parseCSSLength(r.width, natDim.width);
						parseCSSLength(r.height, natDim.height);
					}
					if (GlobalSettings.handles[or].rotation.odd()) switchValues(r, "width", "height");
					handleUI[or][i].style.width = (r.width.value * handleContraintsRatio).toUnit(r.width.unit || "px");
					handleUI[or][i].style.height = (r.height.value * handleContraintsRatio).toUnit(r.height.unit || "px");

					// Opera (10) does somehow not correctly understand 'width' and 'height'
					if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) {
						if (or.equals("left", "right", "center"))
							handleUI[or][i].style.top = ((this.container[or].clientHeight - handleUI[or][i].clientHeight) / 2).px();
						if (or.equals("top", "bottom", "center"))
							handleUI[or][i].style.left = ((this.container[or].clientWidth - handleUI[or][i].clientWidth) / 2).px();
					}
				}
			}
			this._currentScale.ratio = handleContraintsRatio;
		}

		if (GlobalSettings.image.showDimensions) this.drawDimension();

		return this;
	}
});

Navigator.classNames = "jquery-ui-navigator";
jQuery.extend(Navigator, {
	/**
	  The key used to store Navigator objects on DOM elements
	*/
	_dataKey: "plugin-navigator",

	/**
	  Names of methods that can be invoked through jQuery.fn.navigator
	*/
	_publicMethods: ["add", "resize", "bind"],

	/**
	  Stores all Navigator objects in the current context.
	*/
	navigators: new Array(),

	/**
	  Commonly supported MIME types for <img> tags
	*/
	imageMimeTypes: ["jpeg", "gif", "png", "bmp", "x-ms-bmp"],

	/**
	  Common mouse-over event handler for navigation handles. It makes them fade
	  in and fade out after some time.
	  @member Navigator
	  @private
	*/
	_onmouseover: function() {
		this.firstChild.style.visibility = "visible";
		var o = $(this).stop().fadeTo(jQuery.fx.speeds._default * GlobalSettings.handleSettings.speedfactor, GlobalSettings.handleSettings.opacity);

		if (GlobalSettings.handleSettings.hideAfter > 0) {
			setTimeout(
				function(o, Navigator) { Navigator._onmouseout.call(o); },
				GlobalSettings.handleSettings.hideAfter,
				o, Navigator);
		}
	},

	/**
	  Common mouse-out event handler for navigations handles. It makes them fade
	  out.
	  @member Navigator
	  @private
	*/
	_onmouseout: function() {
		$(this).stop().fadeTo(jQuery.fx.speeds.slow * GlobalSettings.handleSettings.speedfactor, 0,
			function() { this.firstChild.style.visibility = ""; });
	},

	/**
	  Redirects the browser to the link target of the event target. It prevents
	  the default behaviour.
	  @param [evt] Then event object
	  @return <code>false</code>
	  @type Boolean
	  @member Navigator
	  @private
	*/
	_redirect: function(evt) {
		if (GlobalSettings.debug) {
			alert(this.href);
		} else {
			window.location.href = this.href;
		}
		if (evt) evt.preventDefault();
		return false;
	},

	/**
	  Forwards an event of an enclosed document to its enclosing node in the
	  parent document.
	  @param evt Then event object to forward
	  @return The forwarded event object
	  @member Navigator
	*/
	forwardEvent: function(evt) {
		var handles = $(Navigator.classNames.handle.css);
		for (var i=handles.length-1; i >= 0; i--) {
			var children = handles[i].firstChild.childNodes;
			for (var j=children.length-1; j >= 0; j--) {
				if (children[j].contentDocument === evt.target.ownerDocument) {
					var myevent;
					if (evt.type.contains("mouse", "click")) {
						myevent = document.createEvent("MouseEvent");
						myevent.initMouseEvent(evt.type, evt.bubbles, evt.cancelable, window,
							evt.detail, evt.screenX, evt.screenY, evt.clientX, evt.clientY,
							evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, evt.button, evt.relatedTarget);
					} else {
						myevent = document.createEvent("Event");
						myevent.initEvent(evt.type, evt.bubbles, evt.cancelable);
					}
					myevent = children[j].dispatchEvent(myevent);
					if (!myevent) evt.preventDefault();
					return myevent;
				}
			}
		}
	},

	/**
	  @return The first SVG group node for a navigation handler.
	  @type Node
	  @param {Node} obj The node containing the SVG document
	  @member Navigator
	*/
	getRelevantSVGNode: function(obj) {
		// look up the first SVG group node (assumingly this is layer 1)
		return obj.contentDocument.evaluate(
				"//svg:g",
				obj.contentDocument,
				SVG.lookupNamespaceURIDefault,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue;
	},

	/**
	  The class names used to identify various navigator elements
	  @type Object
	  @member Navigator
	*/
	classNames: {
		root: Navigator.classNames,
		handle: Navigator.classNames + "-handle"
	}
});
(function() {
	for (var key in Navigator.classNames) {
		Navigator.classNames[key] = {
			0: Navigator.classNames[key],
			css: "." + Navigator.classNames[key],
			prefix: Navigator.classNames[key] + "-"
		};
	}

	// CSS rules used by navigators
	addStyle(
		Navigator.classNames.handle.css+" { display: table; position: absolute; cursor: pointer; opacity: " + ((GlobalSettings.debug < 2) ? 0 : 0.5) +  "; }",
		Navigator.classNames.handle.css+" > * { display: table-cell; visibility: " + ((GlobalSettings.debug < 2) ? "hidden" : "visible") + "; }",
		Navigator.classNames.handle.css+" > * > * { overflow: hidden; display: none; max-width: 100%; max-height: 100%; }",

		Navigator.classNames.handle.css+"-right > * { vertical-align: middle; text-align: right; }",
		Navigator.classNames.handle.css+"-left > * { vertical-align: middle; text-align: left; }",
		Navigator.classNames.handle.css+"-top > * { vertical-align: top; text-align: center; }",
		Navigator.classNames.handle.css+"-bottom > * { vertical-align: bottom; text-align: center; }",
		Navigator.classNames.handle.css+"-center > * { vertical-align: middle; text-align: center; }",

		".image-dimension, .image-dimension-background { position: absolute; top: 1em; right: 1em; text-align: right; padding: 0.2em 0.3em; font-size: 85%; }",
		".image-dimension { color: #FF942B; }",
		".image-dimension-background { color: #222; background-color: #222; opacity: 0.5; border-radius: 0.25em; -moz-border-radius: 0.25em; -webkit-border-radius: 0.25em; -khtml-border-radius: 0.25em; -o-border-radius: 0.25em; }"
	);

	if (jQuery.browser.opera && jQuery.browser.majorVersion >= 9.8) {
		addStyle(
			Navigator.classNames.handle.css+" > * { position: relative; }",
			Navigator.classNames.handle.css+" > * > * { position: absolute; }",
			Navigator.classNames.handle.css+"-right > * > * { right: 0; }",
			Navigator.classNames.handle.css+"-left > * > * { left: 0; }",
			Navigator.classNames.handle.css+"-top > * > * { top: 0; }",
			Navigator.classNames.handle.css+"-bottom > * > * { bottom: 0; }"
		);
	}

	// CSS rules for rotated handle icons
	var s = Navigator.classNames.handle.css+" .all";
	for (var or in GlobalSettings.handles) with (GlobalSettings.handles[or]) {
		if (rotation) {
			var deg = (rotation * 90).deg();
			addStyle(
Navigator.classNames.handle.css + "-" + or + " > * > * {\n\
	transform: rotate("+deg+");\n\
	-moz-transform: rotate("+deg+");\n\
	-webkit-transform: rotate("+deg+");\n\
	-khtml-transform: rotate("+deg+");\n\
	-o-transform: rotate("+deg+");\n\
	filter: progid:DXImageTransform.Microsoft.BasicImage(rotation="+rotation+");\n\
}");
		}

		// CSS rules for handle with multiple icons
		if (typeof object.src == "object") {
			for (var key in object.src)
				 s += ",\n" + Navigator.classNames.root.css + "." + key + " > ." + Navigator.classNames.handle.prefix + or + " ." + key;
		}
	}
	s += "\n\t{ display: inline; }";
	addStyle(s);
})();



/**
  <p>Polls the image object until its dimensions are known. Then calculates the
  available space and stores the corresponding cycle class names to the future
  navigator root element.</p>
  <p>Additionally it registers an event handler for window resizing that invokes
  {@link resizeImage}.</p>
  @param evt Indicates to the function, that it is used as an event handler
    (i. e. when polling ready state changes or resizing). <em>You should set
    this to <code>null</code>!</em>
  @param {Node|jQuery} [img] The image node to put nagivators on. <em>You must
    set this, when
  @param {Number} [timeout] The next timeout interval length (if any)
*/
function adjustImage(evt, img, timeout) {
	if (!img || img instanceof jQuery && !img.length) return false;
	img = $(img);
	var natDim = img.naturalDimensions();

	// check if we have the dimensions
	if (natDim.width) {
		var navigator_options = {
			right: document.getElementById("nextBar").href,
			left: document.getElementById("prevBar").href,
		};

		if (natDim.width >= 100 && natDim.height >= 100)
			addStyle("#prevBar, #nextBar { display: none; }");

		if (natDim.width > img[0].parentNode.clientWidth * GlobalSettings.image.maxWidthRatio)
			$(img[0].parentNode.parentNode).addClass("big");
		img.maxDimWorkaround();

		if (natDim.width > img[0].parentNode.clientWidth * GlobalSettings.image.maxWidthRatio || natDim.height > img.getMaxHeight().toFloat()) {
			// the image is larger than the default scaled size
			navigator_options.center = resizeImage;

			// choose the display modes (as style class names)
			if (img[0].parentNode.clientWidth < natDim.width) {
				img[0].parentNode.parentNode.cycleClasses = GlobalSettings.image.classes.fit;
			} else {
				img[0].parentNode.parentNode.cycleClasses = GlobalSettings.image.classes.noFit;
				// rearrange the center handle icon order
				GlobalSettings.handles.center.object.src.scaled = GlobalSettings.handles.center.object.src["fit-width"];
				delete GlobalSettings.handles.center.object.src["fit-width"];
			}

			arguments.callee.registerResizeHandler(img);
		} else {
			arguments.callee.registerResizeHandler(img);
		}

		// make image background white (for transparent images)
		if (!img[0].complete && evt == "timeout") {
			img.load(function() { img.addClass("loaded"); });
		} else {
			img.addClass("loaded");
		}

		img.navigator("add", navigator_options);

	} else if (evt == "timeout") {
		// increase (or set) the new polling interval
		timeout = defaultMin(
			timeout * GlobalSettings.image.polling.increaseFactor,
			GlobalSettings.image.polling.minInterval);

		if (timeout <= GlobalSettings.image.polling.maxInterval) {
			// set next poll
			window.setTimeout(adjustImage, timeout.floor(), evt, img, timeout);
		} else {
			/*
			  As the ultimate solution after exceeding the maximum polling intervall,
			  set a "load" event handler. We don't want to restart polling afterwards
			  (therefore the above check for 'if (evt == "timeout")').
			*/
			img.load(function(evt) {
				adjustImage(evt, img);
				img.navigator("resize");
			});
		}
	}
}

adjustImage.registerResizeHandler = function(img) {
	window.addEventListener("resize",
		function(evt) {
			changeCSSRulesOnResize(img);
			adjustImage(evt);
		},
		false);
};

function changeCSSRulesOnResize(img) {
	var oldMaxHeight = img[0].navigatorMaxHeight,
		newMaxHeightPx = img.getMaxHeight();
	if (Math.deviation(oldMaxHeight, img[0].navigatorMaxHeight) >= 0.01)
		changeCSSRule(
			addStyle.css.parentNode.sheet,
			Navigator.classNames.root.css+".scaled #"+img[0].id,
			"max-height", newMaxHeightPx);
}

/**
  Prepares the image for the use with navigators. That means, to unregister
  existing events, add a few CSS rules and check the image dimensions.
*/
function prepareImage() {
	var img = document.getElementById("image");
	if (img) {
		// we need both methods for cross browser compatibility
		img.onclick = undefined;
		img.removeAttribute("onclick");

		var img_id = "#" + img.id,
			imgC_id = "#" + img.parentNode.id;
		img = $(img);

		addStyle(
			imgC_id+" { margin: 1em 0 !important; text-align: center; }",
			Navigator.classNames.root.css+" iframe { border: 0; }",
			Navigator.classNames.root.css+".scaled "+img_id+" { max-height: " + img.getMaxHeight() + "; max-width: " + GlobalSettings.image.maxWidthRatio.percent() + "; }",
			Navigator.classNames.root.css+".fit-width.big "+imgC_id+" { margin-top: " + (img[0].parentNode.parentNode.clientWidth * (1 - GlobalSettings.image.maxWidthRatio) / 2).px() + " !important; }",
			Navigator.classNames.root.css+".fit-width "+img_id+" { max-height: none; max-width: " + GlobalSettings.image.maxWidthRatio.percent() + "; }",
			Navigator.classNames.root.css+".full.big "+imgC_id+" { margin-top: 0 !important; }",// max-height: " + (window.innerHeight * 0.95).px() + "; }",
			//Navigator.classNames.root.css+".full.big "+img_id+" { border: 0; }",
			img_id+" { margin: 0 !important; display: inline !important; cursor: auto !important }",
			img_id+".loaded { background-color: white; }"
		);

		img.removeClass(GlobalSettings.image.classes.fit.join(" "));
		img[0].parentNode.addEventListener(jQuery.browser.mozilla ? "DOMMouseScroll" : "mousewheel", handleScrolling, false);
		$(img[0].parentNode.parentNode).addClass(GlobalSettings.image.classes["default"]);
		adjustImage("timeout", img);
	}
}

/**
  Handles a resize event. That can either be a window resizing or a click on the
  center navigator handle.
  @param evt The event object
*/
function resizeImage(evt) {
	if (evt.currentTarget === window && evt.type == "resize") {
		// window resizing: resize all navigators
		for (var i=Navigator.navigators.length-1; i >= 0; i--) {
			var nav = Navigator.navigators[i];
			nav.root[(nav.img[0].naturalWidth > nav.img[0].parentNode.clientWidth * GlobalSettings.image.maxWidthRatio) ? "addClass" : "removeClass"]("big");
			nav.img.maxDimWorkaround();
			nav.resize();
		}

		/*if (Navigator.navigators.length === 1) with (Navigator.navigators[0]) {
			if (img[0].height > img[0].parentNode.clientHeight || img[0].width > img[0].parentNode.clientWidth)
				img[0].parentNode.focus();
			window.scroll(0, img[0].parentNode.parentNode.previousSibling.offsetTop);
		}*/

	} else {
		// click on center handle: cycle Navigator root element classes and resize navigators
		var nav = $(evt.currentTarget).navigator(),
			img = nav.img;
		nav.root.cycleClass();
		img.maxDimWorkaround();
		nav.resize();

		// additionally, scroll the image into the view and focus the image container for easier key-based scrolling
		if (!nav.root.hasClass("scaled")) {
			window.scroll(0, nav.root[0].previousSibling.previousSibling.offsetTop);
			if (img[0].height > img[0].parentNode.clientHeight || img[0].width > img[0].parentNode.clientWidth)
					img[0].parentNode.focus();
		}
	}
}

/**
  Creates a <code>&lt;link&gt;</code> tag in the <code>&lt;head;</code> section
  based on the given parameters.
  @param {String} rel The link name (its <code>rel</code> or <code>rev</code>
    attribute)
  @param {String} href The link reference
  @param {String} [title] The link title
  @param {Boolean} [backward=false] Indicate a backward relation by using the
    <code>rev</code> instead of the <code>rel</code> attribute.
  @return The link node
  @type Node
*/
function createLogicLink(rel, href, title, backward) {
	var link = document.createElement("link");
	link[backward ? "rev" : "rel"] = rel;
	link.href = href;
	if (title) link.title = title;
	document.getElementsByTagName("head")[0].appendChild(link);
	return link;
}

/**
  Creates logical references and the corrensponding <code>&lt;link&gt;</code>
  tags.
  @param {Object} A set of pairs relating node IDs to link names; the logical
    references are constructed based on these.
*/
function createLinks(links) {
	for (var id in links) {
		var a = document.getElementById(id);
		a.rel = links[id];

		var title;
		if (a.title.toLowerCase().startsWith(links[id])) {
			title = a.href.substring(a.href.lastIndexOf("/") + 1);
		} else if (a.title) {
			title = a.title;
		} else {
			title = $("*[title]:first", a)[0];
			title = title ? title.title : null;
		}

		createLogicLink(links[id], a.href, title);
	}
}

/**
  A scrolling handler for horizontal scrolling when no 2nd mouse wheel is
  present
*/
function handleScrolling(evt, target) {
	if (evt.target.ownerDocument !== document || !GlobalSettings.scroll.horizontalMouseWheelPresent && evt.altKey && (evt.axis === undefined || evt.axis === evt.VERTICAL_AXIS))
	{
		var delta = evt.wheelDelta ? evt.wheelDelta / -120 : evt.detail.sign()
		var horizontally = (evt.axis === undefined) ? evt.altKey :
				GlobalSettings.scroll.horizontalMouseWheelPresent ?
					evt.axis === evt.HORIZONAL_AXIS :
					evt.altKey;

		scrollSmoothly(
			horizontally ?
				target || ((evt.target.ownerDocument === document) ?
					evt.currentTarget :
					document.getElementById("imageContainer")) :
				window,
			GlobalSettings.scroll.length / GlobalSettings.scroll.count * delta,
			GlobalSettings.scroll.count,
			horizontally,
			GlobalSettings.scroll.interval);
		evt.preventDefault();
	}
}

/**
  Scrolls an object smoothly in multiple steps.
  @param {Node} target The object to scroll
  @param {Number} step The scroll step size in pixels
  @param {Number} count The remaining scroll steps
  @param {Boolean} horizontally Scroll horizontally instead of vertically?
  @param {Number} interval The scroll step interval length in milliseconds
*/
function scrollSmoothly(target, step, count, horizontally, interval) {
	if (count > 0) {
		if (Function.isFunction(target.scrollBy)) {
			if (horizontally) {
				target.scrollBy(step, 0);
			} else {
				target.scrollBy(0, step);
			}
		} else {
			target[horizontally ? "scrollLeft" : "scrollTop"] += step;
		}
		setTimeout(scrollSmoothly, interval, target, step, count - 1, horizontally, interval);
	}
}

/**
  Handles special keyboard shortcuts, i. e. submitting the comment form or
  completing a user name.
*/
function CommentWindowsKeyPressHandlerFunction(evt) {
	switch (evt.keyCode) {
		case 13:  // DOM_VK_RETURN
			if (evt.ctrlKey && this.value) {
				evt.preventDefault();
				SubmitCommentForm(this);
				return false;
			}
			break;

		case 9:  // DOM_VK_TAB
			if (this.selectionStart > 0 && this.selectionStart === this.selectionEnd) {
				evt.preventDefault();
				CompleteUsername(this);
				return false;
			}
			break;

		default:
			if (CompleteUsername.usernames) {
				CompleteUsername.usernames.lastPrefix = null;
			}
	}
}

/**
  Submits the comment form just after replacing some text patterns (if selected
  in the options).
  @param {Node} textarea The comment textarea node
*/
function SubmitCommentForm(textarea) {
	if (GlobalSettings.behavior.comments.custom_replacements)
		textarea.value = textarea.value
			.replace(/\.\.\.*/g, "\u2026")
			.replace(/\s*---*\s*/g, "\u2013")
			.replace(/(^|\s)([:;8])([\(\)\[\]\{\}\/\\\|pPDoO])($|\s)/g, "$1$2-$3$4");

	if (textarea.form.elements.addComment != "hidden") {
		var h = textarea.form.elements.addComment.cloneNode(true);
		h.type = "hidden";
		h.removeAttribute("class");
		textarea.form.elements.addComment.name += "-button";
		textarea.form.appendChild(h);
	}
	textarea.form.submit();
}

/**
  Performs user name completion in a textarea.
  @param {Node} textarea The textarea to work on
*/
function CompleteUsername(textarea) {
	var u = arguments.callee.usernames;
	if (!u) {
		u = arguments.callee.usernames = {
			//u: null,
			map: new Object(),
			lastPrefix: null,
			//lastIndex: null,
			//lastStart: null,
			userHrefRegexp: /(?:^|\/)user\/[^\/]+\/?$/,
			prefixRegexp: /@?([^\s@]+)$/
		};
		u.u = $.map($(".userInfo .name a, .commentHead a"), function(a, i) {
				if (u.userHrefRegexp.test(a.href)) {
					var n = a.textContent.trim(),
						l = n.toLowerCase();
					u.map[l] = n;
					return l;
				}
				return null;
			})
			.unique(String.compareIgnoreCase);
	}

	if (u.u.length) {
		//alert("debug!");debugger;
		if (!u.lastPrefix) {
			u.lastPrefix = textarea.value.substring(0, textarea.selectionStart).match(u.prefixRegexp);
			if (!u.lastPrefix) return;
			u.lastPrefix = u.lastPrefix[1];
			u.lastStart = textarea.selectionStart - u.lastPrefix.length;
			u.lastIndex = -1;
		}

		if (u.lastIndex !== null) {
			u.lastIndex = u.u.findPrefix(u.lastPrefix, u.lastIndex + 1, true, false);
			if (u.lastIndex !== -1) {
				var username = u.map[u.u[u.lastIndex]];
				textarea.value = textarea.value.substring(0, u.lastStart)
					+ username + textarea.value.substring(textarea.selectionStart);
				textarea.selectionEnd = textarea.selectionStart = u.lastStart + username.length;
				return username;
			}
			// else
			u.lastIndex = null;
		}
	}
}

/**
  Prefetches an image on lowbird.
  @param {String} The ID of a link element prefixed by a hash, the URI of the
    image page, or the image itself
*/
function prefetchImage(uri) {
	if (uri.charCodeAt(0) === 0x23) { // 0x23 == "#"
		uri = document.getElementById(uri.substring(1));
		if (!(uri && uri.nodeName == "A")) return;
		uri = uri.getAttribute("href");
	}
	if (uri.contains("/view/") && (!uri.contains("://") || uri.startsWith(location.protocol + "//" + location.host + "/"))) {
		$.get(uri, arguments.callee.getImageByPage, "html");
	} else if (uri.contains("/data/images/")) {
		arguments.callee.getImageByUri(uri);
	}
}
prefetchImage.getImageByUri = function(uri) {
	var img = new Image();
	img.src = uri;
	return img;
};
prefetchImage.getImageByPage = function(page, status) {
	if (page) {
		var doc = $(page)[0].ownerDocument;
		if (doc) {
			var img = doc.getElementById("image");
			if (img)
				return prefetchImage.getImageByUri(img.src);
		}
	}
};


changeCSSRule("html", "height", null);

(function(font) {
	if (font) {
		if (font === true)
			font = "sans-serif";

		addStyle(
			'body, textarea, input { font-family: '+font+'; }',
			"#imageInfo { line-height: 140%; }",
			"input.button { border-color: #666; }",
			".comment { overflow: auto; }"
		);
	}
})(GlobalSettings.page.style.changeFont);

/*
  The following anonymous function unleashes the action of this script upon loading.
*/
$(function() {
	// (re)move a few page elements based on global settings
	if (GlobalSettings.page.teaser == "hide") {
		$(".teaser:first").remove();
	} else if (GlobalSettings.page.teaser == "move end") {
		$(".teaser:first")
			.find("script").remove().end()
			.insertAfter(".comments:first").css("margin-top", "3em");
	}
	if (GlobalSettings.page.navigation == "hide")
		$(".center:first").remove();

	// create logical links (even though unfortunately no major browser uses them by default)
	createLinks({
		prevBar: "prev",
		nextBar: "next",
		home: "start"
	});

	// start creating navigators
	prepareImage();

	with ($("form.addComment:first")[0]) {
		if (!id) {
			id = "addCommentForm";
		} else {
			alert("debug!");debugger;
			if (globalSettings.debug) alert("The commentary form already has the ID \"" + id + "\".");
		}
	}
	document.forms.addCommentForm.elements.content.addEventListener("keydown", CommentWindowsKeyPressHandlerFunction, false);

	// replace the default tag submit behaviour because it doesn't clear the new tag field afterwards
	GlobalSettings.image.id = new XPathSearch().evaluate("@onsubmit", document.forms.addTag, XPathResult.STRING_TYPE).result.stringValue.match(/\d{3,}/)[0].toInt();
	document.forms.addTag.onsubmit = undefined;
	document.forms.addTag.removeAttribute("onsubmit");
	document.forms.addTag.elements.save.onclick = undefined;
	document.forms.addTag.elements.save.removeAttribute("onclick");
	document.forms.addTag.elements.save.type = "submit";
	document.forms.addTag.addEventListener("submit", function(evt) {
		addTags(GlobalSettings.image.id, this.elements.tagText);
		this.elements.tagText.value = "";
		evt.preventDefault();
	}, false);

	// prefetch images
	if (GlobalSettings.prefetch.previousImage) prefetchImage("#prevBar");
	if (GlobalSettings.prefetch.nextImage) prefetchImage("#nextBar");
});

}


/**
  Binds a javascript node with a remote source into the page header.
  @param {String} src The URI of the script
  @param {String} [data] If this argument is a string, the script content is
    set to the string instead of loading it from <code>src</code>.
  @param {Function} [callback] The callback for when the script is loaded or
    <code>condition</code> is <code>false</code>.
  @param {Boolean} [condition] Must be <code>true</code> to load the script;
    otherwise only the callback is invoked.
  @return The script node (if any)
*/
function load_script(src, data, callback, condition) {
	if (typeof data == "function") {
		condition = callback;
		callback = data;
		data = null;
	}

	if (condition) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		if (typeof data == "string") {
			script.textContent = data;
			if (typeof callback == "function")
				callback(true);
		} else {
			if (typeof callback == "function")
				script.addEventListener("load", callback, false);
			script.src = src;
		}
		document.documentElement.firstChild.appendChild(script);
		return script;
	} else if (typeof callback == "function") {
		callback(false);
	}
}


load_script(
	(window.location.protocol == "file:") ? "jquery.js" : "http://gold-gru.be/js/jquery.js",
	function(condition) {
		if (condition !== false) {
			jQuery.noConflict();
			run(jQuery);
		}
	},
	!window.jQuery);

})();
