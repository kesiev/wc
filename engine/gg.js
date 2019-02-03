// --- Resources loader and generator

var GG=function(tox,resources,then) {
	var loading;
	if (!tox) tox={};
	if (!tox._LOG) tox._LOG={};
	function done(data) {
		tox[loading.as||loading.gimmie]=data;
		getResource();
	}
	function getResource() {
		if (resources.length) {
			loading=resources.splice(0,1)[0];
			GG.stuff[loading.gimmie](loading,tox,done);
		} else then(tox);
	}
	getResource();
}
GG.stuff={};

// --- Constants

GG.NOAUDIO=false; // Set TRUE to disable audio features
GG.FLOATPERCENT=GG.COIN={min:0,max:1};
GG.PERCENT={min:0,max:100};
GG.ISFIREFOX=navigator.userAgent.toLowerCase().indexOf("firefox") > -1;	
GG.ISTOUCH=!!('ontouchstart' in window || navigator.maxTouchPoints);
GG.PI=Math.PI;
GG.DEGTORAD=GG.PI/180;

// --- Utilities

GG.getTimestamp=function() { return (new Date()).getTime(); };
GG.addEventListener=function(node,evt,cb,rt) {
	if (node.addEventListener) node.addEventListener(evt,cb,rt);
	else node.attachEvent("on"+evt,cb)
}
GG.htmlColor=function(color,a) { return "rgba("+color[0]+","+color[1]+","+color[2]+","+(a==undefined?color[3]:a)+")"; }
GG.limit=function(val,range) { return val<range.min?range.min:val>range.max?range.max:val }
GG.exceed=function(val,range) { return (val<range.min)||(val>range.max) }
GG.animate=function(timer,speed,frames) { return Math.floor((timer/speed)%frames)}
GG.alternate=function(timer,speed,set) { return set[Math.floor((timer/speed)%set.length)] }
GG.randomNumber=function(range) { return range.min+Math.floor(Math.random()*(range.max-range.min+1)) }
GG.randomElement=function(set) { return set[Math.floor(Math.random()*set.length)] }
GG.randomDrawElement=function(set) { return set.splice(Math.floor(Math.random()*set.length),1)[0] }
GG.randomGetElements=function(amo,set) {
	var out=[];
	if ((amo>0)&&(set.length)) {
		var ids=[];
		for (var i=0;i<set.length;i++) ids.push(i);
		while (out.length<amo) {
			out.push(set[GG.randomDrawElement(ids)]);
			if (!ids.length) break;
		}
	}
	return out;
}
GG.randomPercent=function(pct) { return pct?(Math.random()*100)<pct:0 }
GG.randomDecide=function(set) {
	var pos=Math.floor(Math.random()*100);
	for (var i=0;i<set.length;i++)
		if (pos<set[i].probability)
			return set[i];
	return set[set.length-1];
}
GG.proportionPercent=function(pct,range) { return Math.floor(range.min+((range.max-range.min)*(pct/100))); }
GG.getElementsPercent=function(min,pct,set) {
	var out=[],elms=Math.floor(set.length*(pct/100));
	if (elms<min) elms=min-1;
	if (elms>=set.length) elms=set.length-1;
	for (var i=0;i<=elms;i++) out.push(set[i]);
	return out;
}
GG.merge=function(a,b) {
	for (var i in a) b[i]=a[i];
	return b;
}
GG.generateResourcesList=function(g,out) {
	if (!out) out=[];
	for (var a in g._LOG) out.push(a);
	return out;
}

// --- RESOURCES

// --- Installer

GG.stuff.installer=function(cfg,res,done) {
	var deferredInstall;
	if ('serviceWorker' in navigator) {
		if (!navigator.serviceWorker.controller) {
		  navigator.serviceWorker.register('worker.js', { scope: './'}).then(function(reg) {
		    console.log('Service worker has been registered for scope: '+ reg.scope);
		  });
		  window.addEventListener('beforeinstallprompt', function(e) {
				e.preventDefault();
				deferredInstall = e;
			});
		}	
	}
	done({
		automatic:cfg.automatic,
		canInstall:function() {
			return !!deferredInstall;
		},
		install:function() {
			if (this.canInstall())
				deferredInstall.prompt().then(function() {
					return deferredInstall.userChoice;
				}).then(function(choice) {
					deferredInstall=0;
				}).catch(function(reason) {
					deferredInstall=0;
				});
		}
	});
}

