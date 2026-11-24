importScripts("engine.js?v=4");
self.onmessage = ({data}) => {
  try {
    self.postMessage({board: Paradox.generate(data.seed, data.level, data.version)});
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
