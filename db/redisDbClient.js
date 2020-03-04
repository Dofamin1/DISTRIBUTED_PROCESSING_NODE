const serialize = require('serialize-javascript');

const STACK_NAME = 'stack';

class RedisDbClient {
    constructor(client) {
        this.client = client;
    }

    async fetchTasks(size) {
        const result = [];
        for (let i = 0; i < size; i++) {
            const task = this.client.lpop(STACK_NAME);
            if (task === null) break;
            result.push(task);
        }
        return result;
    }

    async pushTask(task) {
        if (!task.execute instanceof Function) {
            throw new Error("Method execute is not implemented");
        }
        return this.client.lpush(STACK_NAME, serialize(task));
    }
}

module.exports = RedisDbClient;