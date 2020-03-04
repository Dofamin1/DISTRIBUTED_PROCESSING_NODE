class WorkerBusinessLogic {
  executeTask(task) {
    console.log("hello i am task executor");
    if (!task.execute instanceof Function) {
      throw new Error("Method execute is not implemented");
    }
    return { result: eval('(' + task + ')') }
  }
}

module.exports = WorkerBusinessLogic;