// --- Storage

GG.stuff.storage=function(cfg,res,done) {
	done({
		id:cfg.id,
		load:function(key,def) {
			key=this.id+"_"+key;
			if (localStorage[key]==undefined)
				return def;
			else
				return JSON.parse(localStorage[key]);
		},
		save:function(key,value) {
			localStorage[this.id+"_"+key]=JSON.stringify(value);			
		}
	});
}

// --- Debug panel

GG.stuff.debug=function(cfg,res,done) {
	var indicators={};
	var panel=document.createElement("div");
	panel.style="position:absolute;right:0;top:0;padding:10px;background-color:#000;color:#fff;font-size:10px;width:200px;z-index::1000";
	for (var id in cfg.sliders) {
		var interface={
			id:id,
			label:document.createElement("span"),
			slider:document.createElement("input"),
			set:function(value) {
				this.label.innerHTML=this.id+": "+value;
				this.slider.value=value;
				this.value=value;
			}
		};
		var range=cfg.sliders[id].max-cfg.sliders[id].min;
		interface.slider.min=cfg.sliders[id].min;
		interface.slider.max=cfg.sliders[id].max;
		interface.slider.step=range/1000;
		interface.slider.type="range";
		interface.slider.style.width="200px";
		panel.appendChild(interface.label);
		panel.appendChild(interface.slider);
		interface.slider.interface=interface;
		interface.slider.oninput=function() { this.interface.set(this.value*1)}
		interface.set(cfg.sliders[id].min+(range/2));
		indicators[id]=interface;
	}
	document.body.appendChild(panel);
	done(indicators);
}

// --- Canvas

GG.stuff.canvas=function(cfg,res,done) {
	var cnv=document.createElement("canvas");		
	cnv.width=cfg.width;
	cnv.height=cfg.height;
	cnv.style.MozOsxFontSmoothing="grayscale";
	if (GG.ISFIREFOX)
		cnv.style.imageRendering="-moz-crisp-edges";
	else {
		cnv.style.imageRendering="pixelated";
		cnv.style.fontSmoothing="none";
	}
	var ctx=cnv.getContext("2d");
	ctx.webkitImageSmoothingEnabled = ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.oImageSmoothingEnabled = ctx.msImageSmoothingEnabled= false;
	done({
		width:cfg.width,
		height:cfg.height,
		cnv:cnv,
		ctx:ctx,
		clear:function() { cnv.width=this.width },
		blit:function(from,x1,y1,w,h,x2,y2,frame,sx,sy,angle) {
			if (!frame) frame=0;
			x1+=frame*(2+w);
			if (!sx&&!sy&&!angle)
				ctx.drawImage(from.cnv,x1,y1,w,h,Math.floor(x2),Math.floor(y2),w,h);
			else {
				var hx=w/2,hy=h/2;
				if (sx==undefined) sx=1;
				if (sy==undefined) sy=1;			
				ctx.save();
				ctx.transform(sx,0,0,sy,Math.floor(x2+hx), Math.floor(y2+hy));
				ctx.rotate(angle*GG.DEGTORAD);
				ctx.translate(-hx,-hy);
				ctx.drawImage(from.cnv,x1,y1,w,h,0,0,w,h);
				ctx.restore();
			}
		},
		blitInto:function(from,x1,y1,w,h,x2,y2,w2,h2,frame,sx,sy,angle) {
			if (!frame) frame=0;
			x1+=frame*(2+w);
			if (!sx&&!sy&&!angle)
				ctx.drawImage(from.cnv,x1,y1,w,h,Math.floor(x2),Math.floor(y2),Math.floor(w2),Math.floor(h2));
			else {
				var hx=w2/2,hy=h2/2;
				if (sx==undefined) sx=1;
				if (sy==undefined) sy=1;			
				ctx.save();
				ctx.transform(sx,0,0,sy,Math.floor(x2+hx), Math.floor(y2+hy));
				ctx.rotate(angle*GG.DEGTORAD);
				ctx.translate(-hx,-hy);
				ctx.drawImage(from.cnv,x1,y1,w,h,0,0,w2,h2);
				ctx.restore();
			}
		},
		blitCanvas:function(canvas,x2,y2,frame,sx,sy,angle) {
			this.blit(canvas,0,0,canvas.width,canvas.height,x2,y2,frame,sx,sy,angle);
		},
		blitSprite:function(sprite,x2,y2,frame,sx,sy,angle) {
			if (!frame) frame=0;
			this.blit(sprite.canvas,(sprite.x*sprite.scale)+((sprite.gap+sprite.width)*frame),sprite.y*sprite.scale,sprite.width,sprite.height,x2,y2,0,sx,sy,angle);
		},
		blitSpriteInto:function(sprite,x2,y2,w2,h2,frame,sx,sy,angle) {
			if (!frame) frame=0;
			this.blitInto(sprite.canvas,(sprite.x*sprite.scale)+((sprite.gap+sprite.width)*frame),sprite.y*sprite.scale,sprite.width,sprite.height,x2,y2,w2,h2,0,sx,sy,angle);
		},
		print:function(font,color,x,y,text,align) {
			text+="";
			var dx=0,chr;
			y=Math.floor(y);
			x=Math.floor(x);
			switch (align) {
				case 1:{
					dx-=text.length*font.lw;
					break;
				}
				case 2:{
					dx-=Math.floor(text.length*font.lw/2);
					break;
				}
			}
			for (var i=0;i<text.length;i++) {
				chr=text.charCodeAt(i)-font.fl;
				ctx.drawImage(font.canvas.cnv,font.lw*(chr%font.cpr),(color.id*font.gap)+(Math.floor(chr/font.cpr)*font.lh),font.lw,font.lh,x+(i*font.lw)+dx,y,font.lw,font.lh);
			}
		},
		rect:function(color,x,y,width,height) {
			ctx.fillStyle=color.html;
			ctx.fillRect(Math.floor(x),Math.floor(y),Math.floor(width),Math.floor(height));
		}
	});
}

