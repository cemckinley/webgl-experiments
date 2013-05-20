
var photoViewer3D = {
	
	init: function(){
		var self = this;
		
		// config
		this.options = {
			width: window.innerWidth,
			height: window.innerHeight,
			fov: 50,
			aspect: window.innerWidth / window.innerHeight,
			near: 1,
			far: 1100,
			sceneRadius: 600,
			sphereRadius: 60,
			sphereCount: 24,
			sampleInterval: 100,
		};
		
		// vars
		this.mouseDown = false;
		this.speedSampleInterval = '';
		this.prevLon = 0;
		this.speedSample = 0;
		this.momentumInterval = '';
		this.cameraPos = {
			lat: 0,
			lon:0,
			mouseX: 0,
			mouseY: 0,
			mouseLat: 0,
			mouseLon: 0,
		};
		this.prevSpherePos = {}; // used later to store sphere position before zooming in on it
		this.prevCameraPos = {}; // used later to store camera position before zooming in on sphere
		this.isZoomedIn = false;
		this.zoomedSphere = {};
		this.photoCredits = [
			'<a href="http://www.flickr.com/photos/gadl/468497275/">Carousel de Montmarte</a> by Flickr user gadl',
			'<a href="http://www.flickr.com/photos/19333679@N00/6881338337/">Takayama</a> - by Flickr user thumeau',
			'<a href="http://www.flickr.com/photos/rbs/4665503654/">View of Toronto From Above</a> by Flickr user Robert Snache',
			'<a href="http://www.flickr.com/photos/gadl/821306549/">First Lap</a> by Flickr user gadl',
			'<a href="http://www.flickr.com/photos/rbs/5141412269/">Equirectangular Sunset at Moonlight Bay, Rama First Nation</a> by Flickr user Robert Snache',
			'<a href="http://www.flickr.com/photos/boltron/2412744905/">St Ludmilla Equirectangular Panorama in Prague</a> by Flickr user boltron',
			'<a href="http://www.flickr.com/photos/gadl/445650878/">Statue of Liberty</a> by Flickr user gadl',
			'<a href="http://www.flickr.com/photos/gadl/2753524910/">Cathédrale Saint-Pierre</a> by Flickr user gadl',
			'<a href="http://www.flickr.com/photos/gadl/395079578/">La caverne aux livres</a> by Flickr user gadl',
			'<a href="http://www.flickr.com/photos/gadl/1406145118/">Sunrise on Tintamarre 2</a> by Flickr user gadl',
			'<a href="http://www.flickr.com/photos/heiwa4126/4230239021/">Prince Arisugawa memorial park</a> by Flickr user heiwa4126',
			'<a href="http://www.flickr.com/photos/vitroids/3166857052/">Barber</a> by Flickr user vitroid',
			'<a href="http://www.flickr.com/photos/heiwa4126/4230901516/">Asagaya Star Festival 2009</a> by Flickr user heiwa4126',
			'<a href="http://www.flickr.com/photos/heiwa4126/4231019374/">Mei-dai square</a> by Flickr user heiwa4126',
			'<a href="http://www.flickr.com/photos/heiwa4126/4230137291/">The steepest sloop in Tokyo</a> by Flickr user heiwa4126',
			'<a href="http://www.flickr.com/photos/heiwa4126/522856869/">Some feet go through the night</a> by Flickr user heiwa4126',
			'<a href="http://www.flickr.com/photos/heiwa4126/3771428309/">Shinjuku Kabuki-cho Crossing</a> by Flickr user heiwa4126',
			'<a href="http://www.flickr.com/photos/mrzeon/6078437068/">IntegrArte office complex</a> by Flickr user Daniel Dionne',
			'<a href="http://www.flickr.com/photos/jannefoo/6797601975/">Patakukkulan/Tarinaharjun 2</a> by Flickr user Janne',
			'<a href="http://www.flickr.com/photos/vitroids/2661815233/">Castle</a> by Flickr user vitroid',
			'<a href="http://www.flickr.com/photos/jannefoo/6816885865/">Talvinen yömaisema</a> by Flickr user Janne',
			'<a href="http://www.flickr.com/photos/ppopp/2676301961/">築地丸武</a> by Flickr user pop★',
			'<a href="http://www.flickr.com/photos/gadl/403173357/">Notre-Dame de Paris</a> by Flickr user gadl',
			'<a href="http://www.flickr.com/photos/heiwa4126/4230184413/">A tailor of the Edo era</a> by Flickr user heiwa4126'
		];
		
		// element refs
		this.container = document.querySelector('#container');
		this.backLink = document.querySelector('#backLink');
		this.photoCredit = document.querySelector('#photoCredit');
		
		// components
		this.renderer = new THREE.WebGLRenderer();
		this.camera = new THREE.PerspectiveCamera(this.options.fov, this.options.aspect, this.options.near, this.options.far);
		this.scene = new THREE.Scene();
		this.projector = new THREE.Projector();
		this.spheres = []; // created in this.createMeshes()
		
		// setup
		this.setStage();
		this.addLights();
		this.createMeshes();
		this.renderer.render(this.scene, this.camera);
		this.preloadImages(); // preload large images after spheres rendered so it doesnt block page)
		this.continuousRender();
		this.moveCamera();
		
		// event listeners
		document.addEventListener('mousedown', function(e){
			e.preventDefault();
			self.onMouseDown(e);
		});
		document.addEventListener('mousemove', function(e){
			self.onMouseMove(e);
		});
		document.addEventListener('mouseup', function(e){
			e.preventDefault();
			self.onMouseUp(e);
		});
		this.backLink.addEventListener('click', function(e){
			e.preventDefault();
			self.onBackLinkClick();
		});
	},
	
	// preload large images in background for zoomed in state
	preloadImages: function(){
		var imgInLoop;
		
		for(var i = 1, len = this.options.sphereCount; i <= len; i++){
			imgInLoop = new Image();
			imgInLoop.src = '_ui/img/large/' + i + '.jpg';
		}
	},
	
	setStage: function(){
		this.renderer.setSize(this.options.width, this.options.height);
		this.container.appendChild(this.renderer.domElement);
		
		this.camera.position.y = 0;
		this.camera.target = new THREE.Vector3(0,0,0);
		this.scene.add(this.camera);
		
		this.plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 10, 10), new THREE.MeshLambertMaterial({color: 0xffffff}));
		this.plane.receiveShadow = true;
		this.plane.overdraw = true;
		this.plane.dynamic = true;
		this.plane.rotation.x = -Math.PI/2;
		this.plane.position.y = -100;
		this.scene.add(this.plane);
	},
	
	addLights: function(){
		this.spotlight = new THREE.SpotLight(0xffffff, 1.0);
		this.spotlight.position.set( 0, 1500, 0 );
		this.spotlight.shadowDarkness = 0.2;
		this.spotlight.castShadow = true;
		this.renderer.shadowMapEnabled = true;
		
		this.scene.add(this.spotlight);
	},
	
	// create spheres			
	createMeshes: function(){
		var radius = this.options.sphereRadius,
			segments = 60,
			rings = 40,
			sphereCount = this.options.sphereCount,
			angleInterval = 360 / sphereCount,
			phi,
			sphereMaterial,
			sphereGeometry;
			
		for(var i = 0, len = sphereCount; i < len; i++){ // create ring of spheres
			phi = (angleInterval * i) * (Math.PI / 180); // convert current angle in ring to radians
			
			sphereMaterial = new THREE.MeshBasicMaterial({map: THREE.ImageUtils.loadTexture('_ui/img/thumb/' + (i + 1) + '.jpg')}),
			sphereGeometry = new THREE.SphereGeometry(radius, segments, rings);
			this.spheres.push(new THREE.Mesh(sphereGeometry, sphereMaterial));
			
			this.spheres[i].position.x = this.options.sceneRadius * Math.sin(phi);
			this.spheres[i].position.z = this.options.sceneRadius * Math.cos(phi);
			this.spheres[i].rotation.y = phi;
			this.spheres[i].castShadow = true;
			this.spheres[i].doubleSided = true;
			this.spheres[i].index = i;
			this.scene.add(this.spheres[i]);
		}
	},
	
	// continuous requestAnimationFrame - any time element properties (i.e. position) is updated, it will automatically get rendered
	continuousRender: function(){
		var self = this;
		
		requestAnimationFrame(function(){
			self.continuousRender();
		});
		TWEEN.update(); // update any tweening vals
		this.renderer.render(this.scene, this.camera);
	},
	
	onMouseDown: function(e){
		var self = this;
		
		this.mouseDown = true;
		
		this.cameraPos.mouseX = e.clientX;
		this.cameraPos.mouseY = e.clientY;
		
		this.cameraPos.mouseLon = this.cameraPos.lon; // reset mouse x & y on mousedown to last known coordinates of mouse move
		this.cameraPos.mouseLat = this.cameraPos.lat;
		
		if(!this.isZoomedIn){
			clearInterval(this.momentumInterval);
			this.speedSample = 0;
			this.speedSampleInterval = setInterval(function(){
				self.readSpeed(self.cameraPos.lon);
			}, this.options.sampleInterval);
		}
	},
	
	onMouseMove: function(e){
		if(this.mouseDown){
			this.cameraPos.lon = (this.cameraPos.mouseX - e.clientX) * 0.1 + this.cameraPos.mouseLon;
			
			if(!this.isZoomedIn){
				this.cameraPos.lat = 0;
			}else{
				this.cameraPos.lat = (e.clientY - this.cameraPos.mouseY) * 0.1 + this.cameraPos.mouseLat;
			}
			
			this.moveCamera();
		}
	},
	
	onMouseUp: function(e){
		this.mouseDown = false;
		
		if(!this.isZoomedIn){
			if(Math.abs(e.clientX - this.cameraPos.mouseX) < 3 && Math.abs(e.clientY - this.cameraPos.mouseY) < 3){ // if mouse coords were ~same on mouse down and mouse up (a click, and not a drag)
				this.getSphere(e.clientX, e.clientY);
			}else{
				this.addMomentum();
			}
			clearInterval(this.speedSampleInterval);
		}
	},
	
	// sets new positioning of camera and spheres when called - continuousRender method is running so any updates are automatically rendered to the scene
	moveCamera: function(){
		var phi, theta;
		
		this.cameraPos.lat = Math.max(-85, Math.min(85, this.cameraPos.lat)); // make sure verticle angle stays between 85 and -85 degrees
		phi = (90 - this.cameraPos.lat) * Math.PI / 180; // get vertical angle (in radians)
		theta = this.cameraPos.lon * Math.PI / 180; // get horizontal angle (in radians)
		
		this.camera.target.x = this.options.sceneRadius * Math.sin(phi) * Math.cos(theta);
		this.camera.target.z = this.options.sceneRadius * Math.sin(phi) * Math.sin(theta);
		
		if(this.isZoomedIn){ // allow vertical camera movement only if zoomed into a sphere
			this.camera.target.y = this.options.sceneRadius * Math.cos(phi);
		}
		
		this.camera.lookAt(this.camera.target);
		
		if(!this.isZoomedIn){
			for(var i = 0, len = this.spheres.length; i < len; i++){
				this.spheres[i].rotation.y = -theta;
			}
		}
	},
	
	// called on interval, reads distance of current mouse position to last mouse position to identify speed
	readSpeed: function(newLon){
		var speed = (newLon - this.prevLon) * .1;
		
		if(Math.abs(newLon - this.prevLon) > 3){
			this.speedSample = Math.max(-7, Math.min(7, speed));
		}else{
			this.speedSample = 0;
		}
		this.prevLon = newLon;
	},
	
	// add movement momentum/inertia to end of user's drag action
	addMomentum: function(){
		var self = this;
		
		this.momentumInterval = setInterval(function(){
			if (Math.abs(self.speedSample) > 0.01){
				self.speedSample *= 0.90;
				self.cameraPos.lon += self.speedSample;
				self.moveCamera(); 
			}else{
				clearInterval(self.momentumInterval);
			}
		}, 30);

	},
	
	// if single click detected, identify the sphere clicked on
	getSphere: function(x,y){
		var vector = new THREE.Vector3((x / window.innerWidth) * 2 - 1, - (y / window.innerHeight) * 2 + 1, 0.5),
			ray,
			intersects;
		
		this.projector.unprojectVector(vector, this.camera);
		ray = new THREE.Ray(this.camera.position, vector.subSelf(this.camera.position).normalize());
		intersects = ray.intersectObjects(this.spheres);
		if(intersects.length > 0){
			this.zoomToSphere(intersects[0].object);
		}
	},
	
	// animation to zoom into large sphere view
	zoomToSphere: function(sphere){
		var self = this,
			tween = new TWEEN.Tween(sphere.position).to({x:0,y:0,z:0}, 1000);
		
		sphere.material.map.image.src = sphere.material.map.image.src.replace('thumb', 'large'); // replace thumb image on mesh with high res image
		this.photoCredit.innerHTML = this.photoCredits[sphere.index];
		this.prevSpherePos.x = sphere.position.x;
		this.prevSpherePos.y = sphere.position.y;
		this.prevSpherePos.z = sphere.position.z;
		this.prevCameraPos.lat = this.cameraPos.lat;
		this.prevCameraPos.lon = this.cameraPos.lon;
		this.isZoomedIn = true;
		this.zoomedSphere = sphere;

		tween.easing(TWEEN.Easing.Cubic.EaseOut).onComplete(animationComplete);
		tween.start();
		
		function animationComplete(){
			self.photoCredit.className = 'active';
			self.backLink.className = 'active';
		}
	},
	
	// zoom back out of sphere and take previous position
	onBackLinkClick: function(){
		var self = this,
			cameraTween = new TWEEN.Tween(this.cameraPos).to(this.prevCameraPos, 300),
			sphereTween = new TWEEN.Tween(this.zoomedSphere.position).to(this.prevSpherePos, 500);
		
		this.backLink.className = ('');
		this.photoCredit.className = ('');
		cameraTween.easing(TWEEN.Easing.Exponential.EaseIn).onUpdate(animCamera).onComplete(cameraComplete);
		sphereTween.easing(TWEEN.Easing.Exponential.EaseOut).onComplete(sphereComplete);
		cameraTween.start();
		
		function animCamera(){ // any updates needing to happen per frame go here
			self.moveCamera();
		}
		
		function cameraComplete(){
			sphereTween.start();
		}
		
		function sphereComplete(){
			self.isZoomedIn = false;
			self.zoomedSphere.material.map.image.src = self.zoomedSphere.material.map.image.src.replace('large', 'thumb'); // replace high res image on sphere with thumb
		}
	}
	
	
	// Flickr stuff, doesn't work because of cross-origin/webgl problems
	/*getPhotos: function(){
		var self = this;
		
		 $.ajax({
			url: 'http://api.flickr.com/services/rest/?method=flickr.groups.pools.getPhotos&format=json&nojsoncallback=1&api_key=0af68662529a72d10207451c16db00af&group_id=44671723@N00',
			type: 'GET',
			success: function(data){
				self.loadImages($.parseJSON(data));
			},
			error: function(data){
				//console.log(data);
			}
		});
	},
	
	loadImages: function(data){
		var photo = data.photos.photo[Math.floor(Math.random() * 100)];
		
		this.photos = data.photos.photo;
		this.photoUrl = 'http://farm' + photo.farm + '.staticflickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '.jpg';
		console.log(this.photoUrl);
		this.init();
	}*/
};