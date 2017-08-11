import Recorder from './recorder.js';

class MP3Recorder {
  constructor(){
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      window.navigator.getUserMedia = (
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
      window.URL = window.URL || window.webkitURL;

      this.audio_context = new AudioContext;
    } catch(e) {
      alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({
      audio: true
    }, stream => {
      let input = this.audio_context.createMediaStreamSource(stream);
      this.recorder = new Recorder(input, {
        numChannels: 1
      });
    }, e => {
      __log('No live audio input: ' + e);
    });
  }

  start(){
    this.recorder.record();
  }

  stop(){
    this.recorder.stop();
  }

  finish(){

  }
}

if (typeof define === 'function' && define.amd) {
  define('MP3Recorder', [], () => MP3Recorder);
// checking that module is an object too because of umdjs/umd#35
} else if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = MP3Recorder;
}

export default MP3Recorder;