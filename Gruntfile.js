// combine src/ files
module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      my_target : {
        options : {
          sourceMap : true, 
          sourceMapName : 'dist/sourceMap.map'
        },
        files : {
          'dist/cartesia.min.js' : [
            'src/webgl-utils.js',
            'src/Transformation.js',
            'src/Cartesia.js',
            'src/Mesh.js',
            'src/WebGLWrapper.js',
            'src/ShaderHandler.js',
            'src/Camera.js',
            'src/Cube.js',
            'src/Sphere.js'
          ]
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
