'use strict';
var pkg = require('./package.json');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var moment = require('moment');

var banner = '/**\n * jquery-keybord \n * version: ' + pkg.version + ' \n * repo: https://github.com/x373241884y/jquery-keyboardNum \n * build: ' + moment().format('YYYY-MM-DD HH:mm:ss') + '\n */\n';

gulp.task('js:copy', function () {
    gulp.src(['src/jquery-keybord.js'])
        .pipe(plugins.header(banner, {pkg: pkg}))
        .pipe(gulp.dest('docs/js/'));
});

gulp.task('css:copy', function () {
    gulp.src(['src/jquery-keybord.css'])
        .pipe(plugins.header(banner, {pkg: pkg}))
        .pipe(gulp.dest('docs/css/'));
});
gulp.task('js:build', function () {
    gulp.src(['src/jquery-keybord.js'])
        .pipe(plugins.jshint())
        .pipe(plugins.uglify())
        .pipe(plugins.jshint())
        .pipe(plugins.rename('jquery-keybord.min.js'))
        .pipe(plugins.header(banner, {pkg: pkg}))
        .pipe(gulp.dest('dist/'));
});

gulp.task('css:build', function () {
    gulp.src(['src/jquery-keybord.css'])
        .pipe(plugins.cleanCss())
        .pipe(plugins.rename('jquery-keybord.min.css'))
        .pipe(plugins.header(banner, {pkg: pkg}))
        .pipe(gulp.dest('dist/'));
});

gulp.task('watch', function () {
    gulp.watch('src/jquery-keybord.js', ['js:copy']);
    gulp.watch('src/jquery-keybord.css', ['css:copy']);
});

gulp.task('build', ['js:build', 'css:build']);