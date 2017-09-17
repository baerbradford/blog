var _ = require('underscore');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var cssMin = require('gulp-minify-css');
var gulp = require('gulp');
var handlebars = require('Handlebars');
var markdown = require('gulp-markdown');
var path = require('path');
var sass = require('gulp-sass');
var tap = require('gulp-tap');
var webServer = require('gulp-webserver');

var metadata = {
    pages: {}
};

gulp.task('clean', ['clean-build', 'clean-docs']);

gulp.task('clean-build', [], function () {
    return gulp.src('build', { read: false})
    .pipe(clean());
});

gulp.task('clean-docs', function () {
    return gulp.src('docs', { read: false})
    .pipe(clean());
});

gulp.task('css', ['sass'], function() {
    gulp.src('build/styles/**.css')
        .pipe(concat('main.min.css'))
        .pipe(cssMin())
        .pipe(gulp.dest('docs'));
});

gulp.task('default', ['clean', 'css', 'generate-pages']);

gulp.task('generate-pages', function() {
    return gulp.src('content/templates/main-layout.hbs')
        .pipe(tap(function(file) {
            var template = handlebars.compile(file.contents.toString());

            return gulp.src('content/**.md')
                .pipe(tap(function(file) {
                    var fileName = path.basename(file.path, ".md");
                    var fileContent = file.contents.toString();
                    var data = {
                        content: file.contents.toString(),
                        title: 'Blog'
                    };
                    var index = fileContent.indexOf('---');
                    if (index !== -1) {
                        var dataOverride = JSON.parse(fileContent.slice(0, index));
                        if (dataOverride.title) {
                            data.title = dataOverride.title;
                        }

                        fileContent = fileContent.slice(index + 3, fileContent.length);
                        data.content = fileContent;
                    }
                    data.name = fileName;
                    data.url = file.relative.replace('.md', '.html');
                    metadata.pages[data.name] = data;
                    file.contents = new Buffer(fileContent, 'utf-8');
                }))
                .pipe(markdown())
                .pipe(tap(function(file) {
                    var fileName = path.basename(file.path, '.html');
                    var data = metadata.pages[fileName];
                    data.content = file.contents.toString();
                    var html = template(data);
                    file.contents = new Buffer(html, 'utf-8');
                }))
                .pipe(gulp.dest('docs'));
            }));
});

gulp.task('sass', function() {
    return gulp.src('content/styles/**.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('build/styles'));
});

gulp.task('watch', [], function() {
    return gulp.watch(['content/**'], ['default']);
});

gulp.task('serve', [], function() {
    var webConfig = {
        livereload: true,
        open: 'http://localhost',
        port: 80
    };
    return gulp.src('docs')
        .pipe(webServer(webConfig));
});