// --- Game screen

GG.stuff.screen=function(cfg,res,done) {
	var screenScale=-1,screenLeft=screenTop=0;
	var nextFrame=0,resizeTimer=10,events={down:0,hitPoint:{x:0,y:0}};
	var verticalAlign=cfg.verticalAlign==undefined?3:cfg.verticalAlign;
	var fps=cfg.fps==undefined?25:cfg.fps;
	var mspf=Math.floor(1000/fps);
	var tapTime=Math.ceil(fps/2);
	var installer=res.installer&&res.installer.automatic?res.installer:0;
	if (cfg.wallpaper) res._LOG[cfg.wallpaper]=1;
	GG.stuff.canvas(cfg,res,function(screen){
		if (cfg.backgroundColor) screen.cnv.style.backgroundColor=GG.htmlColor(cfg.backgroundColor);
		screen.fps=fps;
		screen.resize=function(){
			if (screenScale<0) document.body.appendChild(this.cnv);
			var pageWidth=document.body.clientWidth,
				pageHeight=document.body.clientHeight;
			var 
				proportion=pageHeight>pageWidth?verticalAlign:2,
				xratio=pageWidth/this.width,
				yratio=pageHeight/this.height;
			if (xratio*this.height<pageHeight) screenScale=xratio;
			else screenScale=yratio;
			this.cnv.style.display="block";
			this.cnv.style.position="absolute";
			this.cnv.style.transformOrigin="0 0";
			screenLeft=Math.floor((pageWidth-(screenScale*this.width))/2);
			screenTop=Math.floor((pageHeight-(screenScale*this.height))/proportion);
			this.cnv.style.left=screenLeft+"px";
			this.cnv.style.top=screenTop+"px";
			this.cnv.style.transform="scale("+screenScale+")";
			document.body.style.backgroundImage=(screenLeft>16)||(screenTop>16)?"url("+cfg.wallpaper+")":"none";
		}		
		function pointerDown(point) {
			if (installer) {
				installer.install();
				installer=0;
			}
			events.hitMove=point;
			events.hitPoint=point;
			events.isDown=true;
			events.hitDown=true;
			events.drag={start:point,timer:0,deltaX:0,deltaY:0,delta:0};
		}
		function pointerMove(point) {
			events.hitMove=point;
			if (events.drag) {
				events.drag.deltaX=point.x-events.drag.start.x;
				events.drag.deltaY=point.y-events.drag.start.y;
				events.drag.delta=Math.hypot(events.drag.deltaX,events.drag.deltaY);
				if (events.drag.delta>10) events.drag.dragging=true;
				if (events.drag.dragging) {
					events.drag.angle=Math.atan2(events.drag.deltaX, events.drag.deltaY) * 180 / Math.PI;
					if (events.drag.angle<0) events.drag.angle+=360;
				}
			}
		}		
		function pointerUp(point) {
			events.hitMove=point;
			events.isDown=false;
			events.hitUp=true;
			if (events.drag) {
				events.drag.end=point;		
				if (events.drag.timer<tapTime)
					events.tap=point;
			}
		}
		function run() {
			if (resizeTimer) {
				resizeTimer--;
				screen.resize();
			}
			var now=GG.getTimestamp();
			if (now>nextFrame) {
				if (events.isDown)
					events.down++;
				else
					events.down=0;
				if (screen.run) screen.run(events);
				delete events.hitPoint;
				delete events.hitDown;
				delete events.hitUp;
				delete events.tap;
				if (events.drag)
					if (events.drag.end)
						delete events.drag;
					else events.drag.timer++;
				nextFrame=Math.ceil(now/mspf)*mspf;
			}
			window.requestAnimationFrame(run);
		}
		window.requestAnimationFrame(run);
		GG.addEventListener(window,"resize",function(e) { resizeTimer=10; });
		if (GG.ISTOUCH) {
			GG.addEventListener(document.body,"touchstart",function(e) {
				var touch=e.changedTouches[0];
				pointerDown({x:Math.floor((touch.clientX-screenLeft)/screenScale),y:Math.floor((touch.clientY-screenTop)/screenScale)});
				e.preventDefault();
				return false;
			},{passive:false});
			GG.addEventListener(document.body,"touchmove",function(e) {
				var touch=e.changedTouches[0];
				pointerMove({x:Math.floor((touch.clientX-screenLeft)/screenScale),y:Math.floor((touch.clientY-screenTop)/screenScale)});
				e.preventDefault();
				return false;
			},{passive:false});
			GG.addEventListener(document.body,"touchend",function(e) {
				var touch=e.changedTouches[0];
				pointerUp({x:Math.floor((touch.clientX-screenLeft)/screenScale),y:Math.floor((touch.clientY-screenTop)/screenScale)});
			},{passive:false});
		} else {
			GG.addEventListener(document.body,"keydown",function(e) { if (e.keyCode==32&&!events.isDown) pointerDown({x:events.hitMove.x,y:events.hitMove.y}); });
			GG.addEventListener(document.body,"keyup",function(e) { if (e.keyCode==32&&events.isDown) pointerUp({x:events.hitMove.x,y:events.hitMove.y}); });
			GG.addEventListener(document.body,"mousedown",function(e) { pointerDown({x:Math.floor((e.clientX-screenLeft)/screenScale),y:Math.floor((e.clientY-screenTop)/screenScale)}); });
			GG.addEventListener(document.body,"mousemove",function(e) { pointerMove({x:Math.floor((e.clientX-screenLeft)/screenScale),y:Math.floor((e.clientY-screenTop)/screenScale)}); });
			GG.addEventListener(document.body,"mouseup",function(e) { pointerUp({x:Math.floor((e.clientX-screenLeft)/screenScale),y:Math.floor((e.clientY-screenTop)/screenScale)}); });
		}
		screen.cnv.setAttribute("tabIndex", 1);
		screen.cnv.style.outline="none";
		done(screen);
		setTimeout(function(){screen.cnv.focus()},100);
	})	
}

