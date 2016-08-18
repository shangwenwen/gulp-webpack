'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var gulpOpen = require('gulp-open');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var md5 = require('gulp-md5-plus');
var fileinclude = require('gulp-file-include');
var clean = require('gulp-clean');
var spriter = require('gulp-css-spriter');
var base64 = require('gulp-css-base64');
var webpack = require('webpack');
var webpackConfig = require('./webpack.config.js');
var sequence = require('gulp-sequence');
var del = require('del');
var browserSync = require('browser-sync').create();


//将图片拷贝到目标目录
gulp.task('copy:images', function() {
    return gulp.src(['src/images/**/*'])
        .pipe(gulp.dest('dist/images'))
        .pipe(browserSync.stream());
});

//压缩合并css, css中既有自己写的.less, 也有引入第三方库的.css
gulp.task('sass', function() {
    return gulp.src(['./src/css/main.scss', 'src/css/*.css'])
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(concat('style.min.css'))
        .pipe(cssmin())
        .pipe(gulp.dest('dist/css/'))
        .pipe(browserSync.stream());
});

//将js加上10位md5,并修改html中的引用路径，该动作依赖 webpack
gulp.task('md5:js', ['webpack'], function() {
    return gulp.src('dist/js/*.js')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.stream());
});

//将css加上10位md5，并修改html中的引用路径，该动作依赖sprite
gulp.task('md5:css', ['sprite'], function() {
    return gulp.src('dist/css/*.css')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/css'));
});

//用于在html文件中直接include文件
gulp.task('html', function() {
    return gulp.src(['src/app/*.html'])
        .pipe(fileinclude({
            prefix: '@',
            basepath: '@file'
        }))
        .pipe(gulp.dest('dist/app'))
        .pipe(browserSync.stream());
});

//雪碧图操作，应该先拷贝图片并压缩合并css
gulp.task('sprite', ['copy:images', 'sass'], function() {
    var timestamp = +new Date();
    return gulp.src('dist/css/style.min.css')
        .pipe(spriter({
            spriteSheet: 'dist/images/spritesheet' + timestamp + '.png',
            pathToSpriteSheetFromCSS: '../images/spritesheet' + timestamp + '.png',
            spritesmithOptions: {
                padding: 10
            }
        }))
        .pipe(base64())
        .pipe(cssmin())
        .pipe(gulp.dest('dist/css'));
});

// jshint
gulp.task('jshint', function() {
    return gulp.src('./src/js/**/*.js')
        .pipe(reload({
            stream: true,
            once: true
        }))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});


// 构建前删除 DIST 目录
gulp.task('clean', function() {
    return del('./dist/').then(function() {
        console.log('删除成功！！');
    });
});



gulp.task("webpack", ['html'], function(callback) {
    var myConfig = Object.create(webpackConfig);
    // run webpack
    webpack(
        // configuration
        myConfig,
        function(err, stats) {
            if(err) throw new gutil.PluginError("webpack", err);
            gutil.log("[webpack]", stats.toString({
                colors: true
            }));
            callback();
        });
});



// 添加本地服务，浏览器自动刷新，文件监听
gulp.task('serve', function() {

    browserSync.init({
        server: {
            baseDir: './',
            directory: true,
        },
        reloadDelay: 0,
        timestamps: true,
        startPath: "dist/app",
        port: 3000
    });

    gulp.watch('./src/css/**/*', ['sass']);
    gulp.watch('./src/app/**/*', ['html']);
    gulp.watch('./src/js/**/*', ['webpack']);
    gulp.watch('./src/images/**/*', ['copy:images']);
    gulp.watch('./dist/js/**/*.js').on("change", browserSync.reload);

});


// 发布
gulp.task('default', sequence('clean', ['html', 'md5:css', 'md5:js']));

// 开发
gulp.task('dev', sequence('clean', ['copy:images', 'html', 'sass', 'webpack'], 'serve'));