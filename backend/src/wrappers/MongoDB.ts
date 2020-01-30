import { MongoClient } from "mongodb";
import { User, TakeoverEvent } from "../schemas";
require("dotenv").config();

class MongoDBWrapper {
  mongoConnectionString: string;
  constructor() {
    this.mongoConnectionString = process.env.MONGO_CONNECTION_STRING!;
  }

  async connectToDB() {
    // TODO: optimize, don't always create new connection
    return MongoClient.connect(this.mongoConnectionString).then(client => {
      if (!client) throw new Error("error connecting to mongo - client undefined");
      return client.db("spotify-takeover");
    });
  }

  async userHasAlreadyHadTakeoverToday(spotifyUserID: string) {
    const db = await this.connectToDB();
    const result = await db.collection<TakeoverEvent>("takeoverEvents").findOne({
      spotifyUserID: spotifyUserID,
      timestamp: new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }),
    });
    return result != null;
  }
  async addTakeoverEvent(spotifyUserInfo: SpotifyApi.UserObjectPublic) {
    const db = await this.connectToDB();
    const takeoverEvent: TakeoverEvent = {
      timestamp: new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }),
      spotifyUserID: spotifyUserInfo.id,
      orderedSongs: [],
    };

    const result = await db.collection("takeoverEvents").insertOne(takeoverEvent);

    console.log(
      "Added new takeover event for user:" + spotifyUserInfo.display_name || spotifyUserInfo.id + ". MongoDB result:",
      result.result.ok,
    );
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
        { "spotify.id": userInfo.id },
        { authenticityToken: authenticityToken, spotify: userInfo, refreshToken: refreshToken },
        { upsert: true },
      );
    console.log("Added new user " + userInfo.id + ". MongoDB result:", operation.result.ok);
  }
}

const Persistence = new MongoDBWrapper();
export default Persistence;
