class WorkerBusinessLogic {
  accept(task) {
    const executableObject = eval('(' + task + ')');
    if (this._isFunction(task) && this._hasRequiredFields(executableObject)) {
      throw new Error("Object is inappropriate");
    }
    return {
      result: executableObject.execute(),
      UUID: executableObject.UUID
    }
  }

  _isFunction(executableObject) {
    return !executableObject.execute instanceof Function;
  }

  _hasRequiredFields(executableObject) {
    return executableObject.prototype.hasOwnProperty('UUID');
  }
}

module.exports = WorkerBusinessLogic;
