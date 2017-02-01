var gl;
var gli;
var keyinput;

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
// https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

// DEBUG: INDEXEDDB TEST
var dbopenreq = indexedDB.open("__RESOURCE");
dbopenreq.onsuccess = function(e){ console.log("open success: " + e); };
dbopenreq.onerror = function(e){ console.log("open error: " + e); };
dbopenreq.onblocked = function(e){ console.log("open blocked: " + e); };
console.log(dbopenreq);

$(function() {
	// init
	init();
	
	// main loop
	requestAnimationFrame(animate);
});

function init() {
	// create stats panel
	this.statsjs = new Stats();
	this.statsjs.showPanel(0);
	document.body.appendChild(this.statsjs.dom);
	
	// create keyinput.js
	keyinput = new KeyInput({target: document.getElementById("game")});
	//keyinput = new KeyInput({target: document.body});
	
	// create webgl context
	gl = NebGL.createGLForId("game", { width: Game.resolution.x/2, height: Game.resolution.y/2, depth: true, alpha: false });
	NebGL.createExtension(gl, "ANGLE_instanced_arrays");
	
	// create webgldynamicdraw
	gli = WebGLDynamicDraw.createContext(gl);
	
	// init game
	Renderer.init();
	Game.init();
	
	// update canvas class
	gl.canvas.className += "  game--initialized";
	gl.canvas.style.width = Game.resolution.x + "px";
	gl.canvas.style.height = Game.resolution.y + "px";
}

function animate() {
	// request next frame
	requestAnimationFrame(animate);
	
	statsjs.begin();
	
	// do logic
	Game.logic();
	
	// do draw
	Renderer.draw();
	
	statsjs.end();
}


var Game = {
	resolution: {
		x: 1024.0,
		y: 720.0,
		
		aspect: function() {
			return this.x / this.y;
		},
		invaspect: function() {
			return 1.0 / this.aspect();
		},
	},
	
	currentScene: null,
	
	playerController: null,
	
	init: function() {
		// create test scene
		this.currentScene = new Scene();
		
		// create playerController
		this.playerController = new PlayerController();
		
		// create main camera
		var cam = new Camera();
		this.currentScene.spawnEntity(cam);
		cam.orbitDistance = 10.0;
		this.currentScene.setActiveCamera(cam);
		this.playerController.setPlayerCamera(cam);
		
		// spawn player ship
		var playerShip = new ShipEntity();
		this.currentScene.spawnEntity(playerShip);
		this.playerController.setPlayerShip(playerShip);
		
		// spawn random entities
		for(var i = 0; i < 64; i++) {
			var ent = new Entity();
			
			// random pos
			weml.randVec3(-100, 100, ent.pos);
			ent.pos.mulXYZ(1, 0.5, 1);
			weml.randQuat(ent.rotation);
			//weml.randVec3(-0.001, 0.001, ent.velocity);
			//weml.randQuat(ent.angularVel);
			
			// spawn
			this.currentScene.spawnEntity(ent);
		}
	},
	
	logic: function() {
		// update playercontroller
		this.playerController.logic();
		
		// update entities
		if(this.currentScene) {
			var scene = this.currentScene;
			
			for(var i = 0; i < scene.entities.length; i++) {
				var entity = scene.entities[i];
				
				entity.pos.add(entity.velocity);
				entity.rotation.mul(entity.angularVel);
			}
		}
	},
};


