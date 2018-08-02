var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var watch = require('gulp-watch');
var mainBowerFiles = require('main-bower-files');
//browser-sync:產生伺服器瀏覽環境
var browserSync = require('browser-sync').create();
let cleanCSS = require('gulp-clean-css');
var minimist = require('minimist');
var envOptions = {
	string:'env',
	default:{env: 'develop'}
}
var options = minimist(process.argv.slice(2),envOptions);
console.log(options);
var gulpSequence = require('gulp-sequence')

gulp.task('clean', function () {
    return gulp.src(['./.tmp','./public'], {read: false})
        .pipe($.clean());
});
gulp.task('copyHTML',function(){
	return gulp.src('./source/**/*.html')
	.pipe(gulp.dest('./public/'))
	})

gulp.task('jade', function() {

gulp.src('./source/**/*.jade')
	.pipe($.plumber())
	.pipe($.data(function(){
		var abcData = require('./source/data/data.json');
		var menu = require('./source/data/menu.json');
		var source = {
			'abcData': abcData,
			'menu':menu
		};
		
		return source;
	}))
	.pipe($.jade({
	pretty:true
	}))
	.pipe(gulp.dest('./public/'))
	.pipe(browserSync.stream());
});

gulp.task('sass', function () {
var plugins = [
	autoprefixer({browsers: ['last 3 version','>5%']}),
];
return gulp.src('./source/scss/**/*.scss')
.pipe($.plumber()) 
.pipe($.sourcemaps.init())
.pipe($.sass().on('error', $.sass.logError))
//編譯完成css
.pipe($.postcss(plugins))
.pipe($.if(options.env === 'production', $.cleanCss()))
.pipe($.sourcemaps.write('.'))
.pipe(gulp.dest('./public/css'))
.pipe(browserSync.stream());
//這是重整之後就會自動重新整理一次的意思
});

gulp.task('minify-css', () => {
	return gulp.src('./source/scss/**/*.scss')
	.pipe(cleanCSS({compatibility: 'ie8'}))
	.pipe(gulp.dest('./public/css'));
});
	
gulp.task('babel', () =>
gulp.src('./source/js/**/*.js')
	.pipe($.sourcemaps.init())
	.pipe($.babel({
		presets: ['env']
	}))
	.pipe($.concat('all.js'))
	// .pipe($.uglify())
	.pipe($.if(options.env === 'production',$.uglify({
		compress:{
			drop_console: true
		}
	})))
	//上面是如果想要全部的CONSOLE.LOG()都不見的話可以這樣子寫喔^^
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest('./public/js'))
	.pipe(browserSync.stream())
);


gulp.task('bower', function() {
	return gulp.src(mainBowerFiles())
		.pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs',['bower'], function() {
	return gulp.src('./.tmp/vendors/**/**.js')
	.pipe($.concat('vendors.js'))
	.pipe($.if(options.env === 'production',$.uglify()))
	.pipe(gulp.dest('./public/js'))
});

gulp.task('browser-sync', function() {
	browserSync.init({
		server: {
			baseDir: "./public"
		},
		reloadDebounce: 2000
	});
});

gulp.task('image-min', () =>
gulp.src('./source/images/*')
	.pipe($.if(options.env === 'production',$.imagemin()))
	.pipe(gulp.dest('./public/images'))
);
gulp.task('watch', function () {
gulp.watch('./source/scss/**/*.scss', ['sass']);
gulp.watch('./source/**/*.jade', ['jade']);
gulp.watch('./source/js/**/*.js', ['babel']);
});

gulp.task('deploy', function() {
return gulp.src('./public/**/*')
	.pipe($.ghPages());
});
gulp.task('build', gulpSequence('clean','jade','sass','minify-css','babel','vendorJs','stream','callback'))
gulp.task('default', ['jade','sass','minify-css','babel','vendorJs','stream','callback','browser-sync','watch'])

gulp.task('stream', function () {
// Endless stream mode
return watch('./source/scss/**/*.scss', { ignoreInitial: false })
	.pipe(gulp.dest('./public/css'));
});
	
gulp.task('callback', function () {
	// Callback mode, useful if any plugin in the pipeline depends on the `end`/`flush` event
	return watch('./source/scss/**/*.scss', function () {
		gulp.src('./source/scss/**/*.scss')
			.pipe(gulp.dest('./public/css'));
	});
});
