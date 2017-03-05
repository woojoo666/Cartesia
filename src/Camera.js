
function Camera (fov, near, far) {
	SimpleCartesia.call(this); //call parent contructor

	this.fov = fov || 45;
	this.near = near || 0.1;
	this.far = far || -1; //note that in perspective, giving a far of "-1" somehow makes it infinite :D
}

var proto = {
	calcPerspective: function (aspect) {
		this.aspect = aspect;
		this.perspective = new Mat4().perspective(this.fov, aspect, this.near, this.far);
	}
};

Camera.prototype = Object.create(SimpleCartesia.prototype);
for (var key in proto) { Camera.prototype[key] = proto[key]; } //extend
