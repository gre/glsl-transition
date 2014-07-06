module.exports = function (grunt) {
  var browsers = [{
    browserName: "internet explorer",
    platform: "Windows 8.1",
    version: "11"
  },{
    browserName: "opera",
    platform: "Windows 7",
    version: "12"
  },{
    browserName: "googlechrome",
    platform: "OS X 10.6"
  },{
    browserName: "googlechrome",
    platform: "linux"
  },{
    browserName: "chrome",
    platform: "Windows 7"
  },{
    browserName: "googlechrome",
    platform: "Windows XP"
  },{
    browserName: "firefox",
    platform: "Windows 8",
    version: "22"
  },{
    browserName:"safari",
    platform: "OS X 10.8",
    version: "6"
  },{
    browserName:"android",
    platform: "Linux",
    version: "4.0"
  }];

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Project configuration.
  grunt.initConfig({
    pkg: require("./package.json"),
    jshint: {
      options: grunt.file.readJSON('.jshintrc'),
      src: ['src/*.js']
    },
    browserify: {
      lib: {
        src: 'src/glsl-transition.js',
        dest: 'dist/.tmp.glsl-transition.js',
        options: {
          standalone: "GlslTransition"
        }
      },
      test: {
        src: 'test/index.js',
        dest: 'test/bundle.js',
        options: {
          debug: true
        }
      }
    },
    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> <%= pkg.version %> - <%= pkg.license %> License - https://github.com/glslio/glsl-transition */\n"
      },
      lib: {
        src: "dist/.tmp.glsl-transition.js",
        dest: "dist/glsl-transition.js"
      }
    },
    watch: {
      lib: {
        files: '<%= browserify.lib.src %>',
        tasks: ['jshint', 'browserify:lib', 'uglify']
      },
      test: {
        files: ['test/**.js', '!test/bundle.js'],
        tasks: ['browserify:test']
      }
    },
    'gh-pages': {
      example: {
        options: {
          base: '.'
        },
        src: ['**', '!node_modules/**']
      }
    },
    shell: {
      buildExample: {
        options: {
          execOptions: { cwd: "example" }
        },
        command: "npm install && npm run build"
      }
    },
    connect: {
      test: {
        options: {
          port: 9999
        }
      }
    },
    'saucelabs-mocha': {
      all: {
        options: {
          urls: ["http://127.0.0.1:9999/test/"],
          tunnelTimeout: 5,
          build: (new Date()).getTime(),
          concurrency: 3,
          browsers: browsers,
          testname: "glsl-transition tests",
          testReadyTimeout: 50000,
          tags: ["master"]
        }
      }
    }
  });


  grunt.registerTask('default', ['build', 'watch']);
  grunt.registerTask('build', ['jshint', 'browserify', 'uglify']);
  grunt.registerTask('publish', ['build', 'shell:buildExample', 'gh-pages']);
  grunt.registerTask('test', ['jshint', 'browserify', 'connect:test', 'watch']);
  grunt.registerTask('test-sauce', ['build', 'connect:test', 'saucelabs-mocha']);
};
