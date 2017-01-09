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
	cameraOrbiter: null,
	
	cameraUp: new THREE.Vector3(0.0, 1.0, 0.0),
	
	init: function() {
		// create scene
		this.currentScene = new Scene();
		
		// create camera
		this.testcamera = new THREE.PerspectiveCamera(75, resolution.x / resolution.y, 0.1, 1000);
		this.testcamera.position.z = 10;
		this.currentScene.activeCamera = this.testcamera;
		
		this.cameraOrbiter = new CameraOrbiter(this.testcamera),
		
		// create mesh
		this.testgeometry = new THREE.BoxGeometry(10, 10, 10);
		this.testmaterial = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});
		
		this.testmesh = new THREE.Mesh(this.testgeometry, this.testmaterial);
		this.currentScene.threeScene.add(this.testmesh);
	},
	
	logic: function() {
		// wobble camera
		this.testcamera.position.z = 15 + Math.sin((performance.now() / 1000.0)*(2*Math.PI))*1;
		
		// rotate camera
		//if(keyinput.isKeyDown(65)) Utils.rotateAroundWorldAxis(this.testcamera, this.cameraUp, 0.01);
		//if(keyinput.isKeyDown(68)) Utils.rotateAroundWorldAxis(this.testcamera, this.cameraUp, -0.01);
		
		//if(keyinput.isKeyDown(87)) this.cameraOrbiter.desiredRotation.rotateY(0.01);
		//if(keyinput.isKeyDown(83)) this.cameraOrbiter.desiredRotation.rotateY(-0.01);
		
		Matrix4 mat = new THREE.Matrix4();
		mat.makeRotationFromQuaternion();
		
		
		// update camera controller
		console.log(this.cameraOrbiter);
		this.cameraOrbiter.update(1.0);
		
		/*
		// rotate cube
		if(keyinput.isKeyDown(65)) this.testmesh.rotation.y -= 0.01;
		if(keyinput.isKeyDown(68)) this.testmesh.rotation.y += 0.01;
		
		if(keyinput.isKeyDown(87)) this.testmesh.rotation.x += 0.01;
		if(keyinput.isKeyDown(83)) this.testmesh.rotation.x -= 0.01;
		*/
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
var CameraOrbiter = function(threeCamera) {
	this.threeCamera = threeCamera;
};
CameraOrbiter.prototype = {
	smoothingRot: 0.0,
	smoothingOrbitDist: 0.0,
	
	desiredRotation: new THREE.Quaternion(0.0, 0.0, -1.0, 0.0),
	desiredOrbitDistance: 1.0,
	currentOrbitDistance: 1.0,
	threeCamera: null,
	
	update: function(deltafactor) {
		// lerp rotation
		this.threeCamera.quaternion.slerp(this.desiredRotation, 1.0 - this.smoothingRot);
		
		// lerp orbit dist
		this.currentOrbitDistance = THREE.Math.lerp(this.desiredOrbitDistance, this.currentOrbitDistance, this.smoothingOrbitDist);
	},
};

var Utils = {
	tempRotateWorldMatrix: new THREE.Matrix4(),
	rotateAroundWorldAxis: function(object, axis, radians) {
		rotWorldMatrix = tempRotateWorldMatrix;
		//rotWorldMatrix.identity();
		rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
		rotWorldMatrix.multiplySelf(object.matrix);        // pre-multiply
		object.matrix = rotWorldMatrix;
		object.rotation.getRotationFromMatrix(object.matrix, object.scale);
	},
};