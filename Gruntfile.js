module.exports = function(grunt) {
	
	grunt.initConfig({
		watch: {
			css: {
				files: ['css/*.css'],
				options: {
					// Start a live reload server on the default port 35729
					livereload: 3474,
				},
			},
			js: {
				files: ['js/*.js'],
				options: {
					// Start another live reload server on port 1337
					livereload: 3474,
				},
			},
//			dont: {
//				files: ['other/stuff/*'],
//				tasks: ['dostuff'],
//			},
		},
	});
	
	grunt.loadNpmTasks('grunt-contrib-watch');
	
};
