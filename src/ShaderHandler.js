
// A helper class that acts as an extension to WebGLWrapper for handling shaders
function Shader(glwrapper) {
	// constructor creates a new program using its shaders

	var gl = glwrapper.gl;
	this.glwrapper = glwrapper;

	this.getExtensions();

	var vertShdr;
	var fragShdr;

	vertShdr = gl.createShader( gl.VERTEX_SHADER );
	gl.shaderSource( vertShdr, this.vertexShader );
	gl.compileShader( vertShdr );
	if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) )
		throw "Vertex shader compilation error.\n    " + gl.getShaderInfoLog( vertShdr );

	fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
	gl.shaderSource( fragShdr, this.fragmentShader );
	gl.compileShader( fragShdr );
	if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) )
		throw "Vertex shader compilation error.\n    " + gl.getShaderInfoLog( fragShdr );

	var program = gl.createProgram();
	gl.attachShader( program, vertShdr );
	gl.attachShader( program, fragShdr );
	gl.linkProgram( program );
	
	if ( !gl.getProgramParameter( program, gl.LINK_STATUS) )
		throw "Shader program link error:\n    " + gl.getProgramInfoLog( program );

	this.program = program;
}

Shader.prototype = {
	getExtensions: function () {
	},
	// create uniform variable pointers
	initUniforms: function () {},
	// create buffers and Attributes pointers
	initBuffersAndAttributes: function () {},
	renderScene: function () {
		throw "Unimplemented Shader.renderScene()";
	},
	drawTriangleMesh: function (mesh, transform) {
		throw "Unimplemented Shader.drawTriangleMesh()";
	},
	// Converts elements to float32
	flatten: function (ar) {
		var floats = new Float32Array(ar.length);
		for ( var i = 0; i < ar.length; ++i ) floats[i] = ar[i];
		return floats;
	},
	flattenVertices: function (vertices) {
		var ar = [];
		for (var i = 0; i < vertices.length; i++) { // iterate across vertices
			for (var j = 0; j < vertices[i].length; j++) { // iterate across components
				ar.push(vertices[i][j]);
			}
		}
		return this.flatten(ar);
	},
	flattenTriangles: function (triangles) {
		var ar = [];
		for (var i = 0; i < triangles.length; i++) { // iterate across triangles
			for (var j = 0; j < triangles[i].length; j++) { // iterate across corners
				for (var k = 0; k < triangles[i][j].length; k++) { // iterate across components
					ar.push(triangles[i][j][k]);
				}
			}
		}

		return this.flatten(ar);
	},
	flattenTransform: function (transform) {
		return this.flatten(transform.flatten());
	},
};

function PhongShader (glwrapper) {
	Shader.call(this, glwrapper);
	this.vPosition = gl.getAttribLocation( this.program, "vPosition" ); // vPosition attribute index
	this.vNormal = gl.getAttribLocation( this.program, "vNormal" ); // vNormal attribute index
}

