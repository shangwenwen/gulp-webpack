'use strict';

var gulp = require('gulp');
var os = require('os');
var gutil = require('gulp-util');
var less = require('gulp-less');
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
var connect = require('gulp-connect');


var host = {
    path: 'dist/',
    port: 3000,
    html: 'index.html'
};

//mac chrome: "Google chrome"
var browser = os.platform() === 'linux' ? 'Google chrome' : (os.platform() === 'darwin' ? 'Google chrome' : (os.platform() === 'win32' ? 'chrome' : 'firefox'));
// var pkg = require('./package.json');

//将图片拷贝到目标目录
gulp.task('copy:images', function(done) {
    gulp.src(['src/images/**/*'])
        .pipe(gulp.dest('dist/images'))
        .on('end', done);
});

//压缩合并css, css中既有自己写的.less, 也有引入第三方库的.css
gulp.task('lessmin', function(done) {
    gulp.src(['src/css/main.less', 'src/css/*.css'])
        .pipe(less())
        //这里可以加css sprite 让每一个css合并为一个雪碧图
        //.pipe(spriter({}))
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/css/'))
        .on('end', done);
});

//将js加上10位md5,并修改html中的引用路径，该动作依赖build-js
gulp.task('md5:js', ['build-js'], function(done) {
    gulp.src('dist/js/*.js')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/js'))
        .on('end', done);
});

//将css加上10位md5，并修改html中的引用路径，该动作依赖sprite
gulp.task('md5:css', ['sprite'], function(done) {
    gulp.src('dist/css/*.css')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/css'))
        .on('end', done);
});

//用于在html文件中直接include文件
gulp.task('fileinclude', function(done) {
    gulp.src(['src/app/*.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest('dist/app'))
        .on('end', done);
    // .pipe(connect.reload())
});

//雪碧图操作，应该先拷贝图片并压缩合并css
gulp.task('sprite', ['copy:images', 'lessmin'], function(done) {
    var timestamp = +new Date();
    gulp.src('dist/css/style.min.css')
        .pipe(spriter({
            spriteSheet: 'dist/images/spritesheet' + timestamp + '.png',
            pathToSpriteSheetFromCSS: '../images/spritesheet' + timestamp + '.png',
            spritesmithOptions: {
                padding: 10
            }
        }))
        .pipe(base64())
        .pipe(cssmin())
        .pipe(gulp.dest('dist/css'))
        .on('end', done);
});

// 构建前删除 DIST 目录
gulp.task('clean', function() {
    return del('./dist/').then(function() {
        console.log('删除成功！！');
    });
});

// 监控
gulp.task('watch', function(done) {
    gulp.watch('src/**/*', ['lessmin', 'build-js', 'fileinclude'])
        .on('end', done);
});

// 启动服务
gulp.task('connect', function() {
    console.log('connect start ------------');
    connect.server({
        root: host.path,
        port: host.port,
        livereload: true
    });
});

// 打开浏览器
gulp.task('open', function(done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            uri: 'http://localhost:3000/app'
        }))
        .on('end', done);
});

var myDevConfig = Object.create(webpackConfig);
var devCompiler = webpack(myDevConfig);

//引用webpack对js进行操作
gulp.task("build-js", ['fileinclude'], function(callback) {
    devCompiler.run(function(err, stats) {
        if (err) throw new gutil.PluginError("webpack:build-js", err);
        gutil.log("[webpack:build-js]", stats.toString({
            colors: true
        }));
        callback();
    });
});




// 发布
gulp.task('default', sequence('clean', ['fileinclude', 'md5:css', 'md5:js'], 'connect', 'open'));

// 开发
gulp.task('dev', sequence('clean', ['copy:images', 'fileinclude', 'lessmin', 'build-js'], 'connect', 'watch', 'open'));