// --- Spritesheets

GG.stuff.spriteSheet=function(cfg,res,done) {
	var img=document.createElement("img");
	var scale=cfg.scale?cfg.scale:1;
	img.style.visibility="hidden";
	img.style.position="absolute";
	img.style.top="-10000px";
	img.src=cfg.file;
	res._LOG[cfg.file]=1;
	img.onload=function() {
		GG.stuff.canvas({
			width:img.width*scale,
			height:img.height*scale
		},res,function(sprites){			
			sprites.ctx.drawImage(img,0,0,img.width,img.height,0,0,img.width*scale,img.height*scale);
			sprites._list=[];
			for (var a in cfg.sprites) {
				sprites._list.push(a);
				sprites[a]={
					canvas:sprites,
					x:cfg.sprites[a].x,
					y:cfg.sprites[a].y,
					scale:scale,
					gap:2*scale,
					width:cfg.sprites[a].width*scale,
					height:cfg.sprites[a].height*scale
				}
			}
			document.body.removeChild(img);
			done(sprites);
		})
	}
	document.body.appendChild(img);
}

// --- Masked sprite sheets

GG.stuff.maskedSpriteSheet=function(cfg,res,done) {
	var from=res[cfg.from||"spriteSheet"];
	var fromPalette=res[cfg.fromPalette||"palette"];
	var pixelcolor=fromPalette[cfg.toColor].rgba;
	var fromColor=cfg.fromColor?fromPalette[cfg.fromColor].rgba:0;
	GG.stuff.canvas({
		width:from.width,
		height:from.height
	},res,function(canvas){
		var spr,pixel;
		canvas.ctx.drawImage(from.cnv,0,0);
		var canvasData=canvas.ctx.getImageData(0,0,canvas.width,canvas.height);
		for (var x=0;x<canvas.width;x++)
			for (var y=0;y<canvas.height;y++) {
				var replace=false;
				pixel=(x+(y*canvas.width))*4;
				if (fromColor)
					replace=(
						(canvasData.data[pixel]==fromColor[0])&&
						(canvasData.data[pixel+1]==fromColor[1])&&
						(canvasData.data[pixel+2]==fromColor[2])
					);
				else
					replace=!!canvasData.data[pixel+3];				
				if (replace) {
					canvasData.data[pixel]=pixelcolor[0];
					canvasData.data[pixel+1]=pixelcolor[1];
					canvasData.data[pixel+2]=pixelcolor[2];
				}
			}
		canvas.ctx.putImageData(canvasData,0,0);
		for (var i=0;i<from._list.length;i++) {
			spr=from._list[i];
			canvas[spr]={}
			for (var a in from[spr])
				canvas[spr][a]=from[spr][a];
			canvas[spr].canvas=canvas;
		}
		done(canvas);
	});	
}

