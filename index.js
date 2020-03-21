const {errorHandler, log, generateUUID} = require("./helpers");
const MasterBusinessLogic = require("./businessLogic/master");
const WorkerBusinessLogic = require("./businessLogic/worker");
const {WebSocketClient} = require('./websocketClient');
const RedisDbClient = require('./db/redisDbClient');
const Redis = require('ioredis');

const {FIRST_START_NODE_STATUS, UUID} = process.env;
const DEFAULT_TIMEOUT = 1000;

console.dir(process.env);

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
          () => nextWork().then(() => resolve()),
          this.timeout
        )
      });
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
      const workNext = async () => {
        const tasks = await this.taskSupplier();
        for (const task of tasks) {
          await this.dbClient.pushTask(task);
        }
      };
      if (this.isAlive) {
        setInterval(workNext, this.timeout);
      } else {
        resolve();
      }
    });
  }
}

class Nodes {
  static ofMasterNode({UUID, dbClient, timeout = DEFAULT_TIMEOUT, taskSupplier}) {
    const businessLogic = new MasterBusinessLogic();
    return new Master({UUID, businessLogic, dbClient, timeout, taskSupplier});
  }

  static ofWorkerNode({UUID, dbClient, timeout = DEFAULT_TIMEOUT}) {
    const businessLogic = new WorkerBusinessLogic();
    return new Worker({UUID, businessLogic, dbClient, timeout});
  }
}

class OrchestratorClient {
  constructor(initialNode, client, roleMap = OrchestratorClient.initDefaultRoleMap()) {
    this.currentNode = initialNode;
    this.client = client;
    this.roleMap = roleMap;
  }

  static initDefaultRoleMap() {
    const map = new Map();
    map.set(Master.name.toLowerCase(), () => Nodes.ofMasterNode(MASTER_PARAMS));
    map.set(Worker.name.toLowerCase(), () => Nodes.ofWorkerNode(WORKER_PARAMS));
    return map;
  }

  startResponding(interval) {

    const signal = () => this.client.sendData({
      event: "status",
      data: {
        status: "ok",
        uuid: this.currentNode.uuid,
        role: this.currentNode.constructor.name
      }
    });
    setInterval(signal, interval);
  }

  withDynamicChangeRole(interval) {
    setInterval(() => this.client.onEvent("whoAmI", res => {
      const role = res.role;
      if (this.currentNode.prototype.name.toLowerCase() !== role) {
        this.currentNode.shutdown();
        this.currentNode = this.roleMap.get(role);
        this.currentNode.work()
          .then(() => log(`Role has changed status`));
      }
    }), interval);
    return this;
  }

  runInitialNode() {
    this.currentNode.work()
      .then(() => log("Initial node has started"));
    return this;
  }
}

const client = new WebSocketClient();
const redisDbClient = new RedisDbClient(new Redis());
const WORKER_PARAMS = {
  UUID,
  dbClient: redisDbClient
};
const MASTER_PARAMS = {
  UUID,
  dbClient: redisDbClient,
  taskSupplier: () => [].fill({
    UUID: generateUUID(),
    execute() {
      function fib(n) {
        return n <= 1 ? n : fib(n - 1) + fib(n - 2);
      }
      return fib((Math.random() * 50) | 0);
    }
  }, 0, 1000)};

const INTERVAL = 1000;
const node = FIRST_START_NODE_STATUS === "master" ?
  Nodes.ofMasterNode(MASTER_PARAMS) :
  Nodes.ofWorkerNode(WORKER_PARAMS);

const orchestratorClient = new OrchestratorClient(node, client);
orchestratorClient
  .runInitialNode()
  .startResponding(INTERVAL);