var proto = {
	key: "phong",
	/*jshint multistr: true */
	vertexShader: "\
		                                                                       \n\
		attribute vec4 vPosition;                                              \n\
		attribute vec4 vNormal;                                                \n\
		                                                                       \n\
		varying vec3 N, L, E, D;                                               \n\
		uniform mat4 CameraMat;                                                \n\
		uniform mat4 ProjectMat;                                               \n\
		uniform mat4 ModelMat;                                                 \n\
		uniform vec4 lightPosition;                                            \n\
		uniform mat3 normalMatrix;                                             \n\
		                                                                       \n\
		void main()                                                            \n\
		{                                                                      \n\
		    vec3 pos = (ModelMat * vPosition).xyz;                             \n\
		                                                                       \n\
		    // check for directional light                                     \n\
		                                                                       \n\
		    if(lightPosition.w == 0.0) {                                       \n\
		    	L = normalize(lightPosition.xyz);                              \n\
		    	D = vec3(0.0, 0.0, 0.0); // forces attenuation to 0            \n\
		    } else {                                                           \n\
		    	L = normalize( lightPosition.xyz - pos );                      \n\
		    	D = lightPosition.xyz - pos;                                   \n\
		    }                                                                  \n\
		                                                                       \n\
		    E =  -normalize( (ProjectMat * vec4(pos,1)).xyz );                 \n\
		    N = normalize( mat3(ModelMat)*vNormal.xyz);                        \n\
                                                                               \n\
		    gl_Position = CameraMat * ProjectMat * ModelMat * vPosition;       \n\
		                                                                       \n\
		}                                                                      \n\
	",
	fragmentShader: "\
		                                                                   \n\
		precision mediump float;                                           \n\
		                                                                   \n\
		uniform vec4 ambientProduct;                                       \n\
		uniform vec4 diffuseProduct;                                       \n\
		uniform vec4 specularProduct;                                      \n\
		uniform float shininess;                                           \n\
		varying vec3 N, L, E, D;                                           \n\
		                                                                   \n\
		uniform float lightAtt;                                            \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
		    vec4 fColor;                                                   \n\
		                                                                   \n\
		    vec3 Ln = normalize(L);                                        \n\
		    vec3 H = normalize( Ln + normalize(E) );                       \n\
		    vec4 ambient = ambientProduct;                                 \n\
		                                                                   \n\
		    float Kd = max( dot( Ln, N), 0.0 );                            \n\
		    vec4  diffuse = Kd*diffuseProduct;                             \n\
		                                                                   \n\
		    float Ks = pow( max(dot(N, H), 0.0), shininess );              \n\
		    vec4  specular = Ks * specularProduct;                         \n\
		                                                                   \n\
		    if( dot(L, N) < 0.0 ) specular = vec4(0.0, 0.0, 0.0, 1.0);     \n\
		                                                                   \n\
		    float attenuation = 3.0/(1.0 + lightAtt*pow(length(D), 2.0));  \n\
		                                                                   \n\
		    fColor = ambient + attenuation*(diffuse + specular);           \n\
		    fColor.a = 1.0;                                                \n\
		                                                                   \n\
		    gl_FragColor = fColor;                                         \n\
		}                                                                  \n\
	",
	getExtensions: function () {},
	initUniforms: function () {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;
		var program = this.program;

		this.cameraUniform = gl.getUniformLocation(program, "CameraMat");
		this.projectUniform = gl.getUniformLocation(program, "ProjectMat");
		this.modelUniform = gl.getUniformLocation(program, "ModelMat");
		this.colorUniform = gl.getUniformLocation(program, "fColor");
	},
	// Create Buffers and Attributes
	initBuffersAndAttributes: function () {
		var program = this.program;

		gl.enableVertexAttribArray( this.vPosition );
		gl.enableVertexAttribArray( this.vNormal );

		this.dynamicVerticesBuffer = gl.createBuffer();
		this.dynamicNormalsBuffer = gl.createBuffer();
	},
	disableAttributes: function () {
		var gl = this.glwrapper.gl;
		gl.disableVertexAttribArray( this.vPosition );
		gl.disableVertexAttribArray( this.vNormal );
	},
	renderScene: function (scene, camera) {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;

		if (!scene) throw "Call useScene() to set the scene before calling draw()!";
		if (!camera) throw "Call useCamera() to set a camera before calling draw()!";

		// Set Matrix Uniforms

		gl.uniformMatrix4fv(this.cameraUniform, false, camera.perspective.flatten());
		gl.uniformMatrix4fv(this.projectUniform, false, camera.getAbsoluteTransform().inverse().flatten());

		// draw
		scene.draw(this, new Mat4());
	},
	drawTriangleMesh: function (mesh, transform) {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;
		var program = this.program;

		if (mesh.key) {

			if (!glwrapper.verticesCache[mesh.key] || !glwrapper.normalsCache[mesh.key]) { // if not already cached
				// create a new buffer, load the data, and cache the buffer
				var vertexBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, this.flattenTriangles( mesh.triangles ), gl.STATIC_DRAW);
				glwrapper.verticesCache[mesh.key] = vertexBuffer;

				// do the same for normals
				var normalBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, this.flattenTriangles( mesh.normals ), gl.STATIC_DRAW);
				glwrapper.normalsCache[mesh.key] = normalBuffer;
			}

			// for each buffer, bind it and link its shader attribute
			gl.bindBuffer(gl.ARRAY_BUFFER, glwrapper.verticesCache[mesh.key]);
			gl.vertexAttribPointer( this.vPosition, 3, gl.FLOAT, false, 0, 0 );
			gl.bindBuffer(gl.ARRAY_BUFFER, glwrapper.normalsCache[mesh.key]);
			gl.vertexAttribPointer( this.vNormal, 3, gl.FLOAT, false, 0, 0 );

		} else {
			// use the buffers reserved for dynamic meshes, and load the data
			gl.bindBuffer(gl.ARRAY_BUFFER, glwrapper.dynamicVerticesBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.flattenTriangles( mesh.triangles ), gl.STATIC_DRAW);
			gl.vertexAttribPointer( this.vPosition, 3, gl.FLOAT, false, 0, 0 );

			gl.bindBuffer(gl.ARRAY_BUFFER, glwrapper.dynamicNormalsBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.flattenTriangles( mesh.normals ), gl.STATIC_DRAW);
			gl.vertexAttribPointer( this.vNormal, 3, gl.FLOAT, false, 0, 0 );
		}

		if (mesh.color && mesh.color[3] <= 0) return; //if alpha less than or equal to zero, just don't draw it

		var ambientProduct = Vector.multiply(glwrapper.lightAmbient, mesh.ambient);
		var diffuseProduct = Vector.multiply(glwrapper.lightDiffuse, mesh.diffuse);
		var specularProduct = Vector.multiply(glwrapper.lightSpecular, mesh.specular);

		gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"), this.flatten(glwrapper.lightPosition) );
		gl.uniform1f( gl.getUniformLocation(program,"lightAtt"), glwrapper.lightAttenuation );

		gl.uniform4fv( gl.getUniformLocation(program,"ambientProduct"), this.flatten(ambientProduct) );
		gl.uniform4fv( gl.getUniformLocation(program,"diffuseProduct"), this.flatten(diffuseProduct) );
		gl.uniform4fv( gl.getUniformLocation(program,"specularProduct"), this.flatten(specularProduct) );
		gl.uniform1f( gl.getUniformLocation(program,"shininess"), mesh.shininess );

		gl.uniformMatrix4fv(this.modelUniform, false, this.flattenTransform(transform));

		gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles.length*3);
	},
};

