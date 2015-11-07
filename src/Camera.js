
function Camera () {
	SimpleCartesia.call(this); //call parent contructor
}

var proto = {
	// For now, Camera is simply an alias for Cartesia
};

Camera.prototype = Object.create(SimpleCartesia.prototype);
for (var key in proto) { Camera.prototype[key] = proto[key]; } //extend
