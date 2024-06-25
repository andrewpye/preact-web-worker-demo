import Frame from './Frame/Frame.js';

export default class WorkerSafeFrame extends Frame {
  getMountTarget() {
    // Fall back to the body since initial content that would be written
    // via document.write() won't be written in the worker.
    return super.getMountTarget() ?? this.getDoc().body;
  }
};