PhongShader.prototype = Object.create(Shader.prototype);
for (var prop in proto) PhongShader.prototype[prop] = proto[prop]; //extend


function GouraudShader (glwrapper) {
	PhongShader.call(this, glwrapper);
}

var proto = {
	key: "gouraud",
	/*jshint multistr: true */
	vertexShader: "\
		                                                                              \n\
		attribute vec3 vPosition;                                                     \n\
		attribute vec3 vNormal;                                                       \n\
		                                                                              \n\
		varying vec4 fColor;                                                          \n\
		                                                                              \n\
		uniform mat4 ModelMat;                                                        \n\
		uniform mat4 CameraMat;                                                       \n\
		uniform mat4 ProjectMat;                                                      \n\
		                                                                              \n\
		uniform vec4 ambientProduct, diffuseProduct, specularProduct;                 \n\
		                                                                              \n\
		uniform vec4 lightPosition;                                                   \n\
		uniform float lightAtt;                                                       \n\
		uniform float shininess;                                                      \n\
		uniform mat3 normalMatrix;                                                    \n\
		                                                                              \n\
		                                                                              \n\
		void                                                                          \n\
		main()                                                                        \n\
		{                                                                             \n\
		    vec4 vPos4 = vec4(vPosition, 1);                                          \n\
		                                                                              \n\
		    vec3 pos = (ModelMat * vPos4).xyz; //pos from eye (origin)                \n\
		    vec3 toLight; //vector from vertex position to light source               \n\
		                                                                              \n\
		    float attenuation;                                                        \n\
		                                                                              \n\
		    // check for directional light                                            \n\
		    if(lightPosition.w == 0.0) {                                              \n\
		        toLight = normalize(lightPosition.xyz);                               \n\
		        attenuation = 1.0;                                                    \n\
		    } else {                                                                  \n\
		        toLight = normalize( lightPosition.xyz - pos );                       \n\
		        float distance = length(lightPosition.xyz - pos);                     \n\
		        attenuation = 1.0/(1.0 + lightAtt * pow(distance, 2.0));              \n\
		    }                                                                         \n\
		                                                                              \n\
		                                                                              \n\
		    vec3 toEye = -normalize( pos ); //vertex to eye (note: eye at origin)     \n\
		                                                                              \n\
		    vec3 halfway = normalize( toLight + toEye ); //Halfway vector             \n\
		                                                                              \n\
		    //transform vertex normal to match object transform                       \n\
		    vec3 N = normalize( mat3(ModelMat) * vNormal);                            \n\
		                                                                              \n\
		    // Compute terms in the illumination equation                             \n\
		    vec4 ambient = ambientProduct;                                            \n\
		                                                                              \n\
		    float Kd = max( dot(toLight, N), 0.0 );                                   \n\
		    vec4  diffuse = Kd*diffuseProduct;                                        \n\
		                                                                              \n\
		    float Ks = pow( max(dot(N, halfway), 0.0), shininess );                   \n\
		    vec4  specular = Ks * specularProduct;                                    \n\
		                                                                              \n\
		    if( dot(toLight, N) < 0.0 ) {                                             \n\
		    specular = vec4(0.0, 0.0, 0.0, 1.0);                                      \n\
		    }                                                                         \n\
		                                                                              \n\
		    gl_Position = CameraMat * ProjectMat * ModelMat * vPos4;                  \n\
		                                                                              \n\
		    fColor = ambient + attenuation*(diffuse + specular);                      \n\
		                                                                              \n\
		    fColor.a = 1.0;                                                           \n\
		}                                                                             \n\
	",
	fragmentShader: "\
		precision mediump float;     \n\
		varying vec4 fColor;         \n\
		                             \n\
		void main() {                \n\
		    gl_FragColor = fColor;   \n\
		}                            \n\
    ",
    // everything else inherited from PhongShader
};

