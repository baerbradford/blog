var _ = require('underscore');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var cssMin = require('gulp-minify-css');
var gulp = require('gulp');
var handlebars = require('Handlebars');
var jsValidate = require('gulp-jsvalidate');
var markdown = require('gulp-markdown');
var path = require('path');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var tap = require('gulp-tap');
var uglify = require('gulp-uglify');
var webServer = require('gulp-webserver');

var metadata = {
    pages: {}
};
var metadataDefaults = {
    author: "Rachel and Baer",
    title: "Blog"
}


gulp.task('clean', ['clean-build', 'clean-docs']);

gulp.task('clean-build', [], function () {
    return gulp.src('build', { read: false})
    .pipe(clean());
});

gulp.task('clean-docs', function () {
    return gulp.src('docs', { read: false})
    .pipe(clean());
});

gulp.task('css', ['clean', 'sass'], function() {
    gulp.src('build/styles/**.css')
        .pipe(concat('main.min.css'))
        .pipe(cssMin())
        .pipe(gulp.dest('docs'));
});

gulp.task('default', ['clean', 'css', 'generate-pages', 'homepage', 'img', 'js', 'vendor']);

gulp.task('generate-pages', ['clean'], function() {
    return gulp.src('content/templates/main-layout.hbs')
        .pipe(tap(function(file) {
            var template = handlebars.compile(file.contents.toString());

            return gulp.src('content/posts/**.md')
                .pipe(tap(function(file) {
                    var fileName = path.basename(file.path, '.md');
                    var fileContent = file.contents.toString();
                    var data = {
                        author: metadataDefaults.author,
                        content: file.contents.toString(),
                        name: fileName,
                        title: metadataDefaults.title,
                        url: file.relative.replace('.md', '')
                    };
                    var index = fileContent.indexOf('---');
                    if (index !== -1) {
                        var dataOverride = JSON.parse(fileContent.slice(0, index));
                        if (dataOverride.title) {
                            data.title = dataOverride.title;
                        }
                        if (dataOverride.author) {
                            data.author = dataOverride.author;
                        }
                        if (dataOverride.date) {
                            data.date = dataOverride.date;
                        } else {
                            throw fileName + ' missing date property.';
                        }

                        fileContent = fileContent.slice(index + 3, fileContent.length);
                        data.content = fileContent;
                    }

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

gulp.task('homepage', ['clean', 'generate-pages'], function() {
    return gulp.src('content/templates/index.hbs')
        .pipe(tap(function(file) {
            var template = handlebars.compile(file.contents.toString());
            var pages = Object.keys(metadata.pages).map(function(key) { return metadata.pages[key]; });
            pages.sort(function(a,b) { return (a.date < b.date) ? 1 : ((b.date < a.date) ? -1 : 0);} );
            var html = template({
                pages: pages
            });
            file.contents = new Buffer(html, 'utf-8');
        }))
        .pipe(rename(function(path) {
            path.extname = '.html'
        }))
        .pipe(gulp.dest('docs'));
});

gulp.task('img', ['clean'], function() {
    gulp.src(['content/img/**/*']).pipe(gulp.dest('docs/img'));
});

gulp.task('js', ['clean'], function() {
    return gulp.src("content/scripts/**.js")
        .pipe(jsValidate())
        .pipe(uglify())
        .pipe(concat('main.min.js'))
        .pipe(gulp.dest('docs'));
});

gulp.task('sass', ['clean'], function() {
    return gulp.src('content/styles/**.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('build/styles'));
});

gulp.task('serve', [], function() {
    var webConfig = {
        livereload: true,
        middleware: function (req, res, next) {
            if (req.url.indexOf('.') >= 0) {
                // Already has extension. Don't modify.
                next();
                return;
            }
        
            // If `/` is requested. append index to it
            if (req.url === '/') {
              req.url = '/index';
            }
            // Append .html.
            const url = req.url + '.html';
            req.url = url;
            next();
        },
        open: 'http://localhost',
        port: 80
    };
    return gulp.src('docs')
        .pipe(webServer(webConfig));
});

gulp.task('vendor', ['clean'], function() {
    gulp.src(['content/vendor/**/*']).pipe(gulp.dest('docs/vendor'));
});

gulp.task('watch', [], function() {
    return gulp.watch(['content/**'], ['default']);
});