// class PlayerController
var PlayerController = function() {
	this.camController = new CameraController();
};
PlayerController.prototype = {
	_playerShip: null,
	_playerCamera: null,
	
	camController: null,
	
	tempVec: new Vec3(),
	tempQuat: new Quat(),
	
	logic: function() {
		var playerShip = this._playerShip;
		
		{// rotate ship
			var tempRotSpeed = weml.toRadians(180/144);
			
			// get old rotation
			var oldRot = playerShip.rotation.clone();
			
			var rotQuat = this.tempQuat.identity();
			var rotated = false;
			
			if(keyinput.isKeyDown(38)) {
				rotQuat.rotateXYZ(-tempRotSpeed, 0, 0);
				rotated = true;
			}
			if(keyinput.isKeyDown(40)) {
				rotQuat.rotateXYZ(tempRotSpeed, 0, 0);
				rotated = true;
			}
			if(keyinput.isKeyDown(37)) {
				rotQuat.rotateXYZ(0, tempRotSpeed, 0);
				rotated = true;
			}
			if(keyinput.isKeyDown(39)) {
				rotQuat.rotateXYZ(0, -tempRotSpeed, 0);
				rotated = true;
			}
			
			if(keyinput.isKeyDown(81)) {
				rotQuat.rotateXYZ(0, 0, tempRotSpeed);
				rotated = true;
			}
			if(keyinput.isKeyDown(69)) {
				rotQuat.rotateXYZ(0, 0, -tempRotSpeed);
				rotated = true;
			}
			
			if(rotated) {
				// apply rotation
				playerShip.rotation.mul(rotQuat).normalize();
				
				// rotate momentum
				var stickyThrusterMomentumFactor = 0.0;
				
				rotQuat.slerp(new Quat(), 1.0 - stickyThrusterMomentumFactor).transformVec3(playerShip.velocity);
				//rotQuat.transformVec3(playerShip.velocity);
			}
		}
		
		// dampen momentum
		playerShip.velocity.mulScalar(0.995);
		
		{// move ship
			var maxVel = 1.0;
			
			var moveVector = this.tempVec.identity();
			if(keyinput.isKeyDown(65)) {
				moveVector[0] -= 1;
			}
			if(keyinput.isKeyDown(68)) {
				moveVector[0] += 1;
			}
			if(keyinput.isKeyDown(87)) {
				moveVector[2] -= 1;
			}
			if(keyinput.isKeyDown(83)) {
				moveVector[2] += 1;
			}
			
			if(moveVector.magnitudesq() > 0) {
				// rotate towards forward vec
				playerShip.rotation.transformVec3(moveVector.normalize()).mulScalar(0.003);
				
				// add and clamp
				playerShip.velocity.add(moveVector);
				if(playerShip.velocity.magnitude() > maxVel) {
					playerShip.velocity.normalize().mulScalar(maxVel);
				}
			}
		}
		
		// update cameracontroller
		this.camController.follow(this._playerShip.rotation, this._playerShip.pos);
		this.camController.update();
	},
	
	setPlayerShip: function(ship) {
		this._playerShip = ship;
	},
	setPlayerCamera: function(cam) {
		this._playerCamera = cam;
		
		// update camera controller
		this.camController.setCamera(this._playerCamera);
	},
	getPlayerShip: function() {
		return this._playerShip;
	},
	getPlayerCamera: function() {
		return this._playerCamera;
	},
};


// class Scene
var Scene = function() {
	
};
Scene.prototype = {
	activeCamera: null,
	
	entities: [],
	
	spawnEntity: function(entity) {
		this.entities.push(entity);
	},
	removeEntity: function(entity) {
		var index = this.entities.indexOf(entity);
		if(index > -1) {
			this.entities.splice(index, 1);
		}
		
		/*
		// remove by moving the last entity in the list at the new free index
		var lastEntity;
		for(var i = entities.length - 1; i >= 0; i--) {
			if(entities[i] == entity) {
				// if entity is last in list, set to null and return
				if(!lastEntity) {
					entities[i] = null;
					break;
				}
				// found entity and its not last in list -> move last entity to its index and return
				else {
					entities[i] = lastEntity;
					break;
				}
			}
			else {
				// found last entity
				if(!lastEntity && entities[i]) {
					lastEntity = entities[i];
				}
			}
		}
		*/
	},
	
	setActiveCamera: function(camera) {
		this.activeCamera = camera;
	},
};


// class Entity
var Entity = function() {
	this.pos = new Vec3();
	this.scale = new Vec3(1, 1, 1);
	this.rotation = new Quat();
	
	this.velocity = new Vec3();
	this.angularVel = new Quat();
};
Entity.prototype = {
	pos: null,
	scale: null,
	rotation: null,
	
	velocity: null,
	angularVel: null,
};


// class ShipEntity
var ShipEntity = function() {
	Entity.call(this);
};
ShipEntity.prototype = Object.assign(Object.create(Entity.prototype), {
	thrusters: [],
});
ShipEntity.prototype.constructor = ShipEntity;