GouraudShader.prototype = Object.create(PhongShader.prototype);
for (var prop in proto) GouraudShader.prototype[prop] = proto[prop]; //extend

// Technically PhongShader should inherit from BasicShader, because PhongShader
// is just BasicShader with normals. However, to do this cleanly, I would have to
// split a bunch of the processes up, eg for drawTriangleMesh() I would split off the buffer
// and attribute binding into a separate loadBuffersAndAttributes() function which
//   * calls glwrapper's retrieveBuffer() (which calls this shader's 
//     createBuffer() if the buffer isn't already cached)
//   * binds the buffers and attribute pointers
// and then Phong shader could just override that to account for normals
function BasicShader (glwrapper) {
	Shader.call(this, glwrapper);
	this.vPosition = gl.getAttribLocation( this.program, "vPosition" );
}

var proto = {
	key: "basic",
	/*jshint multistr: true */
	vertexShader: "\
		                                                                       \n\
		attribute vec4 vPosition;                                              \n\
		                                                                       \n\
		uniform mat4 CameraMat;                                                \n\
		uniform mat4 ProjectMat;                                               \n\
		uniform mat4 ModelMat;                                                 \n\
		                                                                       \n\
		void main()                                                            \n\
		{                                                                      \n\
		    gl_Position = CameraMat * ProjectMat * ModelMat * vPosition;       \n\
		}                                                                      \n\
	",
	fragmentShader: "\
		                                                                   \n\
		precision mediump float;                                           \n\
		                                                                   \n\
		uniform vec4 fColor;                                               \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
		    gl_FragColor = fColor;                                         \n\
		}                                                                  \n\
	",
	initUniforms: PhongShader.prototype.initUniforms,
	// like WebGLWrapper, but no normal vertex attribute
	initBuffersAndAttributes: function () {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;
		var program = this.program;

		gl.enableVertexAttribArray( this.vPosition );

		glwrapper.dynamicVerticesBuffer = gl.createBuffer();
	},
	disableAttributes: function () {
		this.glwrapper.gl.disableVertexAttribArray( this.vPosition );
	},
	renderScene: PhongShader.prototype.renderScene,
	// like PhongShader, but no lighting
	drawTriangleMesh: function (mesh, transform) {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;
		var program = this.program;

		if (mesh.key) {

			if (!glwrapper.verticesCache[mesh.key]) { // if not already cached
				// create a new buffer, load the data, and cache the buffer
				var vertexBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, this.flattenTriangles( mesh.triangles ), gl.STATIC_DRAW);
				glwrapper.verticesCache[mesh.key] = vertexBuffer;
			}

			// for each buffer, bind it and link its shader attribute
			gl.bindBuffer(gl.ARRAY_BUFFER, glwrapper.verticesCache[mesh.key]);
			gl.vertexAttribPointer( this.vPosition, 3, gl.FLOAT, false, 0, 0 );

		} else {
			// use the buffers reserved for dynamic meshes, and load the data
			gl.bindBuffer(gl.ARRAY_BUFFER, glwrapper.dynamicVerticesBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.flattenTriangles( mesh.triangles ), gl.STATIC_DRAW);
			gl.vertexAttribPointer( this.vPosition, 3, gl.FLOAT, false, 0, 0 );
		}

		if (mesh.color && mesh.color[3] <= 0) return; //if alpha less than or equal to zero, just don't draw it

		gl.uniform4fv( gl.getUniformLocation(program,"fColor"), this.flatten(mesh.color) );

		gl.uniformMatrix4fv(this.modelUniform, false, this.flattenTransform(transform));

		gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles.length*3);
	},
};

BasicShader.prototype = Object.create(Shader.prototype);
for (var prop in proto) BasicShader.prototype[prop] = proto[prop]; //extend

/**
 * Heavily referenced [Sijie Tian and Patrick Cozzi](https://hacks.mozilla.org/2014/01/webgl-deferred-shading/) and 
 * [their github](https://github.com/YuqinShao/Tile_Based_WebGL_DeferredShader/tree/master/deferredshading)
 */

function BasicGBufferShader(glwrapper) {
	BasicShader.call(this, glwrapper);

	var ext = this.ext;
	var canvas = glwrapper.canvas;

	var texs = new Array(4); // 4 textures for the frame buffer's 4 color attachments
	for (var i = 0; i < texs.length; i++) {
		texs[i] = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texs[i]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
		gl.bindTexture(gl.TEXTURE_2D, null); // tell WebGL we're done manipulating the texture by binding null to gl.TEXTURE_2D
	}

	this.fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

	ext.drawBuffersWEBGL([
		ext.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0]
		ext.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1]
		ext.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2]
		ext.COLOR_ATTACHMENT3_WEBGL  // gl_FragData[3]
	]);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, texs[0], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, texs[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, texs[2], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, texs[3], 0);

	this.depthBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

	glwrapper.texs = texs;

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) 
		throw "Error setting up Framebuffer";
}

