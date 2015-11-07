
var gl;
var canvas;
var aspect;
var program;
var mvMatrix;
var vertexPositionAttribute;
var perspectiveMatrix;
var cubes;
var mCamera;
var moons = [];

window.onload = function init()
{
    // Initialize and Configure WebGL

    initWebGL();

    // Load the data into the GPU

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var colorUniform = gl.getUniformLocation(program, "fColor");

    cubeColors = [
        vec4(  1,   0, 0.5),
        vec4(0.5,   1, 0.5),
        vec4(  1, 0.5, 0.5),
        vec4(  0, 0.5,   1),
        vec4(0.5,   1,   0),
        vec4(0.5,   0,   1),
        vec4(  1,   1,   0),
        vec4(  1,   0,   1),
    ];

    cubes = [
        // create a cube of cubes
        //      7    6
        //    3    2  
        //           
        //      4    5
        //    0    1

        vec3(-10, -10,  10),
        vec3( 10, -10,  10),
        vec3( 10,  10,  10),
        vec3(-10,  10,  10),
        vec3(-10, -10, -10),
        vec3( 10, -10, -10),
        vec3( 10,  10, -10),
        vec3(-10,  10, -10),
    ].map(function (pos, indx) {
        return new Cube(gl, colorUniform, cubeColors[indx], pos);
    });

    cubes.forEach(function (cube) {
        cube.scaleAngle = 0;
    });

    var pUniform = gl.getUniformLocation(program, "uPMatrix");
    var mvUniform = gl.getUniformLocation(program, "uMVMatrix");

    //start with camera moved back 6 units
    mCamera = new Camera(gl, pUniform, mvUniform, canvas.width/canvas.height, vec3(0, 0, -50));

    document.body.onkeypress = function (e) {
        switch (String.fromCharCode(e.charCode)) {
            case "c": rotateColors(); return;
            case "w": case "i": mCamera.move(vec3(0,0,0.25)); return; //move forward
            case "a": case "j": mCamera.move(vec3(-0.25,0,0)); return; //move left
            case "d": case "k": mCamera.move(vec3(0.25,0,0)); return; //move right
            case "s": case "m": mCamera.move(vec3(0,0,-0.25)); return; //move back
            case "r": mCamera.reset(); return;
            case "+": mCamera.drawCrosshair = ~mCamera.drawCrosshair; return;
            case "n": adjustCanvasWidth(-1); return; //make canvas narrower
            case "w": adjustCanvasWidth(1); return; //make canvas wider
            case "f": 
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                gl.viewport( 0, 0, canvas.width, canvas.height );
                mCamera.setAspect(canvas.width/canvas.height);
            return;
        }
    };
    
    document.body.onkeydown = function (e) {
        switch(e.keyCode) {
            case 37: mCamera.moveYaw(1); return; // left arrow: turn left
            case 38: mCamera.move(vec3(0,0.25,0)); return; // up arrow: move up
            case 39: mCamera.moveYaw(-1); return; // right arrow: turn right
            case 40: mCamera.move(vec3(0,-0.25,0)); return; // down arrow:
        }
    };

    [
        vec3(1,0,0),
        vec3(0,1,0),
        vec3(0,0,1),
        vec3(0,1,1),
        vec3(1,0,1),
        vec3(1,1,0)
    ].forEach(function (axis, i) {
        var moon = new Cube(gl, colorUniform, cubeColors[i]);
        moon.alphaAngle = 0;
        moon.offset = axis.slice();
        moon.offset.push(moon.offset.shift());
        moon.offset = transform(moon.offset, scaleMatrix(3+i));
        moon.offsetAngle = 0;
        moon.offsetAxis = axis;
        moon.scaleAngle = 0;
        moon.scale(0.5);
        moons.push(moon);
    });

    setInterval(render,10);
};

function adjustCanvasWidth(adjustment) {
    canvas.width += adjustment;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    mCamera.setAspect(canvas.width/canvas.height);
}

function rotateColors() {
    cubeColors.push(cubeColors.shift());
    cubes.forEach(function (cube, indx) {
        cube.color = cubeColors[indx];
    });
}

var rotation = mat4();

var cubeRotation = mat4();

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.

    mCamera.place();
    
    //naughty cube
    cubes[0].rotate(2,[0,0,1]);
    cubes[1].rotate(2,[0,1,1]);
    cubes[2].rotate(2,[1,1,1]);
    cubes[3].rotate(2,[0,1,0]);
    cubes[4].rotate(2,[1,0,1]);
    cubes[5].rotate(2,[1,0,0]);
    cubes[6].rotate(2,[0,1,0]);
    cubes[7].rotate(2,[1,0,1]);

    cubes.forEach(function (cube, i) {
        cube.scaleAngle += 1 + i;
        cube.mScale = 1 + 0.2*Math.cos(radians(cube.scaleAngle));
    });

    moons.forEach(function (moon, index) {
        moon.offsetAngle += [4,3,2,1,3,2][index];

        moon.scaleAngle += 1.5;
        var moonOffset = transform(moon.offset, scaleMatrix(1 + 0.85*Math.cos(radians(moon.scaleAngle))));
        moonOffset = transform(moonOffset, rotate(moon.offsetAngle, moon.offsetAxis));
        moon.position = add(vec3(), moonOffset);
        moon.rotate(2,[1,0,1]);

        moon.alphaAngle += 1 + index;
        moon.color = cubeColors[index].slice();
        moon.color[3] = 0.5 + 0.5*Math.cos(radians(moon.scaleAngle));
    
    });

    //cubes[0].scale(1.001);

    // Draw

    cubes.forEach(function (cube) {cube.draw();});
    moons.forEach(function (moon) {moon.draw();});
}

function initWebGL() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
}

function transform(vectors, transformation) {
    if (vectors[0].length) {
        //multiple vectors, transform all of them
        return vectors.map( function (vector) {
            return transformVector(vector, transformation);
        });
    } else {
        //one vector, transform it
        return transformVector(vectors, transformation);
    }
}

function transformVector(vector, transformation) {

    var result = [];

    // turn it into a 4d vector for the transformation
    var vector4 = vec4.apply(this||window, vector);

    if ( !transformation.matrix ) {
        throw "transformVector(): $transformation is not a matrix";
    }

    var transposed = transpose(transformation);
    if ( transposed.length != vector4.length) {
        throw "transformVector(): different dimensions";
    }

    for ( var col = 0; col < transposed[0].length; ++col ) {
        var res = 0;
        for ( var row = 0; row < transposed.length; ++row ) {
            res +=  vector4[row] * transposed[row][col];
        }
        result.push(res);
    }

    var vector3 = vec3.apply(this||window, result);

    return vector3;
}


function scaleMatrix( x )
{
    var result = mat4();
    result[0][0] = x;
    result[1][1] = x;
    result[2][2] = x;

    return result;
}
