const STACK_NAME = 'stack';
class RedisDbClient {
    constructor(client) {
        this.client = client;
    }

    async fetchTask() {
        return this.client.lpop(STACK_NAME);
    }

    async pushTask(task) {
        return this.client.lpush(STACK_NAME, task);
    }

    async pushResult({UUID, result}) {
        return this.client.set(`${UUID}_result`, result);
    }
}

module.exports = RedisDbClient;