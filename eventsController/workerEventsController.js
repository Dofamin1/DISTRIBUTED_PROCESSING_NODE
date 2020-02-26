const  EventsController  = require("./eventsController");

class WorkerEventsController extends EventsController {
  constructor() {
    super("Worker Node");
  }
}

module.exports = WorkerEventsController;
