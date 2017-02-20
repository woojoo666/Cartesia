// Planet extends SimpleCartesia, just a large bounding sphere with
// planetobjects and players
function Planet (radius, boundingRadius) {
	SimpleCartesia.call(this);
	this.planetObjects = [];
	this.players = [];
	this.scale = radius;
	this.radius = radius;

	// create a bounding sphere so that it checks collisions of players with its own sphere
	this.boundingSphere = new BoundingSphere(boundingRadius || radius);
	this.addChild(this.boundingSphere);
}

var proto = {
	registerObject: function (planetObj) {
		this.planetObjects.push(planetObj);
	},
	registerPlayer: function (player) {
		this.players.push(player);
	},
	checkCollisions: function () { // checks all collisions
		for (var i = 0; i < this.planetObjects.length; i++) {
			for (var j = 0; j < this.planetObjects.length; j++) {
				if (i == j) continue; // bounding spheres don't collide with themselves doh
				if (this.planetObjects[i].collidesWith(this.planetObjects[j])) return true;
			}
			if (this.collidesWith(this.planetObjects[i])) return true;
		}
		return false;
	},
	collisionsWith: function (planetObj) { // checks all collisions with a certain player
		for (var i = 0; i < this.planetObjects.length; i++) {
			if (this.planetObjects[i] == planetObj) continue; // bounding spheres don't collide with themselves doh
			if (planetObj.collidesWith(this.planetObjects[i])) return true;
		}
		if (this.collidesWith(planetObj)) return true;
		return false;
	},
	checkForDamages: function (damagep) {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i] == damagep.player) continue; // Ignore damages done to whichever player DamagePoint belongs to
			if (damagep.checkDamagePlayer(this.players[i])) this.players[i].onDamage();
		}
	},
	// TODO: duck typing, ugly, fix it later
	// this results because the planet itself is the only non-PlanetObject that needs
	// to be checked for collisions
	collidesWith: function (planetObj) {
		for (var i = 0; i < planetObj.boundingSpheres.length; i++) {
			if (this.boundingSphere.collidesWith(planetObj.boundingSpheres[i])) return true;
		}
	},
};

Planet.prototype = Object.create(SimpleCartesia.prototype);
for (var prop in proto) Planet.prototype[prop] = proto[prop]; //extend

// A hierarchy of SimpleCartesia's to simplify placing objects on a planet
// Hierarchy: Planet -> Latitude/Longitude -> Height offset to Surface of Planet -> PlanetObject's own transformations
// Note: assuming objects start facing the negative z axis, then all PlanetObjects will face north
// Only PlanetObjects are allowed to have bounding spheres, see addBoundingSphere() for more details
function PlanetObject (planet, latitude, longitude) {

	SimpleCartesia.call(this);
	this.planet = planet;
	this.sphericalCoords = new SimpleCartesia(); // Latitude and longitude
	this.offsetCartesia = new SimpleCartesia(); // height offset to surface of planet

	planet.registerObject(this);
	planet.addChild(this); // automatically add to planet

	// planet mesh (Sphere) always has radius of 1. Planet.radius is just how much the planet's cartesia is scaled,
	// so this will already be scaled relative to Planet.radius
	this.offsetCartesia.move(vec3(0,1.01,0)); // a bit above surface to solve collision problems
	this.setLatitudeLongitude(latitude || 0, longitude || 0);

	this.boundingSpheres = [];
}

var proto = {
	setLatitudeLongitude: function (lat, lon) {
		this.sphericalCoords.pitch = lat;
		this.sphericalCoords.roll = lon;
	},
	getTransform: function () {
		return this.sphericalCoords.getTransform()
			.append(this.offsetCartesia.getTransform())
			.append(SimpleCartesia.prototype.getTransform.call(this));
	},
	// Only PlanetObjects are allowed to have bounding spheres. This is to ensure that scaling (especially non-uniform scaling)
	// won't mess with collision detection (if we allowed bounding spheres to be placed anywhere, then a non-uniform scale could
	// turn a sphere into an ellipsoid, which makes collision detection much harder). In addition, bounding spheres are attached
	// to the offsetCartesia of the PlanetObject. Because offsetCartesia is attached to sphericalCoords cartesia, and
	// sphericalCoords cartesia is attached to the planet, and both of those cartesia's don't have scaling, then we are ensured
	// that the boundingSpheres won't be scaled relative to the planet's own Cartesia (which can be scaled or transformed
	// however it wants, but because planets are only in charge of collision detection between its own PlanetObjects, then as
	// long as all PlanetObjects aren't scaled relative to eachother and the planet, everything will work fine)
	addBoundingSphere: function (child) {
		this.boundingSpheres.push(child);
		this.addChild(child);
	},
	collidesWith: function (other) { // checks collisions with another player
		// check all collisions between my bounding spheres and his
		for (var i = 0; i < this.boundingSpheres.length; i++) {
			for (var j = 0; j < other.boundingSpheres.length; j++) {
				if (this.boundingSpheres[i] == other.boundingSpheres[j]) continue; // bounding spheres don't collide with themselves doh
				if (this.boundingSpheres[i].collidesWith(other.boundingSpheres[j])) return true;
			}
		}
	},
};

