/**
 * A Cartesia is just a reference origin point for defining object
 * positions and rotations. Just like the objects inside the Cartesia, 
 * the Cartesia itself can have a position and a rotation, relative to
 * a parent Cartesia. This simplifies recursive positioning calculations,
 * like calculating the position of a moon orbiting a planet that
 * itself is orbiting a sun.
 */
function Cartesia() {

	this.children = [];
	this.parent = null;
}

Cartesia.prototype = {
	getTransform: function () {
		throw "getTransform() of Cartesia is an abstract method! Did you mean to instantiate SimpleCartesia?";
	},
	// getAbsoluteTransform recursively gets its parent's absolute transformation and appends its
	// own (relative) transformation to the end. If no parent, then relative transformation is returned.
	// If parent transformation is passed as argument, just use that. This is useful for top-down calls,
	// where instead of initiating at a leaf and recursively chaining towards the root, instead
	// initiates at the root and propagates towards the leaves. Top-down is used for draw(), while
	// bottom-up is used for retrieving Camera's transform.
	getAbsoluteTransform: function (parentTransform) {
		var parentT = parentTransform || (this.parent && this.parent.getAbsoluteTransform()) || new Mat4();
		return parentT.append(this.getTransform());
	},
	getAbsolutePosition: function (parentTransform) {
        return vec3.apply(this, this.getAbsoluteTransform().col(3));
	},
	setParent: function (parent) {
		parent.children.push(this);
		this.parent = parent;
	},
	addChild: function (child) {
		child.setParent(this);
	},
	// Cartesia simply propagates the draw() call to its children, while using the top-down approach to
	// calculate absolute transformations at each node. Children can override draw() to do something useful.
	draw: function (context, parentTransform) {
		var transform = this.getAbsoluteTransform(parentTransform);
		this.children.forEach(function (child) {
			child.draw(context, transform);
		});
	}
};

function SimpleCartesia() {
	Cartesia.call(this); //call parent contructor

	//initialize private members
	this.position = vec3();
	this.roll = 0;
	this.pitch = 0;
	this.yaw = 0;
	this.scale = 1;
}

var proto = {
	setPosition: function(position) {
		this.position = position;
	},
	move: function(offset) {
		this.setPosition(this.position.add(offset));
	},
	moveInDirection: function(offset) { //move towards the direction you're facing

		//rotate the offset towards the direction. Vectors are transformed in the order roll->pitch->yaw
		var transformedOffset = new Mat4()
			.rotate(this.pitch, vec3(1,0,0))
			.rotate(this.yaw, vec3(0,1,0))
			.rotate(this.roll, vec3(0,0,1))
			.transformVector(vec4.apply(this, offset));

		this.move(vec3.apply(this, transformedOffset));
	},
	resetPosition: function() {
		this.moveTo(this.initialPosition);
	},
	resetRotation: function() {
		this.roll = 0;
		this.pitch = 0;
		this.yaw = 0;
	},
	resetScale: function() {
		this.scale = 1;
	},
	reset: function() {
		this.resetPosition();
		this.resetRotation();
		this.resetScale();
	},
	movePitch: function (degrees) { this.pitch += degrees; },
	moveYaw: function (degrees) { this.yaw += degrees; },
	moveRoll: function (degrees) { this.roll += degrees; },
	setScale: function (scale) { this.scale = scale; },
	scaleBy: function (factor) { this.setScale(this.scale * factor); },
	getTransform: function () {

		//calculate rotation matrix from quaternion
		//apply roll, then yaw, then pitch
		var rotation = new Mat4()
			.rotate(this.pitch, vec3(1,0,0))
			.rotate(this.yaw, vec3(0,1,0))
			.rotate(this.roll, vec3(0,0,1));

		// Builds transformation: position * rotation * scale
		// Remember: transformVector reverses the order, so the
		// actual will be scale, then rotate, then place

		return new Mat4().translate(this.position).append(rotation).scale(this.scale);
	},
};

