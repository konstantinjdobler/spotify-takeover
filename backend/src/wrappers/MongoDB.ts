import { MongoClient } from "mongodb";
import { FullUser, Temp, SongInjectionEvent } from "../schemas";
import { UserCapabilities } from "src/sharedTypes";
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

  async totalSongInjectionsForUser(authenticityToken: string) {
    const db = await this.connectToDB();
    return db.collection<SongInjectionEvent>("songInjections").countDocuments({
      authenticityToken: authenticityToken,
    });
  }
  async addSongInjection(userInfo: FullUser, songURI: string) {
    const db = await this.connectToDB();
    const takeoverEvent: SongInjectionEvent = {
      timestamp: new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }),
      authenticityToken: userInfo.authenticityToken,
      songURI,
    };

    const result = await db.collection<SongInjectionEvent>("songInjections").insertOne(takeoverEvent);

    console.log("Added new song injection event for user:" + userInfo.name + ". MongoDB result:", result.result.ok);
  }

  async addTemp(tempCode: string, name: string, capabilities: UserCapabilities) {
    const db = await this.connectToDB();
    db.collection<Temp>("temp").insertOne({ tempCode, name, capabilities, used: false });
  }

  async validateTempCode(tempCode: string) {
    const db = await this.connectToDB();
    return db
      .collection<Temp>("temp")
      .findOneAndUpdate({ tempCode, used: false }, { $set: { used: true } })
      .then(result => result.value);
  }

  async userForSpotifyID(spotifyID: string) {
    const db = await this.connectToDB();
    return db.collection<FullUser>("users").findOne({ "spotify.id": spotifyID });
  }

  async getUserForToken(authenticityToken: string): Promise<FullUser | null> {
    const db = await this.connectToDB();
    return db.collection<FullUser>("users").findOne({ authenticityToken: authenticityToken });
  }

  async addSlaveRefreshTokenToUser(authenticityToken: string, slaveRefreshToken: string) {
    const db = await this.connectToDB();
    return db.collection<FullUser>("users").updateOne({ authenticityToken }, { $set: { slaveRefreshToken } });
  }

  async addMasterRefreshTokenToUser(authenticityToken: string, masterRefreshToken: string) {
    const db = await this.connectToDB();
    return db.collection<FullUser>("users").updateOne({ authenticityToken }, { $set: { masterRefreshToken } });
  }

  async updateUser(authenticityToken: string, update: Partial<FullUser>) {
    const db = await this.connectToDB();
    return db.collection<FullUser>("users").updateOne({ authenticityToken }, update);
  }

  async addUser(
    authenticityToken: string,
    userInfo: SpotifyApi.UserObjectPrivate,
    refreshToken: string,
    name: string,
    capabilities: UserCapabilities,
  ) {
    const db = await this.connectToDB();
    const operation = await db
      .collection<FullUser>("users")
      .replaceOne(
        { "spotify.id": userInfo.id },
        { authenticityToken, spotify: userInfo, refreshToken, name, capabilities },
        { upsert: true },
      );
    console.log("Added new user " + userInfo.id + ". MongoDB result:", operation.result.ok);
  }
}

const Persistence = new MongoDBWrapper();
export default Persistence;
