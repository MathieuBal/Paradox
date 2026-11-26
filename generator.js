importScripts("engine.js?v=80");
self.onmessage = ({data}) => {
  try {
    self.postMessage({board: Paradox.generate(data.seed, data.level, data.version,data.signal,data.twin)});
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