// --- Pixel fonts

GG.stuff.font=function(cfg,res,done) {
	var pixel,pixelcolor,pixelout;
	var charsPerRow=cfg.width/cfg.charWidth;
	var charsPerCol=cfg.height/cfg.charHeight;
	var lw=cfg.charWidth*cfg.scaleX,lh=cfg.charHeight*cfg.scaleY,gap=cfg.height*cfg.scaleY;
	var palette=res[cfg.palette];

	if (cfg.from==undefined) cfg.from="spriteSheet";
	GG.stuff.canvas({
		width:cfg.width*cfg.scaleX,
		height:gap*palette.colorSet.length
	},res,function(canvas){
		var canvasData=canvas.ctx.getImageData(0,0,canvas.width,canvas.height);
		var fromData=res[cfg.from].ctx.getImageData(cfg.x,cfg.y,cfg.width,cfg.height).data;
		for (var l=0;l<charsPerRow;l++)
			for (var s=0;s<charsPerCol;s++)
				for (var c=0;c<palette.colorSet.length;c++)
					for (var y=0;y<cfg.charHeight;y++)
						for (var x=0;x<cfg.charWidth;x++) {
							pixel=(
								(l*cfg.charWidth)+x+
								((s*cfg.charHeight)+y)*cfg.width
							)*4;
							pixelcolor=fromData[pixel]?palette.colorSet[c].rgba:[0,0,0,0];
							for (var sx=0;sx<cfg.scaleX;sx++)
								for (var sy=0;sy<cfg.scaleY;sy++) {
									pixelout=(
										(l*lw)+(x*cfg.scaleX)+sx+
										((c*gap)+(s*lh)+(y*cfg.scaleY)+sy)*canvas.width
									)*4;
									canvasData.data[pixelout]=pixelcolor[0];
									canvasData.data[pixelout+1]=pixelcolor[1];
									canvasData.data[pixelout+2]=pixelcolor[2];
									canvasData.data[pixelout+3]=Math.floor(pixelcolor[3]*255);
								}
						}					
		canvas.ctx.putImageData(canvasData,0,0);
		done({lw:lw,lh:lh,fl:cfg.firstLetter.charCodeAt(0),cpr:charsPerRow,gap:gap,canvas:canvas});
	});
}

// --- Color palette