// class Camera
var Camera = function() {
	Entity.call(this);
};
Camera.prototype = Object.assign(Object.create(Entity.prototype), {
	orbitDistance: 0.0,
	
	calcViewMatrix: function(mat) {
		mat.identity().translateXYZ(0, 0, -this.orbitDistance).applyRotationQuat(this.rotation.invert(new Quat()).normalize()).translateXYZ(-this.pos[0], -this.pos[1], -this.pos[2]);
	},
	calcProjectionMatrix: function(mat) {
		mat.identity().perspective(75 * (Math.PI/180)*Game.resolution.invaspect(), Game.resolution.aspect(), 0.1, 1000.0);
	},
});
Camera.prototype.constructor = Camera;


// class CameraController
var CameraController = function(camera) {
	this.camera = camera;
};
CameraController.prototype = {
	_camera: null,
	
	_baseRot: new Quat(),
	_basePos: new Vec3(),
	_rotationOffset: new Vec3(),
	
	update: function() {
		if(this._camera) {
			var cam = this._camera;
			
			// update cam
			cam.rotation.slerp(this._baseRot, 0.05);
			cam.pos.set(this._basePos);
		}
	},
	follow(baserot, basepos) {
		this._baseRot.set(baserot);
		this._basePos.set(basepos);
	},
	rotateOffset: function(xrad, yrad) {
		this._rotationOffset[0] = weml.radmod(this._rotationOffset[0] + xrad);
		this._rotationOffset[1] = weml.radmod(this._rotationOffset[1] + yrad);
	},
	
	setCamera: function(cam) {
		this._camera = cam;
	},
	getCamera: function() {
		return this._camera;
	},
};


