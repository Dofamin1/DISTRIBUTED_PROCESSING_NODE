const {errorHandler, log} = require("./helpers");
const MasterBusinessLogic = require("./businessLogic/master");
const WorkerBusinessLogic = require("./businessLogic/worker");
const Redis = require('ioredis');
const RedisDbClient = require('./db/redisDbClient');
const {FIRST_START_NODE_STATUS, UUID} = process.env;

const DEFAULT_TIMEOUT = 1000;

class Node {
  constructor({UUID, businessLogic, dbClient}) {
    this.uuid = UUID;
    this.businessLogic = businessLogic;
    this.dbClient = dbClient;
    this.isAlive = true;
  }

  async work() {
    throw new Error("Is not implemented")
  }

  shutdown() {
    this.isAlive = false;
  }
}

class Worker extends Node {
  constructor({UUID, businessLogic, dbClient, timeout}) {
    super({UUID, businessLogic, dbClient});
    this.timeout = timeout;
  }

  async work() {
    if (!this.isAlive) return Promise.resolve();
    const task = await this.dbClient.fetchTask();
    const nextWork = () => this.work();
    if (task) {
      const {UUID, result} = this.businessLogic.accept(task);
      await this.dbClient.pushResult({UUID, result});
      return nextWork();
    } else {
      return new Promise(resolve => {
        setTimeout(
          () => nextWork.then(() => resolve()),
          this.timeout
        )
      })
    }
  }
}

class Master extends Node {
  constructor({UUID, businessLogic, dbClient, timeout, taskSupplier}) {
    super({UUID, businessLogic, dbClient});
    this.taskSupplier = taskSupplier;
    this.timeout = timeout;
  }

  async work() {
    return new Promise(resolve => {
      const work = async () => {
        const tasks = this.taskSupplier();
        for (const task of tasks) {
          await this.dbClient.pushTask(task);
        }
      };
      if (this.isAlive) {
        setTimeout(work, this.timeout);
      } else {
        resolve();
      }
    });
  }
}

class Nodes {
  static ofMasterNode({UUID, dbClient, timeout = DEFAULT_TIMEOUT, taskSupplier}) {
    const businessLogic = new MasterBusinessLogic();
    return new Master({UUID, businessLogic, dbClient, taskSupplier});
  }

  static ofWorkerNode({UUID, dbClient, timeout = DEFAULT_TIMEOUT}) {
    const businessLogic = new WorkerBusinessLogic();
    return new Worker({UUID, businessLogic, dbClient});
  }
}

class OrchestratorClient {
  constructor(initialNode, client) {
    this.currentNode = initialNode;
    this.client = client;
  }

  startResponding(interval) {
    const signal = () => this.client.sentIsAlive(UUID);
    setInterval(signal, interval)
  }

  withDynamicChangeRole(interval) {
    const monitoring = () => this.client.whoAmI()
      .then(res => {
        const role = res.role;
        if (this.currentNode.prototype.name.toLowerCase() !== role) {
          this.currentNode.shutdown();
          switch (role) {
            case Master.name.toLowerCase():
              this.currentNode = Nodes.ofMasterNode(MASTER_PARAMS);
              this.currentNode.work();
              break;
            case Worker.name.toLowerCase():
              this.currentNode = Nodes.ofWorkerNode(WORKER_PARAMS);
              this.currentNode.work();
              break;
          }
        }
      });
    setInterval(monitoring, interval);
    return this;
  }
}

const webSocketClient = null;
const WORKER_PARAMS = {
  UUID,
  dbClient: new RedisDbClient(new Redis())
};
const MASTER_PARAMS = {
  UUID,
  dbClient: new RedisDbClient(new Redis()),
  taskSupplier: () => webSocketClient.reciveTasks()
};


const interval = 1000;
const node = FIRST_START_NODE_STATUS === "master" ?
  Nodes.ofMasterNode(MASTER_PARAMS) :
  Nodes.ofWorkerNode(WORKER_PARAMS);

const orchestratorClient = new OrchestratorClient(node, webSocketClient)
  .withDynamicChangeRole(interval);

orchestratorClient.startResponding();
node.work();