var proto = {
	key: "basicgbuffer",
	/*jshint multistr: true */
	// vertexShader: extended from BasicShader
	fragmentShader: "\
		                                                                   \n\
		#extension GL_EXT_draw_buffers : require                           \n\
		                                                                   \n\
		precision mediump float;                                           \n\
		                                                                   \n\
		uniform vec4 fColor;                                               \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
		    // store rgba components separately                            \n\
		    gl_FragData[0] = vec4(fColor.r);                               \n\
		    gl_FragData[1] = vec4(fColor.g);                               \n\
		    gl_FragData[2] = vec4(fColor.b);                               \n\
		    gl_FragData[3] = vec4(fColor.a);                               \n\
		}                                                                  \n\
	",
	getExtensions: function () {
		var gl = this.glwrapper.gl;

		if (!this.ext) {
			this.ext = gl.getExtension('WEBGL_draw_buffers');
			gl.getExtension("OES_texture_float");
			gl.getExtension("OES_texture_float_linear");
		}
	},
	initBuffersAndAttributes: function () {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);

		BasicShader.prototype.initBuffersAndAttributes.call(this);
	},
};

BasicGBufferShader.prototype = Object.create(BasicShader.prototype);
for (var prop in proto) BasicGBufferShader.prototype[prop] = proto[prop]; //extend

function TextureShader (glwrapper) {
	BasicShader.call(this, glwrapper);
	this.vTexCoord = gl.getAttribLocation( this.program, "vTexCoord" );
	this.textureBuffer = gl.createBuffer();
}

var proto = {
	key: "basicTexture",
	/*jshint multistr: true */
	vertexShader: "\
		                                                                       \n\
		attribute vec4 vPosition;                                              \n\
		attribute vec4 vNormal;                                                \n\
		                                                                       \n\
		uniform mat4 CameraMat;                                                \n\
		uniform mat4 ProjectMat;                                               \n\
		uniform mat4 ModelMat;                                                 \n\
		                                                                       \n\
		attribute  vec2 vTexCoord;                                             \n\
		                                                                       \n\
		varying vec2 fTexCoord;                                                \n\
		                                                                       \n\
		void main()                                                            \n\
		{                                                                      \n\
			fTexCoord = vTexCoord;                                             \n\
                                                                               \n\
		    gl_Position = CameraMat * ProjectMat * ModelMat * vPosition;       \n\
		                                                                       \n\
		}                                                                      \n\
	",
	fragmentShader: "\
		                                                                   \n\
		precision mediump float;                                           \n\
		                                                                   \n\
		varying vec2 fTexCoord;                                            \n\
		                                                                   \n\
		uniform sampler2D texture;                                         \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
	    	gl_FragColor = texture2D( texture, fTexCoord );                \n\
		}                                                                  \n\
	",
	// initUniforms: inherited from BasicShader
	// Create Buffers and Attributes
	initBuffersAndAttributes: function () {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;
		var program = this.program;

		gl.enableVertexAttribArray( this.vTexCoord );

		gl.activeTexture(gl.TEXTURE0); // use texture register 0 for binding
		gl.uniform1i(gl.getUniformLocation(program, "texture"), 0); // tell shader to pull from register 0

		BasicShader.prototype.initBuffersAndAttributes.call(this);
	},
	disableAttributes: function () {
		var gl = this.glwrapper.gl;
		BasicShader.prototype.disableAttributes.call(this);
		gl.disableVertexAttribArray( this.vTexCoord );
	},
	// renderScene: inherited from BasicShader
	drawTriangleMesh: function (mesh, transform) {
		var gl = this.glwrapper.gl;
		
		// don't need to worry about buffer binding, buffer already bound in initBuffersAndAttributes
		if (mesh && mesh.texture) gl.bindTexture( gl.TEXTURE_2D, mesh.texture ); 
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
		gl.bufferData( gl.ARRAY_BUFFER, this.flattenVertices(mesh.texCoords), gl.STATIC_DRAW );
		gl.vertexAttribPointer( this.vTexCoord, 2, gl.FLOAT, false, 0, 0 );

		BasicShader.prototype.drawTriangleMesh.call(this, mesh, transform);
	}
};

TextureShader.prototype = Object.create(BasicShader.prototype);
for (var prop in proto) TextureShader.prototype[prop] = proto[prop]; //extend


function BackgroundShader (glwrapper) {
	Shader.call(this, glwrapper);
	this.vCoordBuffer = gl.createBuffer();
	this.vCoord = gl.getAttribLocation( this.program, "vCoord" );
	this.textureBuffer = gl.createBuffer();
}

