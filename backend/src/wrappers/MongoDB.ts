import { MongoClient, Cursor } from "mongodb";
import { Vote, SongRating, User } from "../schemas";
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
  async addVote(votingToken: string, votes: SongRating[]) {
    const db = await this.connectToDB();
    const user = await db.collection("users").findOne({ votingToken: votingToken });
    const vote = {} as Vote;
    vote.votingDate = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
    vote.user = user.user.id;
    vote.ratings = votes;
    const result = await db
      .collection("votes")
      .replaceOne({ user: vote.user, votingDate: vote.votingDate }, vote, { upsert: true });

    if (result.result.nModified)
      console.log("Overwrote old vote from user:" + vote.user + ". MongoDB result:", result.result.ok);
    else console.log("Added new vote for user:" + vote.user + ". MongoDB result:", result.result.ok);
  }

  async checkVotingToken(votingToken: string): Promise<User | null> {
    const db = await this.connectToDB();
    return db.collection("users").findOne({ votingToken: votingToken });
  }

  async addUser(votingToken: string, userInfo: SpotifyApi.UserObjectPublic, refreshToken: string) {
    const db = await this.connectToDB();
    const operation = await db
      .collection("users")
      .replaceOne(
        { "user.id": userInfo.id },
        { votingToken: votingToken, user: userInfo, refreshToken: refreshToken },
        { upsert: true },
      );
    if (operation.result.nModified)
      console.log("Overwrote existing user " + userInfo.id + ". MongoDB result:", operation.result.ok);
    else console.log("Added new user " + userInfo.id + ". MongoDB result:", operation.result.ok);
  }
  async getVotesFromToday(): Promise<Cursor<Vote>> {
    const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
    const db = await this.connectToDB();
    return db.collection("votes").find({ votingDate: today });
  }
}

const Persistence = new MongoDBWrapper();
export default Persistence;
