// You don't want to steal this, do you?
var gu=32;var g=null;var gw=6;var gmw=6;
var bd={'b0':{'w':6,'h':9},'b1':{'w':4,'h':6},'b2':{'w':4,'h':3},'b3':{'w':2,'h':3}};
function $(id){return document.getElementById(id)}
function a(b,c){var bw=bd[b.className]['w'];var bh=bd[b.className]['h'];var mh=0;var h=g[0];var sw=0;var sl=0;var fs=new Array();for(var i=0;i<g.length;i++){if(h==g[i]){sw++}if((h!=g[i]||i+1==g.length)&&sw>0){var temp={'w':sw,'l':sl,'h':h};fs.push(temp);sw=1;sl=i}h=g[i];if(h>mh){mh=h}}var th=0;var tl=0;var bs=-1;for(var j=0;j<bw;j++ ){if(g[j]>th){th=g[j]}}for(var i=0;i<fs.length;i++ ){var hs=(mh-fs[i]['h']);var ws=bw/fs[i]['w'];var s=hs*hs+ws*6;if(fs[i]['w']>=bw&&s>bs){th=fs[i]['h'];tl=fs[i]['l'];bs=s}}var nh=th+bh;for(var j=0;j<bw;j++ ){g[tl+j]=nh}c.appendChild(b);b.style.left=(tl*gu)+'px';b.style.top=(th*gu)+'px';for(var i=0;i<g.length;i++){if(g[i]>mh){mh=g[i]}}c.style.height=(mh*gu)+'px';$('images').style.height=(mh*gu)+'px'}
function solve(id){;window.setTimeout("solve('"+id+"')",500);var c=$(id);var nw=parseInt(c.offsetWidth);var ngw=parseInt(nw/gu);ngw=ngw<gmw?gmw:ngw;if(gw==ngw){return;}else{gw=ngw}b=new Array();while(c.hasChildNodes()){e=c.removeChild(c.firstChild);if(e.tagName=='DIV'){b.push(e)}}g=new Array(gw);for(var i=0;i<g.length;i++ ){g[i]=0}for(var i=0;i<b.length;i++){a(b[i],c)}}

function swap(e, c1, c2) { e.className = e.className == c1 ? c2 : c1; };

var ieAdjustCount = 0;
function ieAdjustHeight( oldHeight ) {
	if(
		!document.all || // Moz doesn't need this shit!
		!$('viewer') ||
		(
			$('viewer').scrollHeight < oldHeight + 50 &&
			ieAdjustCount > 10
		)
	) {
		return;
	}
	ieAdjustCount++;
	var newHeight = $('viewer').scrollHeight;
	$('prevBar').style.height = $('viewer').scrollHeight + 'px';
	$('nextBar').style.height = $('viewer').scrollHeight + 'px';
	setTimeout( 'ieAdjustHeight(' + newHeight + ')', 100 );
}

function del( imageId ) {
	if( !confirm( 'Delete this image?' ) ) return false;
	$( 'loadDelete' ).style.display = 'block';
	post(
		$('home').href + 'json.php?delete',
		'id='+imageId,
		function(){
			$( 'loadDelete' ).style.display = 'none';
			$( 'del' ).style.display = 'none';
		}
	);
	return false;
}

function ban( userId, e ) {
	if( !confirm( 'Ban this user?' ) ) return false;
	var cdiv = e.parentNode;
	post(
		$('home').href + 'json.php?banUser',
		'id='+userId,
		function(){
			cdiv.style.display = 'none';
		}
	);
	return false;
}

function delComment( commentId, e ) {
	if( !confirm( 'Delete this comment?' ) ) return false;
	var cdiv = e.parentNode.parentNode.parentNode;
	post(
		$('home').href + 'json.php?deleteComment',
		'id='+commentId,
		function(){
			cdiv.style.display = 'none';
		}
	);
	return false;
}

function addTags( imageId, inputField ) {
	$( 'loadTags' ).style.display = 'block';
	tags = encodeURIComponent(inputField.value);
	post(
		$('home').href + 'json.php?addTags',
		'id='+imageId+'&tags='+tags,
		function(){
			q = ( eval('('+req.responseText+')') );
			if( q.tags ) {
				$('tags').innerHTML = q.tags;
			}
			$('addTag').className='hidden';
			$( 'loadTags' ).style.display = 'none';
		}
	);
	return false;
}


// mouseover for rating stars
function sr( id, scale ) {
	$( id ).style.backgroundPosition = ( (20 * scale) - 100 ) + 'px 0';
}

function rate( imageId, score ) {
	$( 'loadRating' ).style.display = 'block';
	post(
		$('home').href + 'json.php?rate',
		'id='+imageId+'&score='+score,
		function() {
			q = ( eval('('+req.responseText+')') );
			$( 'loadRating' ).style.display = 'none';
			$( 'currentRating' ).style.width = 20 * parseFloat(q.score) + 'px';
			$( 'ratingDescription' ).innerHTML = q.score + ' after ' + q.votes + ' Vote' + ( q.votes > 1 ? 's' : '' );
		}
	);
	return false;
}


