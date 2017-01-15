var gl;
var keyinput;

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
// https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

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
	gl = NebGL.createGLForId("game", { width: 640/2, height: 480/2, depth: true, alpha: false });
	
	// init game
	Renderer.init();
	Game.init();
	
	// update canvas class
	gl.canvas.className += "  game--initialized";
	gl.canvas.style.width = "640px";
	gl.canvas.style.height = "480px";
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
	currentScene: null,
	
	testCamera: null,
	testCameraController: null,
	
	init: function() {
		// create test scene
		this.currentScene = new Scene();
		
		// create test camera
		var cam = new Camera();
		cam.pos.setXYZ(0, 0, -5);
		this.currentScene.setActiveCamera(cam);
		this.testCamera = cam;
		
		// create camera controller
		this.testCameraController = new CameraController(cam);
	},
	
	logic: function() {
		// DEBUG: move camera
		var moveVector = new Vec3();
		if(keyinput.isKeyDown(65)) {
			moveVector[0] += 0.025;
		}
		if(keyinput.isKeyDown(68)) {
			moveVector[0] -= 0.025;
		}
		if(keyinput.isKeyDown(87)) {
			moveVector[2] += 0.025;
		}
		if(keyinput.isKeyDown(83)) {
			moveVector[2] -= 0.025;
		}
		this.testCamera.pos.add(moveVector);
		
		// DEBUG: rotate camera
		var tempRotSpeed = weml.toRadians(90/144);
		if(keyinput.isKeyDown(38)) {
			this.testCamera.rotation.rotateLocalAxesXYZ(tempRotSpeed, 0, 0);
		}
		if(keyinput.isKeyDown(40)) {
			this.testCamera.rotation.rotateLocalAxesXYZ(-tempRotSpeed, 0, 0);
		}
		if(keyinput.isKeyDown(37)) {
			this.testCamera.rotation.rotateLocalAxesXYZ(0, tempRotSpeed, 0);
		}
		if(keyinput.isKeyDown(39)) {
			this.testCamera.rotation.rotateLocalAxesXYZ(0, -tempRotSpeed, 0);
		}
		if(keyinput.isKeyDown(39)) {
			this.testCamera.rotation.rotateLocalAxesXYZ(0, -tempRotSpeed, 0);
		}
		
		this.testCamera.rotation.normalize();
		
		// update cameracontroller
		this.testCameraController.update();
		
		// DEBUG: update entities
		if(this.currentScene) {
			var scene = this.currentScene;
			
			for(var i = 0; i < scene.entities.length; i++) {
				var entity = scene.entities[i];
				
				entity.pos.add(entity.veclocity);
			}
		}
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
	this.scale = new Vec3();
	this.rotation = new Quat();
	this.velocity = new Vec3();
};
Entity.prototype = {
	pos: null,
	scale: null,
	rotation: null,
	
	velocity: null,
};


// class Camera
var Camera = function() {
	Entity.call(this);
	
	console.log(this.pos);
};
Camera.prototype = Object.assign(Object.create(Entity.prototype), {
	calcViewMatrix: function(mat) {
		//console.log(this.pos);
		mat.identity().translate(this.pos).applyRotationQuat(this.rotation);
		//mat.identity().translateXYZ(0, 0, -5);
	},
	calcProjectionMatrix: function(mat) {
		mat.identity().perspective(75 * (Math.PI/180)*(480/640), (640/480), 0.1, 1000.0);
	},
});
Camera.prototype.constructor = Camera;


// class CameraController
var CameraController = function(camera) {
	this.camera = camera;
};
CameraController.prototype = {
	camera: null,
	
	baseRotation: new Quat(),
	rotationOffsetEuler: new Vec3(),
	
	update: function() {
		if(this.camera) {
			var cam = this.camera;
			
			// update rotation
			//cam.rotation.set();
		}
	},
	follow(baserot) {
		this.baseRotation.set(baserot);
	},
	rotateOffset: function(x, y) {
		this.rotationOffsetEuler.addXYZ(x, y, 0);
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
		
		// draw testcube
		this.matTempModel.identity();
		this.setModelMatrix(this.matTempModel);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.testcubevertexbuffer);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.testcubeelementbuffer);
		
		gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
		
		// draw skybox
		this.drawBackground();
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
};
