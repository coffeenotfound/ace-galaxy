const resolution = {x: 640, y: 480};

var keyinput = new KeyInput({target: window});
var frameclock = new THREE.Clock(false);

var threeRenderer;

// start game
$(function() {
	init();
	animate();
});

function init() {
	// create stats panel
	this.stats = new Stats();
	this.stats.showPanel(0);
	document.body.appendChild(this.stats.dom);
	
	// create renderer
	threeRenderer = new THREE.WebGLRenderer();
	threeRenderer.setSize(resolution.x, resolution.y);
	
	// init game
	Game.init();
	
	// add to dom
	var domElement = threeRenderer.domElement;
	document.getElementById("game").appendChild(domElement);
}

function animate() {
	// request next frame
	requestAnimationFrame(animate);
	
	// start frameclock
	if(!frameclock.running) {
		frameclock.start();
		frameclock.oldTime = frameclock.startTime;
	}
	
	// begin stats
	stats.begin();
	
	keyinput.poll();
	
	Game.logic();
	Game.draw();
	
	// end stats
	stats.end();
}

// class Game
var Game = {
	currentScene: null,
	
	testgeometry: null,
	testmaterial: null,
	testmesh: null,
	testcamera: null,
	
	init: function() {
		// create scene
		this.currentScene = new Scene();
		
		// create camera
		this.testcamera = new THREE.PerspectiveCamera(75, resolution.x / resolution.y, 0.1, 1000);
		this.testcamera.position.z = 10;
		this.currentScene.activeCamera = this.testcamera;
		
		// create mesh
		this.testgeometry = new THREE.BoxGeometry(10, 10, 10);
		this.testmaterial = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});
		
		this.testmesh = new THREE.Mesh(this.testgeometry, this.testmaterial);
		this.currentScene.threeScene.add(this.testmesh);
	},
	
	logic: function() {
		// wobble camera
		this.testcamera.position.z = 15 + Math.sin((performance.now() / 1000.0)*(2*Math.PI))*1;
		
		// rotate cube
		if(keyinput.isKeyDown(65)) this.testmesh.rotation.y -= 0.01;
		if(keyinput.isKeyDown(68)) this.testmesh.rotation.y += 0.01;
		
		if(keyinput.isKeyDown(87)) this.testmesh.rotation.x += 0.01;
		if(keyinput.isKeyDown(83)) this.testmesh.rotation.x -= 0.01;
	},
	
	draw: function() {
		// render the current scene
		if(this.currentScene != null && this.currentScene.activeCamera != null) {
			threeRenderer.render(this.currentScene.threeScene, this.currentScene.activeCamera);
		}
	},
};

// class Entity
var Entity = function() {};
Entity.prototype = {
	pos: THREE.Vector3(),
	rotation: THREE.Quaternion(),
	vel: THREE.Vector3(),
	angularVel: THREE.Quaternion(),
	
	addForce: function(x, y, z) {
		vel.x += x || 0;
		vel.y += y || 0;
		vel.z += z || 0;
	},
	
	teleport: function(x, y, z) {
		pos.x = x || 0;
		pos.y = y || 0;
		pos.z = z || 0;
	}
};

// class Scene
var Scene = function() {
	this.threeScene = new THREE.Scene();
};
Scene.prototype = {
	threeScene: null,
	entities: [],
	activeCamera: null,
};

// class ArcballCamera
var ArcballCamera = function(arcDistance) {
	THREE.Camera.apply(this);
	
	this.arcDistance = arcDistance;
}
ArcballCamera.prototype = Object.create(THREE.Camera.prototype);
ArcballCamera.prototype.constructor = ArcballCamera;
ArcballCamera.prototype = Object.assign(Object.create(THREE.PerspectiveCamera.prototype), {
	arcDistance: 1.0,
	
	updateProjectionMatrix: function() {
		var near = this.near;
		var top = near * Math.tan(_Math.DEG2RAD * 0.5 * this.fov ) / this.zoom;
		var height = 2 * top;
		var width = this.aspect * height;
		var left = - 0.5 * width;
		var view = this.view;
		
		if(view !== null) {
			var fullWidth = view.fullWidth, fullHeight = view.fullHeight;
			left += view.offsetX * width / fullWidth;
			top -= view.offsetY * height / fullHeight;
			width *= view.width / fullWidth;
			height *= view.height / fullHeight;
		}
		
		var skew = this.filmOffset;
		if ( skew !== 0 ) left += near * skew / this.getFilmWidth();
		
		this.projectionMatrix.makeFrustum(left, left + width, top - height, top, near, this.far );
	},
});
