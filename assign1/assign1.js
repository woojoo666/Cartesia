//TODO: make center cubes alternate between opaque/transparent, add white edge outlines, see original CS174A/assign1 for reference

var gl;
var glwrapper;
var cubes;
var moons;
var cubeColors;

window.onload = function init() {
    // Initialize and Configure WebGL
    var glwrapper = new WebGLWrapper( "gl-canvas" , BasicShader);

    var rootCartesia = new SimpleCartesia();

    var cubeColors = [
        vec4(  1,   0, 0.5),
        vec4(0.5,   1, 0.5),
        vec4(  1, 0.5, 0.5),
        vec4(  0, 0.5,   1),
        vec4(0.5,   1,   0),
        vec4(0.5,   0,   1),
        vec4(  1,   1,   0),
        vec4(  1,   0,   1),
    ];

    var cubeRotationAxises = [
        vec3(0,0,1),
        vec3(0,1,1),
        vec3(1,1,1),
        vec3(0,1,0),
        vec3(1,0,1),
        vec3(1,0,0),
        vec3(0,1,0),
        vec3(1,0,1),
    ];

    var cubes = [
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
        var offsetCartesia = new SimpleCartesia();
        offsetCartesia.move(pos);
        var rotatedAxis = new CustomCartesia();
        rotatedAxis.setTransform(new Mat4().rotateYAxisTo(cubeRotationAxises[indx]));
        var cube = new Cube(cubeColors[indx]);
        cube.scaleAngle = 0; // create a new property for size oscillations

        rootCartesia.addChild(offsetCartesia);
        offsetCartesia.addChild(rotatedAxis);
        rotatedAxis.addChild(cube);
        return cube;
    });

    //start with camera moved back 6 units
    mCamera = new Camera();
    mCamera.move(vec3(0, 0, 50));

    document.body.onkeypress = function (e) {
        switch (String.fromCharCode(e.charCode)) {
            case "c": rotateColors(); return;
            case "w": case "i": mCamera.move(vec3(0,0,-0.25)); return; //move forward
            case "a": case "j": mCamera.move(vec3(-0.25,0,0)); return; //move left
            case "d": case "k": mCamera.move(vec3(0.25,0,0)); return; //move right
            case "s": case "m": mCamera.move(vec3(0,0,0.25)); return; //move back
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

    // make moons
    var moons = [
        vec3(1,0,0),
        vec3(0,1,0),
        vec3(0,0,1),
        vec3(0,1,1),
        vec3(1,0,1),
        vec3(1,1,0)
    ].map(function (axis, i) {
        var rotatedAxis = new CustomCartesia();
        rotatedAxis.setTransform(new Mat4().rotateYAxisTo(axis));
        var orbit = new SimpleCartesia();
        orbit.yaw = 0; // set initial orbit angle
        var moon = new Cube(cubeColors[i]);
        moon.alphaAngle = 0; // add property for alpha scaling oscillation
        moon.offset = 3+i;
        moon.move(vec3(0,0,moon.offset));
        moon.offsetScalingAngle = 0; // add property for offset oscillation
        moon.scaleBy(0.5);

        rootCartesia.addChild(rotatedAxis);
        rotatedAxis.addChild(orbit);
        orbit.addChild(moon);

        return moon;
    });

    glwrapper.useScene(rootCartesia);
    glwrapper.useCamera(mCamera);
    
    glwrapper.beforeRender = function() {

        //naughty cubes
        cubes.forEach(function (cube, i) {
            cube.moveYaw(2);
            cube.scaleAngle += 1 + i;
            cube.setScale(1 + 0.2*Math.cos(radians(cube.scaleAngle)));
        });

        moons.forEach(function (moon, index) {
            moon.parent.moveYaw([4,3,2,1,3,2][index]);

            moon.offsetScalingAngle += 1.5;
            moon.setPosition(vec3(0,0,moon.offset*(1 + 0.85*Math.cos(radians(moon.offsetScalingAngle)))));
            moon.parent.moveYaw(2); // rotate orbit cartesia

            moon.alphaAngle += 1 + index;
            moon.color = cubeColors[index].slice();
            moon.color[3] = 0.5 + 0.5*Math.cos(radians(moon.offsetScaleAngle));
        });
    };

    glwrapper.start();
};

function adjustCanvasWidth(adjustment) {
    canvas.width += adjustment;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    mCamera.setAspect(canvas.width/canvas.height);
}

function rotateColors() {
    cubeColors.push(cubeColors.shift());
    cubes.forEach(function (cube, indx) {
        cube.mesh.setColor(cubeColors[indx]);
    });
}
