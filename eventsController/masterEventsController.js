const  EventsController  = require("./eventsController");

class MasterEventsController extends EventsController {
  constructor() {
    super("Master Node");
  }
}
module.exports = MasterEventsController;
