function Transformation(size, matrix) {
	Array.call(this, size);
	this.length = size; // Array.length doesn't inherit properly, manually fix it
	this.size = size;
	for (var r = 0; r < size; r++) {
		this[r] = new Array(size);
	}
	if (matrix) { // if matrix passed in, use it to populate Transformation
		for (r = 0; r < size; r++) {
			for (var c = 0; c < size; c++) {
				if (r < matrix.length && c < matrix[r].length) this[r][c] = matrix[r][c];
				else this[r][c] = r == c ? 1 : 0; //fill remaining with identity matrix
			}
		}
	}
}

Transformation.Generate = function (size, callback) {
	return new Transformation(size).populate(callback);
};

Transformation.UniformScale = function (size, factor) {
	return Transformation.Generate(size, function (r,c) {
		return r == c ? ( c < size-1 && r < size-1 ? factor : 1 ) : 0 ;
	});
};

Transformation.Scale = function(factors) {
	var size = factors.length + 1;
	return Transformation.Generate(size, function (r,c) {
		return r == c ? ( c < size-1 && r < size-1 ? factors[r] : 1 ) : 0 ;
	});
};

Transformation.Translate = function (vector) {
	var size = vector.length + 1;
	return Transformation.Generate(size, function (r,c) {
		// offset vector in last column, everything else identity matrix
		return c == size - 1 && r < size-1 ? vector[r] : (r == c ? 1 : 0);
	});
};

var proto = {
	// child prototypes override this so factory methods like append() use the correct prototype
	spawn: function (size) {
		return new Transformation(size !== undefined ? size : this.size);
	},
	populate: function (generator) {
		for (var r = 0; r < this.size; r++) {
			for (var c = 0; c < this.size; c++) {
				this[r][c] = generator.call(this,r,c) || 0; //if generator doesn't return anything use 0
			}
		}
		return this; //for chaining
	},
	row: function(i) {
		return this[i];
	},
	col: function(i) {
		return this.map(function(row) {
			return row[i];
		});
	},
	flatten: function () {
		var res = [];
		this.transpose().forEachCell(function(cell){ res.push(cell); });
		return res;
	},
	forEachRow: function (callback) {
		//array.forEach does what we need :D
		this.forEach(callback, this); //have to pass in $this in non-strict mode
	},
	forEachCol: function (callback) {
		var boundCallback = callback.bind(this); //so $this inside callback refers to Transformation not transpose
		this.transpose().forEachRow(boundCallback);
	},
	forCellInRow: function (r, callback) {
		this.row(r).forEach(function(cell, c) {
			callback(cell,r,c);
		}, this);
	},
	forCellInCol: function (c, callback) {
		this.col(c).forEach(function(cell, r) {
			callback(cell,r,c);
		}, this);
	},
	forEachCell: function (callback) {
		for (var r = 0; r < this.size; r++) {
			for (var c = 0; c < this.size; c++) {
				callback.call(this, this[r][c], r, c);
			}
		}
	},
	// Note: doesn't use Generate/populate for performance reasons. See perfTests.md
	cellMap: function (callback) {
		var res = this.spawn();
		for (var r = 0; r < this.size; r++) {
			for (var c = 0; c < this.size; c++) {
				// call callback with parent as $this and pass in parent cells
				res[r][c] = callback.call(this, this[r][c],r,c) || 0; //if callback doesn't return anything use 0
			}
		}
		return res;
	},
	append: function(right) {
		var left = this;
		if (left.size != right.size) throw "can't multiply matrices of different dimensions";
		// use spawn() so if this is a child prototype of Transformation (e.g. Mat4), it will use the correct prototype
		return this.spawn().populate(function (r, c) {
			var sum = 0;
			for (var k = 0; k < this.size; k++)
				sum += left[r][k] * right[k][c];
			return sum;
		});
	},
	prepend: function(left) {
		return left.append(this);
	},
	transpose: function() {
		return this.cellMap(function (cell, row, col) {
			return this[col][row];
		});
	},
	subMatrix: function (pivotrow, pivotcol) {
		if (this.size === 0) throw "no submatrix of matrix with zero size";

		var parent = this;
		return Transformation.Generate(this.size-1, function (r, c) {
			return parent[r < pivotrow ? r : r+1][c < pivotcol ? c : c+1]; //skip pivotrow and pivotcol
		});
	},
	determinant: function(cofactorMatrix) {
		if (this.size === 0) return 1;

		var pivotrow = 0; //use first row
		var accumulator = 0;
		for (var pivotcol = 0; pivotcol < this.size; pivotcol++) {//sumation of cell*cofactor
			var cofactor = cofactorMatrix ? cofactorMatrix[pivotrow][pivotcol] : this.cofactor(pivotrow,pivotcol); //use cofactor matrix if given
			accumulator += (this[pivotrow][pivotcol] * cofactor);
		}
		return accumulator;
	},
	minor: function (pivotrow, pivotcol) {
		return this.subMatrix(pivotrow, pivotcol).determinant();
	},
	cofactor: function (pivotrow, pivotcol) {
		var sign = (pivotrow + pivotcol) % 2 ? 1 : -1;
		var minor = this.minor(pivotrow, pivotcol);
		return sign * minor;
	},
	cofactorMatrix: function () {
		return this.cellMap(function (cell, r, c) {
			return this.cofactor(r,c);
		});
	},
	adjoint: function () {
		return this.cofactorMatrix().transpose();
	},
	inverse: function () {
		var cofactors = this.cofactorMatrix();
		var determ = this.determinant(cofactors);
		if (determ === 0) throw "Can't take inverse if matrix determinant is zero";

		var adjoint = cofactors.transpose(); //don't call this.adjoint(), which recalculates cofactorMatrix()
		return adjoint.cellMap(function (cell) {
			return cell / determ;
		});
	},
	transformVector: function (vector) {
		if (this.size !== vector.length) throw "Transformation and vector have different sizes";
		var res = new Array(vector.length);
		for (var r = 0; r < this.size; r++) {
			res[r] = 0;
			for (var c = 0; c < this.size; c++) {
				res[r] += this[r][c] * vector[c];
			}
		}
		return res;
	}
};

