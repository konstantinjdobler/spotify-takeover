import { MongoClient } from "mongodb";
import { FullUser, TakeoverEvent, Temp } from "../schemas";
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
    return result !== null;
  }
  async addTakeoverEvent(spotifyUserInfo: SpotifyApi.UserObjectPublic) {
    const db = await this.connectToDB();
    const takeoverEvent: TakeoverEvent = {
      timestamp: new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }),
      spotifyUserID: spotifyUserInfo.id,
      orderedSongs: [],
    };

    const result = await db.collection<TakeoverEvent>("takeoverEvents").insertOne(takeoverEvent);

    console.log(
      "Added new takeover event for user:" + spotifyUserInfo.display_name || spotifyUserInfo.id + ". MongoDB result:",
      result.result.ok,
    );
  }

  async addTemp(tempCode: string, name: string, isRoadtripParticipant: boolean) {
    const db = await this.connectToDB();
    db.collection<Temp>("temp").insertOne({ tempCode, name, isRoadtripParticipant, used: false });
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
    isRoadtripParticipant: boolean,
  ) {
    const db = await this.connectToDB();
    const operation = await db
      .collection<FullUser>("users")
      .replaceOne(
        { "spotify.id": userInfo.id },
        { authenticityToken, spotify: userInfo, refreshToken, name, isRoadtripParticipant },
        { upsert: true },
      );
    console.log("Added new user " + userInfo.id + ". MongoDB result:", operation.result.ok);
  }
}

const Persistence = new MongoDBWrapper();
export default Persistence;
