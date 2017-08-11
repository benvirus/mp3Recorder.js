import gulp from 'gulp';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import Notifier from 'node-notifier';

const bundle = () => {
  return new Promise((resolve, reject) => {
    browserify('./src/main.js', {
      standalone: 'MP3Recorder',
      debug: true
    })
    .bundle()
    .on('error', (err) => {
      console.log(err.message);
      console.log(err.codeFrame);
      console.log(err.loc);
      Notifier.notify({
        title: 'Bundle Error',
        message: err.message,
        sound: 'Frunk'
      })
    })
    .pipe(source('mp3Recorder.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist'))
    .on('end', () => {
      resolve()
    })
    .on('error', (err) => {
      reject(err);
    });
  })
}

gulp.task('dev', () => {
  gulp.watch('./src/**/*.js', (file) => {
    console.log(file.path);
    bundle();
  });
})