PlanetObject.prototype = Object.create(SimpleCartesia.prototype);
for (var prop in proto) PlanetObject.prototype[prop] = proto[prop]; //extend

// PlanetObject extends Cartesia to discourage transforming it directly. This is becouse
// only PlanetObjects are allowed to have bounding spheres, see addBoundingSphere() for more details
// A hierarchy of SimpleCartesia's to simplify placing objects on a planet
// Hierarchy: Planet -> Latitude/Longitude -> Height offset to Surface of Planet -> PlanetObject's own transformations
// Note: assuming objects start facing the negative z axis, then all PlanetObjects will face north
function PlanetObjectRevised (planet, latitude, longitude) {

	Cartesia.call(this);
	this.planet = planet;
	this.offsetCartesia = new SimpleCartesia(); // height offset to surface of planet

	planet.registerObject(this);
	planet.addChild(this); // automatically add to planet

	// planet mesh (Sphere) always has radius of 1. Planet.radius is just how much the planet's cartesia is scaled,
	// so this will already be scaled relative to Planet.radius
	this.offsetCartesia.move(vec3(0,1.01,0)); // a bit above surface to solve collision problems
	this.setLatitudeLongitude(latitude || 0, longitude || 0);

	this.boundingSpheres = [];
}

var proto = {
	setLatitudeLongitude: function (lat, lon) {
		this.latitude = lat;
		this.longitude = lon;
	},
	getTransform: function () {
		return new Mat4().rotate(this.longitude, vec3(0,1,0)).rotate(this.latitude, vec3(1,0,0))
			.append(this.offsetCartesia.getTransform());
	},
	// Only PlanetObjects are allowed to have bounding spheres. This is to ensure that scaling (especially non-uniform scaling)
	// won't mess with collision detection (if we allowed bounding spheres to be placed anywhere, then a non-uniform scale could
	// turn a sphere into an ellipsoid, which makes collision detection much harder). In addition, bounding spheres are attached
	// to the offsetCartesia of the PlanetObject. Because offsetCartesia is attached to sphericalCoords cartesia, and
	// sphericalCoords cartesia is attached to the planet, and both of those cartesia's don't have scaling, then we are ensured
	// that the boundingSpheres won't be scaled relative to the planet's own Cartesia (which can be scaled or transformed
	// however it wants, but because planets are only in charge of collision detection between its own PlanetObjects, then as
	// long as all PlanetObjects aren't scaled relative to eachother and the planet, everything will work fine)
	addBoundingSphere: function (child) {
		this.boundingSpheres.push(child);
		this.addChild(child);
	},
	collidesWith: function (other) { // checks collisions with another player
		// check all collisions between my bounding spheres and his
		for (var i = 0; i < this.boundingSpheres.length; i++) {
			for (var j = 0; j < other.boundingSpheres.length; j++) {
				if (this.boundingSpheres[i] == other.boundingSpheres[j]) continue; // bounding spheres don't collide with themselves doh
				if (this.boundingSpheres[i].collidesWith(other.boundingSpheres[j])) return true;
			}
		}
		return false;
	},
};

PlanetObjectRevised.prototype = Object.create(SimpleCartesia.prototype);
for (var prop in proto) PlanetObjectRevised.prototype[prop] = proto[prop]; //extend



function BoundingSphere (radius) {
	this.radius = radius;
	SimpleCartesia.call(this);
}

// Special move function that checks if new position is valid or not
var proto = {
	collidesWith: function (other) {
		return this.getAbsolutePosition().subtract(other.getAbsolutePosition()).magnitude() < this.radius + other.radius;
	},
	setBoundingParent: function (parent) {
		parent.addBoundingSphere(this);
		return this;
	},
};

BoundingSphere.prototype = Object.create(SimpleCartesia.prototype);
for (var prop in proto) BoundingSphere.prototype[prop] = proto[prop]; //extend