var proto = {
	key: "background",
	/*jshint multistr: true */
	vertexShader: "\
		                                                                       \n\
		attribute vec2 vCoord; // passed in coordinates range from -1 to 1     \n\
		                                                                       \n\
		varying vec2 fTexCoord;                                                \n\
		                                                                       \n\
		void main()                                                            \n\
		{                                                                      \n\
			// texture coordinates range from 0 to 1                           \n\
			fTexCoord = vCoord * 0.5 + vec2(0.5);                              \n\
		                                                                       \n\
		    // gl_position coordinates range from -1 to 1                      \n\
		    gl_Position = vec4(vCoord, 0.0, 1.0);                              \n\
		}                                                                      \n\
	",
	fragmentShader: "\
		                                                                   \n\
		precision mediump float;                                           \n\
		                                                                   \n\
		varying vec2 fTexCoord;                                            \n\
		                                                                   \n\
		uniform sampler2D texture;                                         \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
		    gl_FragColor = texture2D( texture, fTexCoord );                \n\
		}                                                                  \n\
	",
	// initUniforms: no uniforms
	initBuffersAndAttributes: function () {
		var gl = this.glwrapper.gl;
		var program = this.program;

		// because the data never changes, bind and load it now so we
		// don't need to in drawTriangleMesh
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.flattenTriangles( this.quadMesh.triangles ), gl.STATIC_DRAW);
		gl.vertexAttribPointer( this.vCoord, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vCoord );

		gl.activeTexture(gl.TEXTURE0); // use texture register 0 for binding
		gl.uniform1i(gl.getUniformLocation(program, "texture"), 0); // tell shader to pull from register 0
	},
	disableAttributes: function () {
		this.glwrapper.gl.disableVertexAttribArray( this.vCoord );
	},
	quadMesh: new TriangleMesh({
		key: "quadmesh",
        vertices: [
            vec2(-1, -1), // 3___2
            vec2( 1, -1), // |   |
            vec2( 1,  1), // |___|
            vec2(-1,  1), // 0   1
        ],
        indices: [
            [0,1,2], [0,2,3],
        ],
        normals: [], // prevents generation of normals
        color: vec4(1,1,1,1),
    }),
	renderScene: function () {
		this.drawTriangleMesh();
	},
	drawTriangleMesh: function (mesh) { // ignores mesh and transform arguments that Shaders usually use

		var gl = this.glwrapper.gl;
		var program = this.program;

		// don't need to worry about buffer binding, buffer already bound in initBuffersAndAttributes
		if (mesh && mesh.texture) gl.bindTexture( gl.TEXTURE_2D, mesh.texture );
		// don't need to bind vcoord buffer cuz it was already bound and loaded in initBuffersAndAttributes
		// and it will never change throughout this shader's lifetime

		gl.drawArrays(gl.TRIANGLES, 0, this.quadMesh.triangles.length*3);
	}
};

BackgroundShader.prototype = Object.create(Shader.prototype);
for (var prop in proto) BackgroundShader.prototype[prop] = proto[prop]; //extend


function BasicQuadShader(glwrapper) {
	BackgroundShader.call(this, glwrapper);
}

var proto = {
	key: "basicquad",
	/*jshint multistr: true */
	// vertexShader: inherited from BackgroundShader
	fragmentShader: "\
		                                                                   \n\
		precision mediump float;                                           \n\
		                                                                   \n\
		varying vec2 fTexCoord;                                            \n\
		                                                                   \n\
		uniform sampler2D tex0;                                            \n\
		uniform sampler2D tex1;                                            \n\
		uniform sampler2D tex2;                                            \n\
		uniform sampler2D tex3;                                            \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
		    vec4 fColor;                                                   \n\
		                                                                   \n\
			vec4 texData0 = texture2D(tex0, fTexCoord);                    \n\
			vec4 texData1 = texture2D(tex1, fTexCoord);                    \n\
			vec4 texData2 = texture2D(tex2, fTexCoord);                    \n\
			vec4 texData3 = texture2D(tex3, fTexCoord);                    \n\
		                                                                   \n\
		    // reconstruct color from rgba components                      \n\
			fColor = vec4(texData0.x, texData1.x, texData2.x, 1);          \n\
		                                                                   \n\
		    gl_FragColor = fColor;                                         \n\
		}                                                                  \n\
	",
	initUniforms: function () {
		var gl = this.glwrapper.gl;
		var program = this.program;
		var texs = this.glwrapper.texs;

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.activeTexture(gl.TEXTURE0); // use texture register 0 for binding
		gl.bindTexture( gl.TEXTURE_2D, texs[0] );
		gl.uniform1i(gl.getUniformLocation(program, "tex0"), 0); // tell shader to pull from register 0

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture( gl.TEXTURE_2D, texs[1] );
		gl.uniform1i(gl.getUniformLocation(program, "tex1"), 1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture( gl.TEXTURE_2D, texs[2] );
		gl.uniform1i(gl.getUniformLocation(program, "tex2"), 2);

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture( gl.TEXTURE_2D, texs[3] );
		gl.uniform1i(gl.getUniformLocation(program, "tex3"), 3);
	},
	// initBuffersAndAttributes: inherited from BackgroundShader
	// disableAttributes: inherited from BackgroundShader
	// renderScene: inherited from BackgroundShader
	// drawTriangleMesh: inherited from BackgroundShader
};

