
function Cube (color) {
	var mesh = new TriangleMesh({
		key: "cube",
		vertices: this.corners,
		indices: this.triangles,
		color: color,
	});

	TriangleMeshSimpleCartesia.call(this, mesh); //call parent contructor
}

//Cube extends Cartesia, so store properties in temp var
//and then use at bottom
var proto = {
	corners: [
		//      7__ 6
		//    3/__2/|
		// .->|   | |
		// |  |___|/5
		// 4  0   1

		// front
		vec3(-1, -1,  1), // 3___2
		vec3( 1, -1,  1), // |   |
		vec3( 1,  1,  1), // |___|
		vec3(-1,  1,  1), // 0   1
		
		// back
		vec3(-1, -1, -1), // 7___6
		vec3( 1, -1, -1), // |   |
		vec3( 1,  1, -1), // |___|
		vec3(-1,  1, -1), // 4   5

		//normals
		vec3( 0, 0, 1), // front
		vec3( 1, 0, 0), // right
		vec3( 0, 1, 0), // top
		vec3( 0, 0,-1), // back
		vec3(-1, 0, 0), // left,
		vec3( 0,-1, 0), // bottom
	],
	triangles: [
		[0,1,2], [0,2,3], // front
		[1,5,6], [1,6,2], // right
		[3,2,6], [3,6,7], // top
		[5,4,7], [5,7,6], // back
		[4,0,3], [4,3,7], // left,
		[1,0,4], [1,4,5]  // bottom
	],
	normals: [
		 8, 8, 8,  8, 8, 8, // front
		 9, 9, 9,  9, 9, 9, // right
		10,10,10, 10,10,10, // top
		11,11,11, 11,11,11, // back
		12,12,12, 12,12,12, // left,
		13,13,13, 13,13,13,  // bottom
	],
	border: [
		//      7__ 6
		//    3/__2/|
		// .->|   | |
		// |  |___|/5
		// 4  0   1

		//first U
		0,3,2,1,5,6,7,4,0,
		//second U
		1,2,6,5,4,7,3
	],
};

Cube.prototype = Object.create(TriangleMeshSimpleCartesia.prototype);
for (var key in proto) { Cube.prototype[key] = proto[key]; } //extend
