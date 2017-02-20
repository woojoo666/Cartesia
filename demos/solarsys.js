var glwrapper;
var mCamera;
var rootCartesia = new SimpleCartesia();

window.onload = function init()
{
	// Initialize and Configure WebGL

	glwrapper = new WebGLWrapper( "gl-canvas" );

	// expose these variables for easy access
	var gl = glwrapper.gl;
	var program = glwrapper.program;

	// set lighting properties
	glwrapper.lightPosition = vec4(0,5,5, 1);
	glwrapper.lightAttenuation = 0; // how fast light fades over distance. Still needs tweaking, set this to 0 for now
	glwrapper.lightAmbient = vec4( 0.7, 0.7, 0.7, 1.0 );
	glwrapper.lightDiffuse = vec4( 0.7, 0.7, 0.7, 1.0 );
	glwrapper.lightSpecular = vec4( 1, 1, 1, 1.0 );

	//start with camera moved back 20 and up 10
	mCamera = new Camera().setParent(rootCartesia).move(vec3(0, 0, 25)); // add camera to scene
	//mCamera.movePitch(-30); //tilt down to see the whole solar system

	var world = new Planet(8).setParent(rootCartesia);
	var sunSphere = new Sphere(vec4(1,1,0.7), 1, 20, "flat").setParent(world);

	var dude = new Player(world, 90, 0);

	var dudeSphere = new Sphere(vec4(1, 1, 1), 0.1, 5, "flat").setParent(dude);
	var dudeBoundary = new BoundingSphere(0.1);
	dude.addBoundingSphere(dudeBoundary);
	dude.move(vec3(0, 1, 0));

	glwrapper.useScene(rootCartesia);
	glwrapper.useCamera(mCamera);

	glwrapper.beforeRender = function () {
		dude.updatePosition();
	};

	// starts the continuous render loop
	glwrapper.start();

	// some key bindings to show how movement works
	// moveForward will move in the direction the object is facing (based on rotation matrix only)
	document.body.onkeydown = function (e) {
		switch(e.keyCode) {
			case 37: mCamera.moveYaw(1); return; // left arrow: turn left
			case 38: mCamera.moveInDirection(vec3(0,0.25,0)); return; // up arrow: move up
			case 39: mCamera.moveYaw(-1); return; // right arrow: turn right
			case 40: mCamera.moveInDirection(vec3(0,-0.25,0)); return; // down arrow: move down
			case 74: dude.jump(); return; //'J' key: make sun jump
			case 65: dude.turn(10); return; //'A' key: Move dude left
			case 68: dude.turn(-10); return; //'D' key: Move dude right
			case 87: dude.jump(); dude.moveInDirection(vec3(0,0,-0.2)); return; //'W' key: move dude up
			case 83: dude.jump(); dude.moveInDirection(vec3(0,0,0.2)); return; //'S' key: move dude down
			case 32: console.log(Sphere.prototype.sphereArray); return; //Space bar: for debugging
		}
	};
};