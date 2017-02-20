Cartesia
========

_A simple, easy to use framework for WebGL._

Cartesia is founded on the concept of a [Scene Graph](https://en.wikipedia.org/wiki/Scene_graph), where all objects and transformations are relative to parent objects. Each of these objects/transformations can be thought of as a new coordinate plane, which we call a `Cartesia`. However, Cartesia also has many other features, including shader switching, buffer caching, and camera manipulation. See the `demos/` folder for some simple examples, and `demos/game/` for a fully fledged game made using Cartesia.

### Including

download `dist/cartesia.min.js` or link the latest version directly using gitraw:

```html
<script type="text/javascript" src="https://rawgit.com/woojoo666/Cartesia/master/dist/cartesia.min.js"></script>
```

### Creating Objects

```js
var rootCartesia = new SimpleCartesia(); // create a cartesia at the "root" of the scene graph

var revolve = new SimpleCartesia() // create a cartesia that will simply rotate around the y-axis
	.setParent(rootCartesia); // "attach" to root cartesia

var cube = new Cube(vec4(1,1,1)) // create a flat-shaded sphere at position (1,1,0.7) with radius 4 and complexity 20
	.setParent(rootCartesia) // "attach" to the revolve cartesia
	.setPosition(vec3(0,0,1)) // start 1 unit backwards
```

### Creating Lights

```js
// red light on the left
var light = new LightCartesia(vec4( 0.7, 0, 0, 1.0 ))
	.setParent(rootCartesia)
	.move(vec3(0,0,3));
```

### Creating a Scene

```js
glwrapper = new WebGLWrapper( "gl-canvas" );

// set global lighting properties
glwrapper.lightPosition = vec4(0,0,5, 1);
glwrapper.lightAttenuation = 0; // how fast light fades over distance. Still needs tweaking, set this to 0 for now
glwrapper.lightAmbient = vec4( 0.7, 0.7, 0.7, 1.0 );
glwrapper.lightDiffuse = vec4( 0.7, 0.7, 0.7, 1.0 );
glwrapper.lightSpecular = vec4( 1, 1, 1, 1.0 );

// create a camera
mCamera = new Camera()
	.setParent(rootCartesia) // "attach" to root
	.move(vec3(0, 10, 20)) // move up 10 and back 20
	.movePitch(-30); //tilt down to see the whole scene

glwrapper.useScene(rootCartesia);
glwrapper.useCamera(mCamera);
```

### Start Rendering

```js
// before every render, rotate the revolve cartesia (which will also rotate the "attached" cube)
glwrapper.beforeRender = function () {
	revolve.moveYaw(1); // rotate the revolve cartesia around the y-axis
};

glwrapper.start();
```

### Shader Switching

If we want to use alternate between shaders during render, like for [deferred rendering](https://gamedevelopment.tutsplus.com/articles/forward-rendering-vs-deferred-rendering--gamedev-12342), we can override the `GLWrapper.render()` function. The code sample below is taken directly from the `demos/deferredrendering.html` demo (and not related to the code samples above).

```js
glwrapper.render = function () {

	this.beforeRender();

	var gl = this.gl;

	glwrapper.lights = [];

	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.

	this.useShaders(GBufferShader);

	gl.disable(gl.BLEND);

	gl.enable(gl.DEPTH_TEST);
	gl.depthMask(true);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); // Clear gbuffer

	this.shaderHandler.renderScene(this.scene, this.camera);

	this.useShaders(PhongQuadShader);
	gl.disable(gl.DEPTH_TEST); // everything should be drawn on top
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); // clear frame buffer

	gl.blendFunc(gl.ONE, gl.ONE);
	gl.enable(gl.BLEND);

	this.shaderHandler.renderScene();
};

glwrapper.start();
```