// class Renderer
var Renderer = {
	shaderScene: null,
	shaderUI: null,
	
	testcubevertexbuffer: null,
	testcubeelementbuffer: null,
	
	starPosBuffer: null,
	
	matCameraV: new Mat4(),
	matCameraP: new Mat4(),
	matTempModel: new Mat4(),
	matMVP: new Mat4(),
	matITVP: new Mat4(),
	
	testcubevertices: [
		-1,-1,-1, 1,-1,-1, 1, 1,-1, -1, 1,-1,
		-1,-1, 1, 1,-1, 1, 1, 1, 1, -1, 1, 1,
		-1,-1,-1, -1, 1,-1, -1, 1, 1, -1,-1, 1,
		1,-1,-1, 1, 1,-1, 1, 1, 1, 1,-1, 1,
		-1,-1,-1, -1,-1, 1, 1,-1, 1, 1,-1,-1,
		-1, 1,-1, -1, 1, 1, 1, 1, 1, 1, 1,-1,
	],
	testcubeindices: [
		0,1,2, 0,2,3, 4,5,6, 4,6,7,
		8,9,10, 8,10,11, 12,13,14, 12,14,15,
		16,17,18, 16,18,19, 20,21,22, 20,22,23,
	],
	
	init: function() {
		// load shader
		this.shaderScene = NebGL.createProgramFromScripts(gl, "scene-vert", "scene-frag");
		this.shaderScene.uMatMVP = gl.getUniformLocation(this.shaderScene, "uMatMVP");
		//this.shaderScene.uMatITVP = gl.getUniformLocation(this.shaderScene, "uMatITVP");
		
		// create cube buffer
		this.testcubevertexbuffer = NebGL.createBuffer(gl);
		NebGL.uploadBuffer(gl, this.testcubevertexbuffer, gl.ARRAY_BUFFER, new Float32Array(this.testcubevertices), gl.STATIC_DRAW);
		
		this.testcubeelementbuffer = NebGL.createBuffer(gl);
		NebGL.uploadBuffer(gl, this.testcubeelementbuffer, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.testcubeindices), gl.STATIC_DRAW);
		
		// generate random stars and upload to buffer
		var starPosArray = new Float32Array(64 * 3);
		var tempStarPos = new Vec3();
		for(var i = 0; i < 64; i++) {
			weml.randVec3(-1, 1, tempStarPos).normalize().put(starPosArray, i*3);
		}
		
		this.starPosBuffer = NebGL.createBuffer(gl);
		NebGL.uploadBuffer(gl, this.starPosBuffer, gl.ARRAY_BUFFER, new Float32Array(starPosArray), gl.STATIC_DRAW);
		
		// create cube vao
		//this.testcubevao = NebGL.createVertexArray(gl, [{ buffer: this.testcubevertexbuffer }]);
	},
	
	draw: function() {
		// setup state
		gl.enable(gl.DEPTH_TEST);
		
		// clear
		gl.clearColor(0,0,0,1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// bind shader
		gl.useProgram(this.shaderScene);
		
		// draw scene
		if(Game.currentScene && Game.currentScene.activeCamera) {
			this.drawScene(Game.currentScene);
		}
	},
	
	drawScene: function(scene) {
		var cam = scene.activeCamera;
		
		// update camera matrices
		cam.calcViewMatrix(this.matCameraV);
		cam.calcProjectionMatrix(this.matCameraP);
		
		// DEBUG: draw dynamic line
		this.setModelMatrix(this.matTempModel.identity());
		
		gl.lineWidth(8);
		gli.enableVertexAttrib(0, true);
		gli.vertexAttrib(0, 3, gl.FLOAT, false);
		
		//var camDir = cam.rotation.invert(new Quat()).transformVec3(new Vec3(0, 0, -1)).mulScalar(8.0);
		var camDir = cam.rotation.transformVec3(new Vec3(0, 0, -1)).mulScalar(8.0);
		gli.begin(gl.LINES);
			gli.addVertex3(0, 0, 0, 0);
			gli.addVertex3(0, camDir[0], camDir[1], camDir[2]);
			/*
			gli.addVertex3(0, 0, 0, 0);
			gli.addVertex3(0, 2, 0, 0);
			gli.addVertex3(0, 0, 0, 0);
			gli.addVertex3(0, 0, 2, 0);
			gli.addVertex3(0, 0, 0, 0);
			gli.addVertex3(0, 0, 0, 2);
			*/
		gli.end();
		
		// draw entities
		for(var i = 0; i < scene.entities.length; i++) {
			var ent = scene.entities[i];
			if(ent && !(ent instanceof Camera)) {
				this.drawEntity(ent);
			}
		}
		
		// draw skybox
		this.drawBackground();
	},
	
	drawEntity: function(ent) {
		// update model matrix
		this.calcEntityModelMatrix(ent, this.matTempModel);
		this.setModelMatrix(this.matTempModel);
		
		// draw testcube
		gl.bindBuffer(gl.ARRAY_BUFFER, this.testcubevertexbuffer);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.testcubeelementbuffer);
		
		gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
		
		// DEBUG: draw dir
		gli.begin(gl.LINES);
			gli.addVertex3(0, 0, 0, 0);
			gli.addVertex3(0, 0, 0, -2);
		gli.end();
	},
	
	drawBackground: function() {
		// draw skybox stars
		// calc itvp matrix
		//this.matCameraP.mul(this.matCameraV.invert(this.matITVP).transpose(), this.matITVP);
		
		this.matITVP.set(this.matMVP);
		
		//this.matCameraV.invert(this.matITVP).transpose().invert();
		//this.matCameraV.transpose(this.matITVP);
		//this.matCameraV.invert(this.matITVP).transpose().mul(this.matCameraP);
		this.matITVP[12] = 0;
		this.matITVP[13] = 0;
		this.matITVP[14] = 0;
		this.matITVP[03] = 0;
		this.matITVP[07] = 0;
		this.matITVP[11] = 0;
		this.matITVP[15] = 1.0;
		
		gl.uniformMatrix4fv(this.shaderScene.uMatMVP, false, this.matITVP);
		
		// draw
		gl.bindBuffer(gl.ARRAY_BUFFER, this.starPosBuffer);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, 0, 0, 0);
		
		gl.drawArrays(gl.POINTS, 0, this.starPosBuffer.info.length / 3);
	},
	
	setModelMatrix: function(modelmat) {
		// recalc mvp matrix
		this.matCameraP.mul(this.matCameraV, this.matMVP).mul(modelmat);
		
		// update uniform
		gl.uniformMatrix4fv(this.shaderScene.uMatMVP, false, this.matMVP);
	},
	
	calcEntityModelMatrix: function(ent, mat) {
		mat.identity().translateVec3(ent.pos).applyRotationQuat(ent.rotation);
	},
};