GG.stuff.palette=function(cfg,res,done) {
	var palette={colorSet:[]};
	for (var a in cfg.colors) {
		var color={id:palette.colorSet.length,rgba:cfg.colors[a],html:GG.htmlColor(cfg.colors[a])};
		palette.colorSet.push(color);
		palette[a]=color;
	}
	done(palette)
}

// --- State machine

GG.stuff.states=function(cfg,res,done) {
	done({
		delay:0,
		state:-1,
		nextState:-1,
		timer:0,
		goto:function(state,delay){
			if (state!=this.state) {
				this.delay=delay||0;
				this.nextState=state;
			}
		},
		run:function(e){
			if (this.delay) this.delay--;
			else {
				if (this.state!=this.nextState) {
					if (this[this.state]&&this[this.state].onExit) this[this.state].onExit(this);
					this.state=this.nextState;
					if (this[this.state]&&this[this.state].onEnter) this[this.state].onEnter(this);
					this.timer=0;
				}				
				if (this[this.state]&&this[this.state].run) this[this.state].run(this,e);
				this.timer++;
			}
		}
	})
}

// --- Audio player

GG.stuff.audioPlayer=function(cfg,res,done) {
	var audioContext=audioOut=0;
	if (window.AudioContext)
		audioContext=new window.AudioContext();
	else if (window.webkitAudioContext)
		audioContext=new window.webkitAudioContext();
	if (audioContext) {
		audioOut=audioContext.createGain();
		audioOut.connect(audioContext.destination);
		audioOut.gain.value=0.9;
	}
	if (cfg.volume==undefined) cfg.volume=1;
	if (cfg.musicVolume==undefined) cfg.musicVolume=0.8;
	done({
		lastId:0,
		enabled:true,
		volume:cfg.volume,
		musicVolume:cfg.musicVolume,
		audioPlaying:{},
		musicPlaying:0,
		ctx:audioContext,
		setEnabled:function(state) {
			this.enabled=state;
			this.stopAll();			
		},
		makeSample:function(buffer) {
			return {
				id:this.lastId++,
				player:this,
				buffer:buffer,
				play:function(loop,volume) { this.player.play(this,loop,volume) },
				stop:function() { this.player.stop(this) },
				playMusic:function() { this.player.playMusic(this) }
			}
		},
		play:function(sample,loop,volume) {
			if (sample&&sample.buffer&&this.enabled&&audioContext) {
				this.stop(sample);
				var gain=audioContext.createGain();					
				gain.connect(audioOut);
				gain.gain.value=volume||this.volume;
				var source = audioContext.createBufferSource();
				source.buffer = sample.buffer;
			  	source.loop=!!loop;
				source.connect(gain);
				source.start(0);
				this.audioPlaying[sample.id]={gain:gain,source:source};
			}
		},
		playMusic:function(sample) {
			if (sample.id!=this.musicPlaying.id) {
				this.stopMusic();
				this.play(sample,true,this.musicVolume);
				this.musicPlaying=sample;
			}
		},
		stopMusic:function() {
			this.stop(this.musicPlaying)
			this.musicPlaying=0;
		},
		stopAll:function() {
			for (var a in this.audioPlaying)
				this.stop(a);
		},
		stop:function(sample) {
			if (this.audioPlaying[sample.id]) {
				this.audioPlaying[sample.id].source.stop(0);
				this.audioPlaying[sample.id].gain.disconnect();
				this.audioPlaying[sample.id].source.disconnect();
				this.audioPlaying[sample.id]=0;
			}
		}
	})
}

// --- Audio sample

