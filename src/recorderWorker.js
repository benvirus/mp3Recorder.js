var recLength = 0,
  recBuffers = [],
  sampleRate,
  numChannels;

function init(config) {
  sampleRate = config.sampleRate;
  numChannels = config.numChannels;
  initBuffers();
}


function clear() {
  recLength = 0;
  recBuffers = [];
  initBuffers();
}

function initBuffers() {
  for (var channel = 0; channel < numChannels; channel++) {
    recBuffers[channel] = [];
  }
}

function mergeBuffers(recBuffers, recLength) {
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < recBuffers.length; i++) {
    result.set(recBuffers[i], offset);
    offset += recBuffers[i].length;
  }
  return result;
}

function interleave(inputL, inputR) {
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0,
    inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples) {
  var buffer = new ArrayBuffer(samples.length * 2);
  var view = new DataView(buffer);
  floatTo16BitPCM(view, 0, samples);
  return view;
}

export default (self) => {
  self.addEventListener('message', e => {
    switch (e.data.command) {
      case 'init':
        init(e.data.config);
        break;
      case 'record':
        record(e.data.buffer);
        break;
      case 'exportWAV':
        exportWAV(e.data.type);
        break;
      case 'getBuffer':
        getBuffer();
        break;
      case 'clear':
        clear();
        break;
    }
  });

  function record(inputBuffer) {
    for (var channel = 0; channel < numChannels; channel++) {
      recBuffers[channel] = [];
      recBuffers[channel].push(inputBuffer[channel]);
    }
    recLength = inputBuffer[0].length;
    exportWAV();
  }

  function exportWAV() {
    var buffers = [];
    for (var channel = 0; channel < numChannels; channel++) {
      buffers.push(mergeBuffers(recBuffers[channel], recLength));
    }
    if (numChannels === 2) {
      var interleaved = interleave(buffers[0], buffers[1]);
    } else {
      var interleaved = buffers[0];
    }
    var dataview = encodeWAV(interleaved);

    self.postMessage(dataview.buffer);
  }
}

