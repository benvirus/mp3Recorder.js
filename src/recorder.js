import Worker from 'webworkify';
let segmentNum = 0;

const Uint8ArrayToFloat32Array = (u8a) => {
  var f32Buffer = new Float32Array(u8a.length);
  for (var i = 0; i < u8a.length; i++) {
    var value = u8a[i << 1] + (u8a[(i << 1) + 1] << 8);
    if (value >= 0x8000) value |= ~0x7FFF;
    f32Buffer[i] = value / 0x8000;
  }
  return f32Buffer;
}

class Recorder {
  constructor(source, cfg) {
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    var numChannels = config.numChannels || 2;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
        this.context.createJavaScriptNode)
      .call(this.context,
        bufferLen, numChannels, numChannels);

    this.recorderWorker = new Worker(require('./recorderWorker.js'));
    this.recorderWorker.onmessage = (e) => {
      var buffer = new Uint8Array(e.data);
      segmentNum++;
      encoderWorker.postMessage({ cmd: 'encode', buf: Uint8ArrayToFloat32Array(buffer) });
    }
    this.recorderWorker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: numChannels
      }
    });

    const encoderWorker = new Worker(require('./mp3Worker.js'));
    encoderWorker.postMessage({
      cmd: 'init',
      config: {
        mode: 3,
        channels: 1,
        samplerate: 44100,
        bitrate: 16
      }
    });

    this.node.onaudioprocess = (e) => {
      console.log(111);
      if (!this.recording) return;
      var buffer = [];
      for (var channel = 0; channel < numChannels; channel++) {
        buffer.push(e.inputBuffer.getChannelData(channel));
      }
      this.recorderWorker.postMessage({
        command: 'record',
        buffer: buffer
      });
    }
    source.connect(this.node);
    this.node.connect(this.context.destination);
  }

  record() {
    this.recording = true;
    console.log(this.recording);
  }

  stop() {
    this.recording = false;
    console.log(this.recording);
  }

  clear() {
    this.worker.postMessage({ command: 'clear' });
  }


}

export default Recorder;

