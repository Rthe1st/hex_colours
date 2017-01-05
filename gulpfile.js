var gulp = require('gulp'),
    browserify = require('browserify'),
    vinylSourceStream = require('vinyl-source-stream'),
    del = require('del'),
    gulpUtil = require('gulp-util'),
    babelify = require('babelify'),
    watchify = require('watchify');

var buildDir = './build';

gulp.task('clientScripts', function(){
    var bundler = browserify({
        entries: ['./source/main.js'],
        debug: true,// Gives us sourcemapping
        transform: [babelify],
        cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
    });
    var watcher = watchify(bundler);

    return watcher
    .on('update', function(){
        var updateStart = Date.now();
        console.log('Updating!');
        watcher.bundle() // Create new bundle that uses the cache for high performance
        .pipe(vinylSourceStream('bundle.js'))
        .pipe(gulp.dest(buildDir));
        console.log('Updated!', (Date.now() - updateStart) + 'ms');
    }).bundle()
    .on('error', function (err) {
        gulpUtil.log('failed browserify');
        gulpUtil.log(err);
        this.emit('end');
    })
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest(buildDir));
});

//clean
//'callback' is apparently a hack to make sure the function finishes before returning?
gulp.task('clean', function (callback) {
    del([buildDir + '/*'], callback);
});

//default
gulp.task('default', ['clean'], function () {
    gulp.start('clientScripts');
});

//watch
gulp.task('watch', function () {
    gulp.start('clean');
    gulp.start('clientScripts');
});