// A PlanetObject with a set of bounding Spheres
// has "planet" property defining which planet this bounding sphere is a part of
// Note that for now, it is assumed that the player's position is relative to the
// surface of the planet
function Player(planet, latitude, longitude, type) {
	PlanetObjectRevised.call(this, planet, latitude, longitude);
	planet.registerPlayer(this);
	this.planet = planet;
	this.hp = 50;
    this.velocity = vec3(0,0,0);
    this.yaw = 0;
    if (type == "player")
    	this.hp = 10;
}

var proto = {
	turn: function (degrees) {
		this.yaw += degrees;
		return this;
	},
	checkValid: function () {
		if (this.planet.collisionsWith(this)) {
			// if any collisions, then reset the position and set velocity to 0
			this.latitude = this.lastLat;
			this.longitude = this.lastLon;
			// Hover issue: if returning from a very high jump, then velocity is extremely high, causing a collision
			// from very high up and causing a hovering effect. For example, if Foo is 100 above the planet, but the
			// velocity is 101, then the test move will cause collision and Foo will be reset to 100 above the planet.
			// Best way to fix this is to calculate how far Foo can move without colliding with anything and move
			// that amount, instead of just resetting to the original position. for now, because we're just doing jumping,
			// set z to 0
			this.offsetCartesia.position = this.lastOffset;
			this.velocity = vec3(0,0,0);
		}
	},
	move: function (offset) {

		this.lastLat = this.latitude;
		this.lastLon = this.longitude;
		this.lastOffset = this.offsetCartesia.position;

		var upwards = offset[1];
		this.offsetCartesia.move(vec3(0,upwards,0));
		var alongPlanet = vec3(offset[0],0,offset[2]);
		if (alongPlanet.magnitude() === 0) {
			this.checkValid();
			return this;
		}

		function degrees(rad) {
			return rad*180/Math.PI;
		}

		// just get the new position adding the offset to the current position,
		// and latitude will be the angle from y-axis, and longitude will be angle from z axis when new position
		// is projected onto the equator plane
		var transform = new Mat4().rotate(this.longitude, vec3(0,1,0)).rotate(this.latitude, vec3(1,0,0));
		var nextPos = vec3.apply(this,transform.transformVector(vec4.apply(this, vec3(0,1,0).add(offset))) );
		var normalized = nextPos.normalize();
		var latitude = degrees(Math.acos(Vector.dot(vec3(0,1,0), normalized)));
		var projectedOntoEquator = vec3(normalized[0],0,normalized[2]).normalize();
		var longitude = degrees(Math.acos(Vector.dot(projectedOntoEquator,vec3(0,0,1))));
		// if x is negative then angle should be negative
		if (projectedOntoEquator[0] < 0) longitude = -longitude;

		this.latitude = latitude;
		this.longitude = longitude;

		this.checkValid();

		return this;
	},
	getTransform: function () {
		return PlanetObjectRevised.prototype.getTransform.call(this).rotate(this.yaw, vec3(0,1,0));
	},
	moveInDirection: function (offset) {
		return this.move(vec3.apply(this, new Mat4().rotate(this.yaw, vec3(0,1,0)).transformVector(vec4.apply(this, offset))));
	},
    jump: function() {
    	if (this.offsetCartesia.position[1] <= 1.01) // only allow jumps if close to the surface of the planet 
            this.velocity = vec3(0,0.1,0); //0.05 is 3 m/s, average jumping velocity of human
        return this;
    },
    updatePosition: function() {
        this.move(this.velocity);
        this.velocity[1] -= 0.05;//0.1635;  //9.81 m/s^2, acceleration due to gravity
        return this;
    },
    onDamage: function () {
    	this.hp--;
    },
    checkTouch: function (player) {
    	if (this.planet.collisionsWith(player)) {
    		return true;
    	} else return false;
    }
};

Player.prototype = Object.create(PlanetObjectRevised.prototype);
for (var prop in proto) Player.prototype[prop] = proto[prop]; //extend


function DamagePoint(planet, player) {
	SimpleCartesia.call(this);
	this.planet = planet;
	this.player = player;
}

var proto = {
	checkForDamage: function () {
		this.planet.checkForDamages(this);
	},
	checkDamagePlayer: function(player) {
		// for (var bound in this.planetObj.boundingSpheres) {
			var boundPos = player.getAbsolutePosition();
			var d = Math.sqrt(Math.pow((boundPos[0] - this.getAbsolutePosition()[0]),2) + Math.pow((boundPos[1] - this.getAbsolutePosition()[1]),2) + Math.pow((boundPos[2] - this.getAbsolutePosition()[2]),2));
			if (d <= 0.25)
				return true;
		// }
		return false;
	}
};

DamagePoint.prototype = Object.create(SimpleCartesia.prototype);
for (var prop in proto) SimpleCartesia.prototype[prop] = proto[prop];