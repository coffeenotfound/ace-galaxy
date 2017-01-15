const resolution = {x: 640, y: 480};

var keyinput;
var frameclock = new THREE.Clock(false);
var framecounter = 0;

var threeRenderer;

// start engine
$(function() {
	// init
	init();
	
	// main loop
	animate();
});

function init() {
	// create stats panel
	this.stats = new Stats();
	this.stats.showPanel(0);
	document.body.appendChild(this.stats.dom);
	
	// create keyinput.js
	keyinput = new KeyInput({target: document.getElementById("game")});
	
	// get canvas element
	var canvasElement = document.getElementById("game");
	
	// create renderer
	threeRenderer = new THREE.WebGLRenderer({canvas: canvasElement});
	threeRenderer.setSize(resolution.x, resolution.y);
	
	// init game
	Game.init();
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
	
	var tick = framecounter;
	try {
		Game.logic();
		Game.draw();
	}
	catch(e) {
		console.log("exception during frame " + tick + ": " + e);
		throw e;
	}
	framecounter++;
	
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
		this.cameraOrbiter.desiredOrbitDistance = 15 + Math.sin((performance.now() / 1000.0)*(2*Math.PI))*1;
		//this.testcamera.position.z = 15 + Math.sin((performance.now() / 1000.0)*(2*Math.PI))*1;
		
		// rotate camera
		//Utils.rotateQuatAxis(this.cameraOrbiter.desiredRotation, 0, 1, 0, 0.01);
		
		// rotatey
		//Utils.rotateQuatAxis(this.cameraOrbiter.desiredRotation, this.cameraOrbiter.desiredRotation.x, this.cameraOrbiter.desiredRotation.y, this.cameraOrbiter.desiredRotation.z, 0.01);
		
		//this.cameraOrbiter.rotate(0.02, 0.0);
		//this.cameraOrbiter.rotateUp(0.1, Math.sin(performance.now() / 1000.0), 0);
		this.cameraOrbiter.rotateUp(0.5, 0.5, 0.0);
		
		// rotate camera
		if(keyinput.isKeyDown(65)) this.cameraOrbiter.lookAt(0, 0, -1);
		if(keyinput.isKeyDown(68)) this.cameraOrbiter.rotate(0.02, 0);
		
		if(keyinput.isKeyDown(87)) this.cameraOrbiter.rotate(0, 0.02);
		if(keyinput.isKeyDown(83)) this.cameraOrbiter.rotate(0, -0.02);
		
		// reste view
		
		// update camera controller
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
	
	// DEBUG:
	this.threeCamera.matrixAutoUpdate = false;
};
CameraOrbiter.prototype = {
	smoothingRot: 0.75,
	//smoothingPos: 0.0,
	smoothingOrbitDist: 0.75,
	
	pos: new THREE.Vector3(),
	camUp: new THREE.Vector3(0, 1, 0),
	
	//desiredRotation: new THREE.Quaternion(0.0, 0.0, -1.0, 0.0),
	desiredRotEuler: new THREE.Euler(0, 0, 0, "ZYX"),
	desiredOrbitDistance: 15.0,
	currentOrbitDistance: 15.0,
	
	threeCamera: null,
	
	update: function(deltafactor) {
		/*
		// lerp camera rotation
		this.threeCamera.quaternion.slerp(this.desiredRotation, 1.0 - this.smoothingRot);
		
		// lerp orbit dist
		this.currentOrbitDistance = THREE.Math.lerp(this.desiredOrbitDistance, this.currentOrbitDistance, this.smoothingOrbitDist);
		
		// calculate camera pos
		var campos = this.threeCamera.position;
		campos.set(0, 0, -1);
		campos.applyQuaternion(this.threeCamera.quaternion);
		campos.normalize();
		campos.multiplyScalar(-this.currentOrbitDistance);
		campos.add(this.pos);
		
		//this.threeCamera.position.y = Math.sin(performance.now()/1000)*5;
		*/
		
		var _lookdir = new THREE.Vector3(0, 0, -1);
		_lookdir.applyEuler(this.desiredRotEuler);
		
		var camquat = this.threeCamera.quaternion;
		//camquat.setFromEuler(this.desiredRotEuler);
		
		Utils.lookAlongQuat(camquat, _lookdir.x, _lookdir.y, _lookdir.z, 0, 1, 0);
		
		// calculate camera pos
		var campos = this.threeCamera.position;
		campos.set(0, 0, -1);
		campos.applyQuaternion(this.threeCamera.quaternion);
		campos.normalize();
		campos.multiplyScalar(-this.currentOrbitDistance);
		campos.add(this.pos);
		
		// refresh matrix
		this.threeCamera.updateMatrix();
		this.threeCamera.updateMatrixWorld(true);
	},
	lookAt: function(atx, aty, atz) {
		var quat = new THREE.Quaternion();
		Utils.lookAlongQuat(quat, atx, aty, atz, 0, 1, 0);
		
		this.desiredRotEuler.setFromQuaternion(quat);
	},
	rotate: function(x, y) {
		this.desiredRotEuler.x = THREE.Math.euclideanModulo(this.desiredRotEuler.x + y, Math.PI*2);
		this.desiredRotEuler.y = THREE.Math.euclideanModulo(this.desiredRotEuler.y + x, Math.PI*2);
		
		/*
		if(x != 0) {
			Utils.rotateQuatAxis(this.desiredRotation, this.camUp.x, this.camUp.y, this.camUp.z, x);
		}
		if(y != 0) {
			var tempRotatedUp = new THREE.Vector3(-1, 0, 0);
			tempRotatedUp.copy(this.camUp);
			tempRotatedUp.applyQuaternion(this.desiredRotation);
			
			Utils.rotateQuatAxis(this.desiredRotation, tempRotatedUp.y, tempRotatedUp.x, tempRotatedUp.z, y);
		}
		*/
	},
	rotateUp: function(upx, upy, upz) {
		this.camUp.set(upx, upy, upz);
		this.camUp.normalize();
	},
	warp: function() {
		//this.threeCamera.quaternion.copy(this.desiredRotation);
		//this.currentOrbitDistance = this.desiredOrbitDistance;
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
	
	rotateQuatAxis: function(quat, axisX, axisY, axisZ, angle, dest) {
		var dest = dest || quat;
		
		var hangle = angle * 0.5;
        var sinAngle = Math.sin(hangle);
        var invVLength = 1.0 / Math.sqrt(axisX*axisX + axisY*axisY + axisZ*axisZ);
		
        var rx = axisX * invVLength * sinAngle;
        var ry = axisY * invVLength * sinAngle;
        var rz = axisZ * invVLength * sinAngle;
        var rw = Math.cos(hangle);
		
        dest.set((quat.w * rx + quat.x * rw + quat.y * rz - quat.z * ry),
                 (quat.w * ry - quat.x * rz + quat.y * rw + quat.z * rx),
                 (quat.w * rz + quat.x * ry - quat.y * rx + quat.z * rw),
                 (quat.w * rw - quat.x * rx - quat.y * ry - quat.z * rz));
	},
	rotateQuatLocalX: function(quat, angle, dest) {
		var dest = dest || quat;
		
		var hangle = angle * 0.5;
		var s = Math.sin(hangle);
		var c = Math.cos(hangle);
		
		dest.set(c * quat.x + s * quat.w,
				 c * quat.y - s * quat.z,
				 c * quat.z + s * quat.y,
				 c * quat.w - s * quat.x);
	},
	lookAlongQuat: function(quat, dirX, dirY, dirZ, upX, upY, upZ, dest) {
		var dest = dest || quat;
		
		var mat = new THREE.Matrix4();
		mat.lookAt(new THREE.Vector3(), new THREE.Vector3(dirX, dirY, dirZ), new THREE.Vector3(upX, upY, upZ));
		
		mat.decompose(new THREE.Vector3(), dest, new THREE.Vector3());
	},
};