Transformation.prototype = Object.create(Array.prototype);
for (var key in proto) { Transformation.prototype[key] = proto[key]; } //extend

function Mat4 () {
	Transformation.call(this, 4);
	this[0] = [1,0,0,0];
	this[1] = [0,1,0,0];
	this[2] = [0,0,1,0];
	this[3] = [0,0,0,1];
}

var proto = {
	spawn: function (size) {
		return new Mat4(); // ignore size
	},
	// TODO: figure out how to incorporate spawn inheritance into parent's static factory functions.
	// This includes Transformation.UniformScale, Transformation.Scale, and Transformation.Translate.
	// However, luckily this isn't necessary because this.append() uses spawn(), and Transformations
	// are compatible with Mat4s in append(), so it doesn't matter that the input to append() is a
	// Transformation, because the output will still be a Mat4
	scale: function (factors) {
		if (!factors.length) //single factor given, must be uniform scale
			return this.append(Transformation.UniformScale(4, factors));

		if (factors.length !== 3) throw 'Mat4.scale() takes either a single number of a vector of length 3';
		return this.append(Transformation.Scale(factors));
	},
	translate: function (offset) {
		if (offset.length !== 3) throw 'Mat4.translate() takes a vector with length 3';
		return this.append(Transformation.Translate(offset));
	},
	rotate: function (angle, axis) {
		//from MV.js

		var v = axis.normalize();

		var cos = Math.cos( radians(angle) );
		var omc = 1.0 - cos;
		var sin = Math.sin( radians(angle) );

		return this.append(this.spawn().populate(function (r, c) {
			if (r == this.size-1 || c == this.size-1) return r == c ? 1 : 0; //use identity for last row/col

			// x*x*omc + cos   , x*y*omc - z*sin   , x*z*omc + y*sin
			// x*y*omc + z*sin , y*y*omc + cos     , y*z*omc - x*sin
			// x*z*omc - y*sin , y*z*omc + x*sin   , z*z*omc + cos
			return v[r]*v[c]*omc + (r == c ? cos : (c == (r+1) % 3 ? -1 : 1)*v[0+1+2-r-c]*sin);
		}));
	},
	perspective: function ( fovy, aspect, near, far ) {
		
		var f = 1.0 / Math.tan( radians(fovy) / 2 );
		var d = far - near;

		var mat = new Mat4();
		mat[0][0] = f / aspect;
		mat[1][1] = f;
		mat[2][2] = -(near + far) / d;
		mat[2][3] = -2 * near * far / d;
		mat[3][2] = -1;
		mat[3][3] = 0.0;

		return this.append(mat);
	},
	rotateYAxisTo: function (newAxis) {
		
		return this.rotateVectorToMatch(vec3(0,1,0), newAxis);
	},
	rotateVectorToMatch: function (oldV, newV) {

		var oldU = oldV.normalize();
		var newU = newV.normalize();

		if (Vector.equal(newU,oldU)) return new Mat4();

		var axis = Vector.cross(oldU, newU);
		var angle = degrees(Math.acos( Vector.dot(oldU, newU) ));
		return new Mat4().rotate(angle, axis);
	}
};

Mat4.prototype = Object.create(Transformation.prototype);
for (var key in proto) { Mat4.prototype[key] = proto[key]; } //extend


function Mat3 (matrix) {
	Transformation.call(this, 3, matrix);
	if (!matrix) {
		this[0] = [1,0,0];
		this[1] = [0,1,0];
		this[2] = [0,0,1];
	}
}

