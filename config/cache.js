const { createClient } = require('redis');

class RedisConnection {
    constructor(url) {
        this.url = url;
        this.pubClientt = null;
        this.subClient = null;
    }

    async connect() {
        try{
            this.pubClient = createClient({url: this.url});
            await this.pubClient.connect();
            console.log("Redis PubClient connected successfully!");

            this.subClient = this.pubClient.duplicate();
            await this.subClient.connect();
            console.log("Redis Subclient connected successfully!");

        } catch(error) {
            console.error("Redis connection error:", error);
        }
    }

    getPubClient() {
        return this.pubClient;
    }


    getSubClient() {
        return this.subClient;
    }
    
    async disconnect() {
        try {
          if (this.pubClient) {
            await this.pubClient.disconnect();
            console.log("Redis PubClient disconnected successfully!");
          }
          if (this.subClient) {
            await this.subClient.disconnect();
            console.log("Redis SubClient disconnected successfully!");
          }
        } catch (error) {
          console.error("Error disconnecting Redis clients:", error);
        }
    }

}

module.exports = RedisConnection;