BasicQuadShader.prototype = Object.create(BackgroundShader.prototype);
for (var prop in proto) BasicQuadShader.prototype[prop] = proto[prop]; //extend

// A Mixin of PhongShader and BasicGBufferShader
function GBufferShader(glwrapper) {
	BasicGBufferShader.call(this, glwrapper);
}

var proto = {
	key: "gbuffer",
	/*jshint multistr: true */
	vertexShader: "\
		                                                                       \n\
		attribute vec4 vPosition;                                              \n\
		attribute vec4 vNormal;                                                \n\
		                                                                       \n\
		varying vec3 N, pos;                                                   \n\
		uniform mat4 CameraMat;                                                \n\
		uniform mat4 ProjectMat;                                               \n\
		uniform mat4 ModelMat;                                                 \n\
		uniform vec4 lightPosition;                                            \n\
		uniform mat3 normalMatrix;                                             \n\
		                                                                       \n\
		void main()                                                            \n\
		{                                                                      \n\
		    pos = (ProjectMat * ModelMat * vPosition).xyz;                     \n\
		                                                                       \n\
		    N = normalize( mat3(ProjectMat * ModelMat) * vNormal.xyz);         \n\
                                                                               \n\
		    gl_Position = CameraMat * ProjectMat * ModelMat * vPosition;       \n\
		                                                                       \n\
		}                                                                      \n\
	",
	fragmentShader: "\
		                                                                   \n\
		#extension GL_EXT_draw_buffers : require                           \n\
		                                                                   \n\
		precision mediump float;                                           \n\
                                                                           \n\
		// material factors                                                \n\
		uniform float ambient;                                             \n\
		uniform float specular;                                            \n\
		uniform float diffuse;                                             \n\
		uniform float shininess;                                           \n\
		                                                                   \n\
		// material color                                                  \n\
		uniform vec4 materialColor;                                        \n\
		                                                                   \n\
		varying vec3 N, pos;                                               \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
		    // store rgba components separately                            \n\
		    gl_FragData[0] = vec4(pos, 1.0);                               \n\
		    gl_FragData[1] = vec4(N, 1.0);                                 \n\
		    gl_FragData[2] = vec4(ambient, diffuse, specular, shininess);  \n\
		    gl_FragData[3] = materialColor;                                \n\
		}                                                                  \n\
	",
	// getExtensions: inherited from BasicGBufferShaders
	initUniforms: PhongShader.prototype.initUniforms,
	initBuffersAndAttributes: function () {
		BasicGBufferShader.prototype.initBuffersAndAttributes.call(this);
		// BasicGBufferShader calls BasicShader.initBuffersAndAttributes, so this
		// must be called AFTER so we override BasicShader's attributes
		PhongShader.prototype.initBuffersAndAttributes.call(this);
	},
	disableAttributes: function () {
		BasicGBufferShader.prototype.disableAttributes.call(this);
		PhongShader.prototype.disableAttributes.call(this);
	},
	renderScene: function(scene, camera) {
		// empty lights array before LightCartesia.draw populates them
		this.glwrapper.lights = [];
		PhongShader.prototype.renderScene.call(this, scene, camera);
	},
	drawTriangleMesh: function (mesh, transform) {
		gl.uniform1f( gl.getUniformLocation(this.program,"ambient"), mesh.ambientFactor );
		gl.uniform1f( gl.getUniformLocation(this.program,"diffuse"), mesh.diffuseFactor );
		gl.uniform1f( gl.getUniformLocation(this.program,"specular"), mesh.specularFactor );
		gl.uniform1f( gl.getUniformLocation(this.program,"shininess"), mesh.shininess );
		gl.uniform4fv( gl.getUniformLocation(this.program,"materialColor"), this.flatten(mesh.color) );
		PhongShader.prototype.drawTriangleMesh.call(this, mesh, transform);
	}
};

GBufferShader.prototype = Object.create(BasicGBufferShader.prototype);
for (var prop in proto) GBufferShader.prototype[prop] = proto[prop]; //extend

function PhongQuadShader(glwrapper) {
	BasicQuadShader.call(this, glwrapper);
}