var proto = {
	spawn: function (size) {
		return new Mat3(); // ignore size
	},
	scale: function (factors) {
		if (!factors.length) //single factor given, must be uniform scale
			return this.append(Transformation.UniformScale(3, factors));

		if (factors.length !== 2) throw 'Mat3.scale() takes either a single number of a vector of length 2';
		return this.append(Transformation.Scale(factors));
	},
	translate: function (offset) {
		if (offset.length !== 2) throw 'Mat3.translate() takes a vector with length 2';
		return this.append(Transformation.Translate(offset));
	},
	rotate: function (angle) {

		var cos = Math.cos( radians(angle) );
		var sin = Math.sin( radians(angle) );

		return this.append(new Mat3([
			[cos, -sin, 0],
			[sin,  cos, 0],
			[  0,    0, 1],
		]));
	},
};

Mat3.prototype = Object.create(Transformation.prototype);
for (var key in proto) { Mat3.prototype[key] = proto[key]; } //extend

function Vector(length) {
	Array.call(this, length);
	this.length = length || 0; // Array.length doesn't inherit properly, manually fix it
}

Vector.fromArray = function (ar) {
	var res = new Vector();
	res.push.apply(res, ar);
	return res;
};

Vector.equal = function (u, v) {
	if (u.length !== v.length) return false;
	for (var i = 0; i < u.length; i++) if (u[i] !== v[i]) return false;
	return true;
};

Vector.add = function (u, v) {
	if (u.length !== v.length) throw "expects vectors of same length";
	var res = new Vector();
	for (var i = 0; i < u.length; i++) {
		res.push(u[i]+v[i]);
	}
	return res;
};

Vector.subtract = function (u, v) {
	if (u.length !== v.length) throw "expects vectors of same length";
	var res = new Vector();
	for (var i = 0; i < u.length; i++) {
		res.push(u[i]-v[i]);
	}
	return res;
};

Vector.multiply = function (u, v) {
	if (u.length !== v.length) throw "expects vectors of same length";
	var res = new Vector();
	for (var i = 0; i < u.length; i++) {
		res.push(u[i]*v[i]);
	}
	return res;
};

Vector.dot = function (u, v) {

	if (u.length != v.length) throw "expects vectors of same length";

	var res = 0;
	for (var i = 0; i < u.length; i++) {
		res += u[i]*v[i];
	}
	return res;
};

Vector.cross = function (u, v) {

	if (u.length < 3) throw "First argument is not a vector of at least 3";
	if (v.length < 3) throw "Second argument is not a vector of at least 3";

	var result = Vector.fromArray([ 
		u[1]*v[2] - u[2]*v[1],
		u[2]*v[0] - u[0]*v[2],
		u[0]*v[1] - u[1]*v[0]
	]);

	return result;
};

var proto = {
	slice: function (start, end) {
		return Vector.fromArray(Array.prototype.slice.call(this,start,end));
	},
	negate: function () {
		var result = new Vector();
		for ( var i = 0; i < this.length; ++i ) {
			result.push( -this[i] );
		}
		return result;
	},
	magnitude: function () {
		var squared = 0;
		for (var i = 0; i < this.length; i++) {
			squared += this[i] * this[i];
		}
		return Math.sqrt(squared);
	},
	scale: function (factor, preserveLast) {
		var result = new Vector();
		for ( var i = 0; i < this.length; ++i ) {
			result.push(preserveLast && i == this.length-1 ? this[i] : this[i] * factor);
		}
		return result;
	},
	normalize: function (preserveLast) {
		var vec = preserveLast ? this.slice(0,-1) : this;
		var mag = vec.magnitude();
		if (!isFinite(mag)) throw "Can't normalize vector with zero magnitude";

		var result = vec.scale(1/mag);

		if (preserveLast) result.push(this[this.length-1]);
		return result;
	},
	add: function (v) {return Vector.add(this, v);},
	subtract: function (v) {return Vector.subtract(this, v);},
	dot: function (v) {return Vector.dot(this, v);},
	cross: function (v) {return Vector.cross(this, v);},
	equal: function (v) {return Vector.equal(this, v);},
};

Vector.prototype = Object.create(Array.prototype);
for (var key in proto) { Vector.prototype[key] = proto[key]; } //extend

function _argumentsToArray( args ) {
	return [].concat.apply( [], Array.prototype.slice.apply(args) );
}

function vec2() {
	var res = new Vector();
	res.push.apply(res, _argumentsToArray(arguments));
	if (res.length > 2) res = res.slice(0,2);
	while (res.length < 2) res.push(0);
	return res;
}

function vec3() {
	var res = new Vector();
	res.push.apply(res, _argumentsToArray(arguments));
	if (res.length > 3) res = res.slice(0,3);
	while (res.length < 3) res.push(0);
	return res;
}

function vec4() {
	var res = new Vector();
	res.push.apply(res, _argumentsToArray(arguments));
	if (res.length > 4) res = res.slice(0,4);
	while (res.length < 3) res.push(0);
	if (res.length < 4) res.push(1);
	return res;
}

function radians( degrees ) {
	return degrees * Math.PI / 180.0;
}

function degrees( radians ) {
	return radians * 180.0 / Math.PI;
}
