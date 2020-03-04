class WorkerBusinessLogic {
  constructor() {

  }
  executeTask() {
    console.log("hello i am task executor");

    return { result: 'ok' }
  }
}

module.exports = WorkerBusinessLogic