GG.stuff.audioSample=function(cfg,res,done) {
	if (!cfg.for) cfg.for="audioPlayer";
	var player=res[cfg.for];
	if (GG.NOAUDIO) {
		done(player.makeSample(0));
	} else if (cfg.file) {
		res._LOG[cfg.file]=1;
		var request = new XMLHttpRequest();
		request.open('GET', cfg.file, true);
		request.responseType = 'arraybuffer';
		request.onload = function() {					
			player.ctx.decodeAudioData(request.response, function(buffer) {
				done(player.makeSample(buffer))
			}, function(e){
				done(false);
			});
		}	
		request.send();
	} else {
		if (player.ctx) {
			var sampleRate = player.ctx.sampleRate,data={};
			for (var a in this.audioSample.NOISEDEFAULTS) data[a]=this.audioSample.NOISEDEFAULTS[a];
			for (var a in cfg) if (cfg[a]!==undefined) data[a]=cfg[a];
			for (var i=0;i<this.audioSample.NOISETIMES.length;i++) data[this.audioSample.NOISETIMES[i]]*=sampleRate;
			var out,bits,steps,attackDecay=data.attack+data.decay,
				attackSustain=attackDecay+data.sustain,
				samplePitch = sampleRate/data.frequency,
				sampleLength = attackSustain+data.release,	
				tremolo = .9,
				value = .9,
				envelope = 0;    
			var buffer = player.ctx.createBuffer(2,sampleLength,sampleRate);
			for(var i=0;i<2;i++) {
				var channel = buffer.getChannelData(i),
					jump1=sampleLength*data.frequencyJump1onset,
				jump2=sampleLength*data.frequencyJump2onset;
				for(var j=0; j<buffer.length; j++) {
					// ADSR Generator
					value = this.audioSample.NOISEWAVES[data.wave](value,j,samplePitch);
					if (j<=data.attack) envelope=j/data.attack;
					else if (j<=attackDecay) envelope=-(j-attackDecay)/data.decay*(1-data.limit)+data.limit;
					if (j>attackSustain) envelope=(-(j-attackSustain)/data.release+1)*data.limit;
					// Tremolo
					tremolo = this.audioSample.NOISEWAVES.sine(value,j,sampleRate/data.tremoloFrequency)*data.tremoloDepth+(1-data.tremoloDepth);
					out = value*tremolo*envelope*0.9;
					// Bit crush
					if (data.bitCrush||data.bitCrushSweep) {
					    bits = Math.round(data.bitCrush + j / sampleLength * data.bitCrushSweep);
					    if (bits<1) bits=1;
					    if (bits>16) bits=16;
					    steps=Math.pow(2,bits);
					    out=-1 + 2 * Math.round((0.5 + 0.5 * out) * steps) / steps;
					}
					// Done!
					if(out>1) out= 1;
					if(out<-1) out = -1;
					channel[j]=out;
					// Frequency jump
					if (j>=jump1) { samplePitch*=1-data.frequencyJump1amount; jump1=sampleLength }
					if (j>=jump2) { samplePitch*=1-data.frequencyJump2amount; jump2=sampleLength }
					// Pitch
					samplePitch-= data.pitch;
				}
			}
			done(player.makeSample(buffer))
		}	
	}
}

GG.stuff.audioSample.NOISEWAVES={
  whitenoise:function(v,i,p) { return Math.floor((i-1)/(p/2))!=Math.floor(i/(p/2))?Math.random()*2-1:v },
  square:function(v,i,p) { return ((Math.floor(i/(p/2))%-2)*-2)+1 },
  sine:function(v,i,p) { return Math.sin(i*6.28/p) },
  saw:function(v,i,p) { return ((v+1+(2/p)) % 2) - 1},
  triangle:function(v,i,p) { return Math.abs((i % p - (p/2))/p*4)-1 },
  tangent:function(v,i,p) { 
  	v= 0.15*Math.tan(i/p*3.14);
  	if (v<-1) v=-1;
  	if (v>1) v=1;
  	return v;
  },
  whistle:function(v,i,p) { return 0.75 * Math.sin(i/p*6.28) + 0.25 * Math.sin(40 *3.14 * i/p) },
  breaker:function(v,i,p) {
  	v=(i/p) + 0.8660;
    v=v - Math.floor(v);
    return -1 + 2 * Math.abs(1 - v*v*2);
  }
};

GG.stuff.audioSample.NOISETIMES=["attack","sustain","decay","release"];

GG.stuff.audioSample.NOISEDEFAULTS={
  bitCrush:0, // 1-16
  bitCrushSweep:0, // -16 16
  attack:0, // 0-0.3
  sustain:0, // 0-0.4
  limit:0.6, // .2-.6
  decay:0.1, // 0-0.3
  release:0, // 0-0.4
  frequency:850, // 100-1600
  tremoloFrequency:0, // 0-50
  tremoloDepth:0, // 0-1
  frequencyJump1onset:0, // 0-1
  frequencyJump1amount:0, // -1-1
  frequencyJump2onset:0, // 0-1
  frequencyJump2amount:0, // -1-1
  pitch:0 // 0-.002
}