function post( url, params, callback ) {
	if (window.ActiveXObject) { // ie
		try {
			req = new ActiveXObject( 'Msxml2.XMLHTTP' );
		}
		catch (e) {
			try {
				req = new ActiveXObject( 'Microsoft.XMLHTTP' );
			}
			catch (e) {}
		}
	}
	else if (window.XMLHttpRequest) { // moz
		req = new XMLHttpRequest();
		req.overrideMimeType( 'text/plain' );
	}
	req.onreadystatechange = function(){
		if (req.readyState == 4 && req.status == 200) {
			callback();
		}
	};

	if( !req ) return false;
	req.open( 'POST', url, true );
	req.setRequestHeader( 'Content-type', 'application/x-www-form-urlencoded; charset=UTF-8' );
	req.setRequestHeader( 'Content-length', params.length );
	req.setRequestHeader( 'Connection', 'close' );
	req.send( params );
}

function s() {
	var q = $( 'q' );
	if( q && q.value ) {
		window.location = $('home').href + 'search/' + encodeURI( q.value );
	}
	return false;
}


function colorpicker( id, size, callback ) {
	var that = this;
	this.size = size;
	this.callback = callback;

	this.mode = 'none';

	this.sv = $(id+'SV');
	this.svselect = $(id+'SVSelect');
	this.h = $(id+'H');
	this.hselect = $(id+'HSelect');
	this.value = $(id+'Value');
	this.current = $(id+'Current');

	this.cap = function( v, min, max ) {
		return Math.min(Math.max(min,v),max);
	}

	this.getMousPos = function( event ) {
		if(event.pageX || event.pageY){
			return {
				'x': event.pageX,
				'y': event.pageY
			};
		}
		return {
			'x': event.clientX + document.body.scrollLeft - document.body.clientLeft,
			'y': event.clientY + document.body.scrollTop  - document.body.clientTop
		};
	}

	this.getObjPos = function( obj ) {
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			curleft = obj.offsetLeft;
			curtop = obj.offsetTop;
			while (obj = obj.offsetParent) {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			}
		}
		return {
			'x':curleft,
			'y':curtop
		};
	}


	this.release = function() {
		document.onmousemove = '';
		this.mode = 'none';
	}

	this.move = function( event ) {
		if( this.mode == 'sv' ) {
			var mouse = this.getMousPos( event );
			var obj = this.getObjPos( this.sv );
			var x = this.cap(mouse.x - obj.x - 4, -4, this.size - 5);
			var y = this.cap(mouse.y - obj.y - 4, -4, this.size - 5);
			this.svselect.style.left = x + "px";
			this.svselect.style.top = y + "px";
		}
		else if ( this.mode == 'h' ) {
			var mouse = this.getMousPos( event );
			var obj = this.getObjPos( this.sv );
			var y = this.cap(mouse.y - obj.y - 2, -2, this.size - 3);
			this.hselect.style.top = y + "px";
			this.sv.style.backgroundColor = '#' + this.rgb2hex(this.hsv2rgb( {'h':1-((y+3)/this.size), 's':1, 'v':1} ));
		}
		else return;

		var hex = this.getHex();
		this.current.style.backgroundColor = '#' + hex;
		this.value.innerHTML = '#' + hex;
		this.callback( this );
	}

	this.sv.onmousedown = function() {
		that.mode = 'sv';
		document.onmousemove = function( event ) { that.move( event ) };
		document.onmouseup = that.release;
	}

	this.h.onmousedown = function() {
		that.mode = 'h';
		document.onmousemove = function( event ) { that.move( event ) };
		document.onmouseup = that.release;
	}


	this.getHSV = function() {
		var svpos = this.getObjPos( this.sv );
		var svselectpos = this.getObjPos( this.svselect );

		var hpos = this.getObjPos( this.h );
		var hselectpos = this.getObjPos( this.hselect );

		return {
			'h': 1 - (this.cap(hselectpos.y - hpos.y + 3, 0, this.size) / this.size),
			's': this.cap(svselectpos.x - svpos.x + 2, 0, this.size) / this.size,
			'v': 1 - (this.cap(svselectpos.y - svpos.y + 4, 0, this.size) / this.size)
		}
	}

	this.getRGB = function() {
		return this.hsv2rgb( this.getHSV() );
	}

	this.getHex = function() {
		return this.rgb2hex( this.getRGB() );
	}

	this.toHex = function(v) { v=Math.round(Math.min(Math.max(0,v),255)); return("0123456789ABCDEF".charAt((v-v%16)/16)+"0123456789ABCDEF".charAt(v%16)); }
	this.rgb2hex = function(c) { return this.toHex(c.r)+this.toHex(c.g)+this.toHex(c.b); }

	this.hsv2rgb = function( c ) {
		var R, B, G, H = c.h, S = c.s, V = c.v;
		if( S>0 ) {
			if(H>=1) H=0;

			H=6*H; F=H-Math.floor(H);
			A=Math.round(255*V*(1.0-S));
			B=Math.round(255*V*(1.0-(S*F)));
			C=Math.round(255*V*(1.0-(S*(1.0-F))));
			V=Math.round(255*V);

			switch(Math.floor(H)) {
				case 0: R=V; G=C; B=A; break;
				case 1: R=B; G=V; B=A; break;
				case 2: R=A; G=V; B=C; break;
				case 3: R=A; G=B; B=V; break;
				case 4: R=C; G=A; B=V; break;
				case 5: R=V; G=A; B=B; break;
			}
			return {'r': (R?R:0), 'g': (G?G:0), 'b': (B?B:0)};
		}
		else
			return {'r': (Math.round(V*255)), 'g': (Math.round(V*255)), 'b': (Math.round(V*255))};
	}
}
