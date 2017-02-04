var gulp = require('gulp'),
    browserify = require('browserify'),
    vinylSourceStream = require('vinyl-source-stream'),
    del = require('del'),
    babelify = require('babelify'),
    ava = require('gulp-ava');

var buildDir = './build';

gulp.task('clientScripts', ['clean'], function(){
     return browserify({
        entries: ['./source/main.js'],
        debug: true,// Gives us sourcemapping
    }).transform(babelify)
    .bundle()
    .pipe(vinylSourceStream('bundle.js'))
    .pipe(gulp.dest(buildDir));
});

gulp.task('ava', () =>
    gulp.src('./tests')
        .pipe(ava())
);

//'callback' is apparently a hack to make sure the function finishes before returning?
gulp.task('clean', function (callback) {
    del([buildDir + '/*'], callback);
});

//default
gulp.task('default', ['ava'], function () {
    gulp.start('clientScripts');
});
