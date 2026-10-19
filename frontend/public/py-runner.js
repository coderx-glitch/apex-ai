// APEX Python runner worker. Loads the vendored Pyodide engine once, then runs
// standard-library Python sent from the page. No pip, no network, no file access.
import { loadPyodide } from '/pyodide/pyodide.mjs';
let py = null, loading = null;
async function engine() {
  if (py) return py;
  if (!loading) {
    postMessage({ type: 'status', text: 'Downloading the Python engine (~13MB, one time)…' });
    loading = loadPyodide({ indexURL: '/pyodide/' }).then(instance => {
      py = instance;
      py.setStdout({ batched: s => postMessage({ type: 'stdout', text: s }) });
      py.setStderr({ batched: s => postMessage({ type: 'stderr', text: s }) });
      postMessage({ type: 'status', text: 'Python engine ready. Running on this device.' });
      return py;
    });
  }
  return loading;
}
onmessage = async e => {
  const { id, code } = e.data || {};
  if (typeof code !== 'string' || !id) return;
  try {
    const instance = await engine();
    const result = await instance.runPythonAsync(code);
    postMessage({ id, type: 'done', result: result === undefined ? '' : String(result) });
  } catch (err) {
    postMessage({ id, type: 'error', text: String((err && err.message) || err).slice(0, 3000) });
  }
};
