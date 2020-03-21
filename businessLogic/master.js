const serialize = require('serialize-javascript');

class MasterBusinessLogic {
  accept(task){
    if (!task.execute instanceof Function) {
      throw new Error("Method execute is not implemented");
    }
    return serialize(task);
  }
}

module.exports = MasterBusinessLogic;
