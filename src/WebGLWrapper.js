function WebGLWrapper (canvasId, shaders) {
	var canvas = document.getElementById( canvasId );

	var gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }

	//
	//  Configure WebGL
	//
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
	gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
	gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

	this.canvas = canvas;
	this.gl = gl;
	this.loadedHandlers = {}; // used to cache loaded shaders

	this.useShaders(shaders || PhongShader);

	this.lightPosition = vec4(5,3,5, 1);
	this.lightAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
	this.lightDiffuse = vec4( 0.7, 0.7, 0.7, 1.0 );
	this.lightAttenuation = 0.05;
	this.lightSpecular = vec4( 1, 1, 1, 1.0 );

	this.scene = null;
	this.camera = null;
	this.started = true;

	this.verticesCache = {}; // hashmap cache for vertex buffers
	this.normalsCache = {}; // hashmap cache for normal buffers

	//globally accessable constants for easy access
	WebGLWrapper.POINTS = gl.POINTS;
	WebGLWrapper.LINES = gl.LINES;
	WebGLWrapper.LINE_LOOP = gl.LINE_LOOP;
	WebGLWrapper.LINE_STRIP = gl.LINE_STRIP;
	WebGLWrapper.TRIANGLES = gl.TRIANGLES;
	WebGLWrapper.TRIANGLE_STRIP = gl.TRIANGLE_STRIP;
	WebGLWrapper.TRIANGLE_FAN = gl.TRIANGLE_FAN;
}

WebGLWrapper.prototype = {
	gl: null,
	program: null,
	canvas: null,
	pUniform: null,
	mvUniform: null,
	// a factory style method for creating a new shader handler if needed, or loading one from cache
	// if one was already created for this glwrapper
	useShaders: function ( shaderClass ) {

		gl = this.gl;

		if (this.shaderHandler) this.shaderHandler.disableAttributes(); // disable old shader's attribute pointers

		if (!shaderClass.prototype.key) throw "shader container needs a key (unique id) for caching!";

		var handler = this.loadedHandlers[shaderClass.prototype.key]; // try and load it from cache

		if (!handler) {
			// not created yet! Create and cache it

			handler = Object.create(shaderClass.prototype); // create a new handler
			shaderClass.call(handler, this); // call constructor with this

			this.loadedHandlers[shaderClass.prototype.key] = handler; // cache the handler for quick reuse
		}

		gl.useProgram( handler.program );

		handler.initUniforms();
		handler.initBuffersAndAttributes();
		this.shaderHandler = handler;
	},
	useScene: function (cartesia) {
		this.scene = cartesia;
	},
	useCamera: function (camera) {
		this.camera = camera;
	},
	beforeRender: function () {
		// Called before each render, override this in your instance!
	},
	render: function () {
		this.beforeRender();

		this.gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.

		this.shaderHandler.renderScene(this.scene, this.camera);
	},
	start: function () {
		this.started = true;
		var self = this;
		(function animloop(){
			if (self.started) setTimeout(function(){requestAnimFrame(animloop);}, 40);
			self.render();
		})();
	},
	stop: function () {
		this.started = false;
	},
	createTexture: function ( image , magFilter, minFilter, wrapS, wrapT ) {
		var gl = this.gl;

		// create texture, and bind it so we can set its parameters
		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0); // use texture register 0 for binding
		gl.bindTexture( gl.TEXTURE_2D, texture );

		// set texture parameters
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
		gl.generateMipmap( gl.TEXTURE_2D );
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

		// unbind the buffer
		gl.bindTexture( gl.TEXTURE_2D, null );

		return texture;
	},
};
