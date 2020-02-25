class MessagesController {
  constructor() {
    this.eventsInterface;
  }

  setInterface({ EventsInterface, eventsToSubscribe }) {
    this.eventsInterface = new EventsInterface();

    eventsToSubscribe.forEach(({ eventName, callback }) => {
      this.eventsInterface.subscribeToEvents({ eventName, callback });
    });
  }
}
