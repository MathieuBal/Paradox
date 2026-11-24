importScripts("engine.js?v=5");
self.onmessage = ({data}) => {
  try {
    self.postMessage({board: Paradox.generate(data.seed, data.level, data.version,data.signal)});
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
