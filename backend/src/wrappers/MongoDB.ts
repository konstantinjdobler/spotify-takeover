import { MongoClient } from "mongodb";
import { User, TakeoverEvent } from "../schemas";
require("dotenv").config();

class MongoDBWrapper {
  mongoConnectionString: string;
  constructor() {
    this.mongoConnectionString = process.env.MONGO_CONNECTION_STRING!;
  }

  async connectToDB() {
    return MongoClient.connect(this.mongoConnectionString).then(client => {
      if (!client) throw new Error("error connecting to mongo - client undefined");
      return client.db("daily-song-vote");
    });
  }
  async addTakeoverEvent(authenticityToken: string) {
    const db = await this.connectToDB();
    const user = await db.collection("users").findOne({ authenticityToken: authenticityToken }) as User;
    const takeoverEvent: TakeoverEvent = {
      timestamp: new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }),
      userID: user.user.id,
      orderedSongs: []
    };

    const result = await db
      .collection("takeoverEvents")
      .insertOne(takeoverEvent);

    console.log("Added new takeover event for user:" + user.user.display_name || user.user.id + ". MongoDB result:", result.result.ok);
  }

  async getUserForToken(authenticityToken: string): Promise<User | null> {
    const db = await this.connectToDB();
    return db.collection("users").findOne({ authenticityToken: authenticityToken });
  }

  async addUser(authenticityToken: string, userInfo: SpotifyApi.UserObjectPublic, refreshToken: string) {
    const db = await this.connectToDB();
    const operation = await db
      .collection("users")
      .replaceOne(
        { "user.id": userInfo.id },
        { authenticityToken: authenticityToken, user: userInfo, refreshToken: refreshToken },
        { upsert: true },
      );
    console.log("Added new user " + userInfo.id + ". MongoDB result:", operation.result.ok);
  }

}

const Persistence = new MongoDBWrapper();
export default Persistence;