var proto = {
	key: "phongquad",
	/*jshint multistr: true */
	// vertexShader: inherited from BasicQuadShader
	fragmentShader: "\
		                                                                   \n\
		precision mediump float;                                           \n\
		                                                                   \n\
		varying vec2 fTexCoord;                                            \n\
		                                                                   \n\
		uniform sampler2D tex0;                                            \n\
		uniform sampler2D tex1;                                            \n\
		uniform sampler2D tex2;                                            \n\
		uniform sampler2D tex3;                                            \n\
		                                                                   \n\
		uniform mat4 ProjectMat;                                           \n\
		uniform mat4 ModelMat;                                             \n\
		                                                                   \n\
		uniform vec4 lightPosition;                                        \n\
		uniform float lightAtt;                                            \n\
		                                                                   \n\
		// simplify things by merging light properties into one color      \n\
		uniform vec4 lightColor;                                           \n\
		                                                                   \n\
		void main()                                                        \n\
		{                                                                  \n\
		    vec4 fColor;                                                   \n\
		                                                                   \n\
			vec3 pos = texture2D(tex0, fTexCoord).rgb;                     \n\
			vec3 N = texture2D(tex1, fTexCoord).rgb;                       \n\
			vec4 factors = texture2D(tex2, fTexCoord);                     \n\
			float AFactor = factors.r; // ambient                          \n\
			float DFactor = factors.g; // diffuse                          \n\
			float SFactor = factors.b; // specular                         \n\
			float shininess = factors.a;                                   \n\
			vec4 materialColor = texture2D(tex3, fTexCoord);               \n\
		                                                                   \n\
			vec4 ambientProduct = lightColor * (AFactor * materialColor);  \n\
			vec4 diffuseProduct = lightColor * (DFactor * materialColor);  \n\
			vec4 specularProduct = lightColor * (SFactor * materialColor); \n\
		                                                                   \n\
		    // use transformations to move light from (0,0,0)              \n\
			vec4 lightPos = ProjectMat * ModelMat * vec4(0,0,0,1);         \n\
		                                                                   \n\
		    // remember: pos and lightPos relative to camera               \n\
		    vec3 E =  -normalize( pos ); // object to camera               \n\
		    vec3 D = lightPos.xyz - pos; // object to light                \n\
		    vec3 L = normalize( D ); // normalized object to light         \n\
		                                                                   \n\
		    vec3 H = normalize( L + E ); // halfway vector                 \n\
		    vec4 ambient = ambientProduct;                                 \n\
		                                                                   \n\
		    float Kd = max( dot( L, N), 0.0 );                             \n\
		    vec4  diffuse = Kd * diffuseProduct;                           \n\
                                                                           \n\
		    float Ks = pow( max(dot(N, H), 0.0), shininess );              \n\
		    vec4  specular = Ks * specularProduct;                         \n\
		                                                                   \n\
		    if( dot(L, N) < 0.0 ) specular = vec4(0.0, 0.0, 0.0, 1.0);     \n\
		                                                                   \n\
		    float attenuation = 3.0/(1.0 + lightAtt*pow(length(D), 2.0));  \n\
		                                                                   \n\
		    fColor = ambient + attenuation*(diffuse + specular);           \n\
		    fColor.a = 1.0;                                                \n\
		                                                                   \n\
		    gl_FragColor = fColor;                                         \n\
		}                                                                  \n\
	",
	// initUniforms: inherited from BasicQuadShader
	// initBuffersAndAttributes: inherited from BasicQuadShader
	// disableAttributes: inherited from BasicQuadShader
	renderScene: function () {
		this.glwrapper.lights.forEach(this.renderLighting.bind(this));
	},
	renderLighting: function (light) {
		var glwrapper = this.glwrapper;
		var gl = glwrapper.gl;
		var program = this.program;

		gl.uniform4fv( gl.getUniformLocation(program,"lightColor"), this.flatten(light.color) );
		gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"), this.flatten(vec4(0,0,0,1)) );
		gl.uniform1f( gl.getUniformLocation(program,"lightAtt"), light.attenuation );

		var cameraTransform = glwrapper.camera.getAbsoluteTransform().inverse();
		gl.uniformMatrix4fv( gl.getUniformLocation(program, "ProjectMat") , false, cameraTransform.flatten());
		gl.uniformMatrix4fv( gl.getUniformLocation(program, "ModelMat") , false, this.flattenTransform(light.transform));

		// draw
		BasicQuadShader.prototype.renderScene.call(this);
	},
	// drawTriangleMesh: inherited from BasicQuadShader
};

PhongQuadShader.prototype = Object.create(BasicQuadShader.prototype);
for (var prop in proto) PhongQuadShader.prototype[prop] = proto[prop]; //extend
