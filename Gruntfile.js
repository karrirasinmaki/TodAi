module.exports = function(grunt) {
	
	grunt.initConfig({
		pkg: grunt.file.readJSON('dist/package.json'),
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
		copy: {
			build: {
				cwd: 'dist',
				src: [ '**' ],
				dest: 'public',
				expand: true
			},
		},
		clean: {
			build: {
				src: [ 'build' ]
			},
		},
	});
	
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	// grunt.registerTask('build', 'Compiles all of the assets and copies the files to the build directory.', [ 'clean', 'copy' ]);
		
};
