Matrix Operations Performance Tests
=====================================

### General Conclusions

* Constructing arrays without populating values is very fast
* Caching performance benefits is negligible
	* Same goes for referencing member variables vs local variables
* Callbacks called within a for loop is slow (by linear factor)
	* e.g. `for` loops much faster than `Array.forEach`
	* sometimes code elegance is worth it, e.g. in `Transformation.Generate`
	* makes sense cuz function overhead takes time, slows down each iteration
	* effect magnified for nested functions, discouraging callback wrapper patterns like this:

		[1,2,3].forEach(function wrapper(elem) {
			callback.call(this, elem+1);
		})

* bind() is REALLY slow


Transformation Construction ([Results](http://jsperf.com/woojoo666-tranformation-construct))
-----------------------------------------------------------------------------------------------

### Push Identity

```js
var transformation = [];
for (var r = 0; r < size; r++) {
	var row = [];
	for (var c = 0; c < size; c++) {
		row.push(r == c ? 1 : 0);
	}
	transformation.push(row);
}
```

### Push Zeros

```js
var transformation = [];
for (var r = 0; r < size; r++) {
	var row = [];
	for (var c = 0; c < size; c++) {
		row.push(0);
	}
	transformation.push(row);
}
```

### Array Constructor Nulls

```js
var transformation = new Array(size);
for (var r = 0; r < size; r++) {
	transformation[r] = new Array(size);
}
```

### Array Constructor Identity

```js
var transformation = new Array(size);
for (var r = 0; r < size; r++) {
	transformation[r] = new Array(size);
	for (var c = 0; c < size; c++) {
		transformation[r][c] = r == c ? 1 : 0;
	}
}
```

### Array Constructor Zeros

```js
var transformation = new Array(size);
for (var r = 0; r < size; r++) {
	transformation[r] = new Array(size);
	for (var c = 0; c < size; c++) {
		transformation[r][c] = 0;
	}
}
```


Transformation Cell Iteration ([Results](http://jsperf.com/woojoo666-transformation-cell-getter/3))
----------------------------------------------------------------------------------------------------

```js
function Transformation(size, matrix) {
	Array.call(this, size);
	this.length = size; // Array.length doesn't inherit propertly, manually fix it
	this.size = size;
	for (var r = 0; r < size; r++) {
		this[r] = new Array(size);
	}
}

var proto = {
	row: function(i) {
		return this[i];
	},
	forEachRow: function (callback) {
		//array.forEach does what we need :D
		this.forEach(callback, this); //have to pass in $this in non-strict mode
	},
	forCellInRow: function (r, callback) {
		this.row(r).forEach(function(cell, c) {
			callback(cell,r,c);
		}, this);
	}
};

Transformation.prototype = Object.create(Array.prototype);
for (var key in proto) { Transformation.prototype[key] = proto[key]; } //extend

var transformation = new Transformation(111);
```

### For Loops

```js
var sum = 0;
for (var r = 0; r < transformation.size; r++) {
	for (var c = 0; c < transformation.size; c++) {
		sum += transformation[r][c];
	}
}
```

### forEach

```js
var sum = 0;
transformation.forEachRow(function(row,r) {
	transformation.forCellInRow(r, function (cell) {
		sum += cell;
	});
});
```

### Hybrid

```js
var sum = 0;
transformation.forEachRow(function(row) {
	row.forEach(function (cell) {
		sum += cell;
	});
});
```


Transformation Generate ([Results](http://jsperf.com/woojoo666-transformation-generate))
------------------------------------------------------------------------------------------

```js
function Transformation(size, matrix) {
	Array.call(this, size);
	this.length = size; // Array.length doesn't inherit properly, manually fix it
	this.size = size;
	for (var r = 0; r < size; r++) {
		this[r] = new Array(size);
	}
}

Transformation.Generate = function (size, callback) {
	var res = new Transformation(size);
	res.forEachCell(function (cell, r,c) {
		res[r][c] = callback(r,c) || 0; //if callback doesn't return anything use 0
	});
	return res;
};

Transformation.GenerateManual = function (size, callback) {
	var res = new Transformation(size);
	for (var r = 0; r < res.size; r++) {
		for (var c = 0; c < res.size; c++) {
			res[r][c] = callback(r,c) || 0; //if callback doesn't return anything use 0
		}
	}
	return res;
};

var proto = {
	forEachCell: function (callback) {
		for (var r = 0; r < this.size; r++) {
			for (var c = 0; c < this.size; c++) {
				callback.call(this, this[r][c], r, c);
			}
		}
	}
};

Transformation.prototype = Object.create(Array.prototype);
for (var key in proto) { Transformation.prototype[key] = proto[key]; } //extend

function pseudoRandom (r, c) {
	return Math.sin(r+c);
}
```

### Manual

```js
var transformation = new Transformation(111);
for (var r = 0; r < this.size; r++) {
	for (var c = 0; c < this.size; c++) {
		transformation[r][c] = Math.sin(r+c);
	}
}
```

### Manual Using Callback

```js
var transformation = new Transformation(111);
for (var r = 0; r < this.size; r++) {
	for (var c = 0; c < this.size; c++) {
		transformation[r][c] = pseudoRandom(r,c);
	}
}
```

### forEachCell

```js
var transformation = new Transformation(111);
transformation.forEachCell(function (cell, r, c) {
	this[r][c] = Math.sin(r+c);
});
```

### forEachCell Using Callback

```js
var transformation = new Transformation(111);
transformation.forEachCell(function (cell, r, c) {
	this[r][c] = pseudoRandom(r,c);
});
```

### Transformation.GenerateManual

```js
var transformation = Transformation.GenerateManual(111, pseudoRandom);
```

### Transformation.Generate

```js
var transformation = Transformation.Generate(111, pseudoRandom);
```


Transformation Generate ([Results](http://jsperf.com/woojoo666-transformation-multiply))
------------------------------------------------------------------------------------------

```js
function Transformation(size, matrix) {
	Array.call(this, size);
	this.length = size; // Array.length doesn't inherit properly, manually fix it
	this.size = size;
	for (var r = 0; r < size; r++) {
		this[r] = new Array(size);
	}
}

Transformation.Generate = function (size, callback) {
	var res = new Transformation(size);
	for (var r = 0; r < res.size; r++) {
		for (var c = 0; c < res.size; c++) {
			res[r][c] = callback.call(res,r,c) || 0; //if callback doesn't return anything use 0
		}
	}
	return res;
};

var proto = {
	forEachCell: function (callback) {
		for (var r = 0; r < this.size; r++) {
			for (var c = 0; c < this.size; c++) {
				callback.call(this, this[r][c], r, c);
			}
		}
	},
	append: function(right) {
		var left = this;
		return Transformation.Generate(left.size, function (r, c) {
			var sum = 0;
			for (var k = 0; k < this.size; k++)
				sum += left[r][k] * right[k][c];
			return sum;
		});
	},
	appendCachedCallback: function(right) {
		var left = this;
		function multiplier(r, c) {
			var sum = 0;
			for (var k = 0; k < left.size; k++)
				sum += left[r][k] * right[k][c];
			return sum;
		}
		return Transformation.Generate(left.size, multiplier);
	}
};

Transformation.prototype = Object.create(Array.prototype);
for (var key in proto) { Transformation.prototype[key] = proto[key]; } //extend

function pseudoRandom (r,c) {
	return Math.sin(r+c);
}

function pseudoRandom2 (r,c) {
	return Math.sin(r+c+100);
}

function mult( u, v )
{
	var result = [];

	for ( var i = 0; i < u.length; ++i ) {
		result.push( [] );

		for ( var j = 0; j < v.length; ++j ) {
			var sum = 0.0;
			for ( var k = 0; k < u.length; ++k ) {
				sum += u[i][k] * v[k][j];
			}
			result[i].push( sum );
		}
	}

	return result;
}

var left = Transformation.Generate(10, pseudoRandom);
var right = Transformation.Generate(10, pseudoRandom2);
```

### mult

```js
var res = mult(left, right);
```

### Manual

```js
var res = new Transformation(10);
for (var r = 0; r < res.size; r++) {
	for (var c = 0; c < res.size; c++) {
		var sum = 0;
		for (var k = 0; k < res.size; k++) {
			sum += left[r][k] * right[k][c];
		}
		res[r][c] = sum;
	}
}
```

### Manual Direct Reference

```js
var res = new Transformation(10);
for (var r = 0; r < res.size; r++) {
	for (var c = 0; c < res.size; c++) {
		res[r][c] = 0;
		for (var k = 0; k < res.size; k++) {
			res[r][c] += left[r][k] * right[k][c];
		}
	}
}
```

### Generate

```js
var res = Transformation.Generate(left.size, function (r, c) {
	var sum = 0;
	for (var k = 0; k < this.size; k++)
		sum += left[r][k] * right[k][c];
	return sum;
});
```

### Append

```js
var res = left.append(right);
```

### Append Cached Callback

```js
var res = left.appendCachedCallback(right);
```

Transformation Cell Map ([Results](http://jsperf.com/woojoo666-transformation-cell-map))
----------------------------------------------------------------------------------------

```js
function Transformation(size, matrix) {
	Array.call(this, size);
	this.length = size; // Array.length doesn't inherit properly, manually fix it
	this.size = size;
	for (var r = 0; r < size; r++) {
		this[r] = new Array(size);
	}
}

Transformation.Generate = function (size, callback) {
	var res = new Transformation(size);
	for (var r = 0; r < res.size; r++) {
		for (var c = 0; c < res.size; c++) {
			res[r][c] = callback.call(res,r,c) || 0; //if callback doesn't return anything use 0
		}
	}
	return res;
};

var proto = {
	forEachCell: function (callback) {
		for (var r = 0; r < this.size; r++) {
			for (var c = 0; c < this.size; c++) {
				callback.call(this, this[r][c], r, c);
			}
		}
	},
};

Transformation.prototype = Object.create(Array.prototype);
for (var key in proto) { Transformation.prototype[key] = proto[key]; } //extend

function pseudoRandom (r,c) {
	return Math.sin(r+c);
}

function callback (cell,r,c) {
	return this[c][r];
}

var transform = Transformation.Generate(10, pseudoRandom);
```

### Control (Won't Generalize)

```js
// Won't generalize because doesn't pass in parent cells
var transposed = Transformation.Generate(transform.size, function (r,c) {
	return transform[c][r];
});
```

### Manual

```js
var transposed = new Transformation(transform.size);
for (var r = 0; r < transform.size; r++) {
	for (var c = 0; c < transform.size; c++) {
		transposed[r][c] = callback.call(transform,transform[r][c],r,c) || 0; //if callback doesn't return anything use 0
	}
}
```

### Generate

```js
var transposed = Transformation.Generate(transform.size, function(r,c) {
	// call callback with parent as $this and pass in parent cells
	return callback.call(transform, transform[r][c],r,c);
});
```

### Generate Bind (also won't generalize)

```js
// Won't generalize because doesn't pass in parent cells
var transposed = Transformation.Generate(transform.size, callback.bind(transform, null));
```

### forEachCell

```js
var transposed = new Transformation(transform.size);
transform.forEachCell(function(cell, r, c) {
	transposed[r][c] = callback.call(this,cell,r,c);
});
```
