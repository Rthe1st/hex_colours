var gulp = require('gulp'),
    browserify = require('browserify'),
    vinylSourceStream = require('vinyl-source-stream'),
    del = require('del'),
    babelify = require('babelify');

var buildDir = './build';

gulp.task('clientScripts', function(){
     return browserify({
        entries: ['./source/main.js'],
        debug: true,// Gives us sourcemapping
        transform: [babelify]
    }).bundle()
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest(buildDir));
});

//'callback' is apparently a hack to make sure the function finishes before returning?
gulp.task('clean', function (callback) {
    del([buildDir + '/*'], callback);
});

//default
gulp.task('default', ['clean'], function () {
    gulp.start('clean');
    gulp.start('clientScripts');
});
