var gulp = require('gulp');
var handlebars = require('Handlebars');
var markdown = require('gulp-markdown');
var tap = require('gulp-tap');

gulp.task('clean', [], function() {

});

gulp.task('default', ['clean', 'generate-pages'], function() {
    
});

gulp.task('generate-pages', [], function() {
    return gulp.src('templates/main-layout.hbs')
        .pipe(tap(function(file) {
            var template = handlebars.compile(file.contents.toString());
            return gulp.src('content/**.md')
            .pipe(markdown())
            .pipe(tap(function(file) {
                var data = {
                    content: file.contents.toString()
                };
                var html = template(data);
                file.contents = new Buffer(html, 'utf-8');
            }))
            .pipe(gulp.dest('docs'));
        }));
});