SimpleCartesia.prototype = Object.create(Cartesia.prototype);
for (var prop in proto) { SimpleCartesia.prototype[prop] = proto[prop]; } //extend


function TriangleMeshSimpleCartesia (mesh) {
	SimpleCartesia.call(this);

	this.mesh = mesh;
}

var proto = {
	draw: function (context, parentTransform) {
		var transform = this.getAbsoluteTransform(parentTransform);

		context.drawTriangleMesh(this.mesh, transform);

		// if there are any children, draw them too
		this.children.forEach(function (child) {
			child.draw(context, transform);
		});
	}
};

TriangleMeshSimpleCartesia.prototype = Object.create(SimpleCartesia.prototype);
for (var prop in proto) { TriangleMeshSimpleCartesia.prototype[prop] = proto[prop]; } //extend


function CustomCartesia () {
	Cartesia.call(this); //call parent contructor

	//initialize private members
	this.transformation = new Mat4();
}

var proto = {
	setTransform: function (transform) {
		this.transformation = transform;
	},
	applyTransform: function (transform) {
		this.setTransform(this.transformation.append(transform));
	},
	getTransform: function () {
		return this.transformation;
	}
};

CustomCartesia.prototype = Object.create(Cartesia.prototype);
for (var key in proto) { CustomCartesia.prototype[key] = proto[key]; } //extend

function TextureSquare (texture) {
	var mesh = new TriangleMesh({
		vertices: [
			vec3(-1, -1,  0), // 3___2
			vec3( 1, -1,  0), // |   |
			vec3( 1,  1,  0), // |___|
			vec3(-1,  1,  0), // 0   1
		],
		indices: [
			[0,1,2], [0,2,3],
		],
	});
	mesh.texCoords = [
		0,0,
		1,0,
		1,1,

		0,0,
		1,1,
		0,1,
	];
	mesh.texture = texture;
	TriangleMeshSimpleCartesia.call(this, mesh); //call parent contructor
}

var proto = {
	draw : function (context, parentTransform) {
		TextureShader.beforeDraw(context, this.mesh);

		var transform = this.getAbsoluteTransform(parentTransform);

		WebGLWrapperBasic.prototype.drawTriangleMesh.call(context, this.mesh, transform);

		// if there are any children, draw them too
		this.children.forEach(function (child) {
			child.draw(context, transform);
		});
	}
};

TextureSquare.prototype = Object.create(TriangleMeshSimpleCartesia.prototype);
for (var prop in proto) TextureSquare.prototype[prop] = proto[prop];

 rootCartesia = new SimpleCartesia();

function BackgroundCartesia (texture) {
	TextureSquare.call(this, texture); //call parent contructor
}

var proto = {
	draw : function (context) {
		BackgroundShader.draw(context, this.mesh);
		// if there are any children, draw them too
		this.children.forEach(function (child) {
			child.draw(context, transform);
		});
	}
};

BackgroundCartesia.prototype = Object.create(TextureSquare.prototype);
for (var prop in proto) BackgroundCartesia.prototype[prop] = proto[prop];


// Lights are points, so they don't need a separate Light class like Meshes
function LightCartesia (color, attenuation) {

	SimpleCartesia.call(this); //call parent contructor
	this.color = color || vec4(1,1,1,1); // default color is white
	this.attenuation = attenuation || 0; // default is no attenuation
}

var proto = {
	draw: function (context, parentTransform) {
		var transform = this.getAbsoluteTransform(parentTransform);

		context.glwrapper.lights.push({color: this.color, transform: transform, attenuation: this.attenuation});

		// if there are any children, draw them too
		this.children.forEach(function (child) {
			child.draw(context, transform);
		});
	}
};

LightCartesia.prototype = Object.create(SimpleCartesia.prototype);
for (var key in proto) { LightCartesia.prototype[key] = proto[key]; } //extend
