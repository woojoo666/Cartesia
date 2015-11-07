

function triangulateSphere(radius, complexity) {
    var latitudeBands = complexity;
    var longitudeBands = complexity;
    radius = 1;

    var normalData = [];
    var vertexPositionData = [];
    var triangleIndices = [];

    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            normalData.push( vec3(x, y, z) );
            vertexPositionData.push( vec3(radius * x, radius * y, radius * z) );
        }
    }

    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            // d___c
            // |  /|
            // |/__|
            // a   b
            var a = (latNumber * (longitudeBands + 1)) + longNumber; //first latitute band
            var b = a + 1;
            var d = a + longitudeBands + 1; // next latitude band
            var c = d + 1;

            // remember to push triangles clockwise!
            triangleIndices.push([a, b, c]); // push first triangle
            triangleIndices.push([a, c, d]); // push second triangle
        }
    }

    return {normals: normalData, corners: vertexPositionData, indices: triangleIndices};
}

function Sphere(color, radius, complexity, shadeStyle) {
    TriangleMeshSimpleCartesia.call(this); // null mesh

    this.color = color || vec4(1,1,1);
    this.shadeStyle = shadeStyle || "phong";

    var triangulation = triangulateSphere(1, complexity || 20);

    this.triangles = triangulation.indices.map(function (triplet) {
        return triplet.map(function (i) {
            return triangulation.corners[i];
        });
    });
    this.smoothNormals = triangulation.indices.map(function (triplet) {
        return triplet.map(function (i) {
            return triangulation.normals[i];
        });
    });

    // caching is based on complexity
    this.smoothMesh = new TriangleMesh({
        key: "Sphere" + "_" + "smooth" + "_" + complexity,
        triangles: this.triangles,
        normals: this.smoothNormals,
        color: color,
    });

    this.flatMesh = new TriangleMesh({
        key: "Sphere" + "_" + "flat" + "_" + complexity,
        triangles: this.triangles,
        // normals will be calculated
        color: color,
    });

    this.setScale(radius);
}

var proto = {
    draw: function (context, parentTransform) {
        switch (this.shadeStyle) {
            case "phong": this.mesh = this.smoothMesh; break;
            case "gouraud": this.mesh = this.smoothMesh; break; // TODO: gouraud shading option in WebGLWrapper.drawTriangleMesh?
            case "flat": this.mesh = this.flatMesh; break;
            default: this.mesh = this.smoothMesh; break; //phong is default
        }
        TriangleMeshSimpleCartesia.prototype.draw.call(this, context, parentTransform);
    }

};

Sphere.prototype = Object.create(TriangleMeshSimpleCartesia.prototype);
for (var key in proto) { Sphere.prototype[key] = proto[key]; } //extend
