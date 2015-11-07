function TriangleMesh(properties) {
	// used for vertices/normals caching, given if vertices/normals don't change (color/material could change)
	this.key = properties.key;
	
	this.triangles = properties.triangles || this.calcTriangles(properties.vertices, properties.indices);
	this.normals = properties.normals || this.calcNormals();
	this.color = properties.color || vec4(1,1,1,1); //default color is white
	this.material = this.calcMaterial(properties);
	this.texture = properties.texture;
}

TriangleMesh.prototype = {
	calcTriangles: function (vertices, indices) {
		if (!vertices || !indices) throw "Please give either triangle data or vertex and index data to construct a Mesh";

		return indices.map(function (triplet) {
			return triplet.map(function (i) {
				return vertices[i];
			});
		});
	},
	calcNormals: function () {
		return this.triangles.map(function (triangle) {
			var normal = Vector.cross(
				triangle[1].subtract(triangle[0]),
				triangle[2].subtract(triangle[1])
			).normalize();
			return [normal,normal,normal];
		});
	},
	// Material properties can be given as a color or a number (a factor to multiply the mesh's color by)
	calcMaterial: function (material) {
		// if given a number use it, otherwise use default values
		this.ambientFactor = material.ambient && !material.ambient.length ? material.ambient : 0.1;
		this.diffuseFactor = material.diffuse && !material.diffuse.length ? material.diffuse : 0.7;
		this.specularFactor = material.specular && !material.specular.length ? material.specular : 1;
		this.shininess = material.shininess || 5;

		// if given a color (aka a length 4 array), use its raw form, otherwise assume its a number and multiply it by mesh's color
		this.ambient = material.ambient && material.ambient.length ? material.ambient : this.color.scale(this.ambientFactor, true);
		this.diffuse = material.diffuse && material.diffuse.length ? material.diffuse : this.color.scale(this.diffuseFactor, true);
		this.specular = material.specular && material.specular.length ? material.specular : this.color.scale(this.specularFactor, true);
	},
};
