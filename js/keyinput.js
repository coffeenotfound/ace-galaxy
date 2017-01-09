var KeyInput = function(config) {
	this.target = (typeof config == "array" && config.target !== undefined ? config.target : document);
	
	//const MIN_POLL_ID = 0;
	//const MAX_POLL_ID = 1000000000;
	
	this.keystates = new Array(256);
	//this.pollID = MIN_POLL_ID;
	
	var self = this;
	
	// public methods
	this.isKeyDown = function(key) {
		//return this.keystates[key] >= (this.pollID - 1);
		return this.keystates[key];
	};
	this.isKeyUp = function(key) {
		//return this.keystates[key] == 0;
		return !this.keystates[key];
	};
	this.poll = function() {
		/*
		// increment poll id
		this.pollID++;
		
		// manually reset array when poll id overflows
		if(this.pollID == MAX_POLL_ID) {
			for(var i = 0; i < this.keystates.length; i++) {
				this.keystates[i] -= MAX_POLL_ID;
			}
			
			this.pollID = MIN_POLL_ID;
		}
		*/
	};
	this.hasFocus = function() {
		return document.hasFocus();
	};
	
	// private code
	
	// on keydown
	this.target.addEventListener('keydown', function(e) {
		var key = e.keyCode;
		
		// allow f keys
		if(key < 112 || key > 123) e.preventDefault();
		
		// ignore repeat (if implemented)
		if(e.repeat == true) return;
		
		// set
		//self.keystates[key] = self.pollID;
		if(self.keystates[key] != true) {
			self.keystates[key] = true;
		}
	}, true);
	
	// on keyup
	this.target.addEventListener('keyup', function(e) {		
		var key = e.keyCode;
		
		e.preventDefault();
		
		// set
		//self.keystates[key] = 0;
		if(self.keystates[key] != false) {
			self.keystates[key] = false;
		}
	}, true);
	
	// on blur
	window.onblur = function(e) {
		// DEBUG:
		console.log("blured");
	};
	
	// request focus
	//this.target.focus();
	
	// constants
};