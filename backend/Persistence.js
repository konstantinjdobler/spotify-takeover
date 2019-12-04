/* eslint-disable require-jsdoc */

const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

class PersistenceClass {
  constructor() {
    this.mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
  }

  async connectToDB() {
    return MongoClient.connect(this.mongoConnectionString).then(client => {
      if (!client) throw new Error("error connecting to mongo - client undefined");
      return client.db("daily-song-vote");
    });
  }
  async addVote(votingToken, votes) {
    const db = await this.connectToDB();
    const user = await db.collection("users").findOne({ votingToken: votingToken });
    const vote = {};
    vote.votingDate = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
    vote.user = user.user.id;
    vote.votes = votes;
    console.log("Inserting vote:", vote);
    const result = await db
      .collection("votes")
      .replaceOne({ user: vote.user, votingDate: vote.votingDate }, vote, { upsert: true });

    console.log("addVote result:", result.result);
  }

  async checkVotingToken(votingToken) {
    const db = await this.connectToDB();
    const result = await db.collection("users").findOne({ votingToken: votingToken });
    console.log("checkVotingToken result:", result);
    return result;
  }

  async addVotingToken(votingToken, userInfo, refreshToken) {
    const db = await this.connectToDB();
    const result = await db
      .collection("users")
      .replaceOne(
        { "user.id": userInfo.id },
        { votingToken: votingToken, user: userInfo, refreshToken: refreshToken },
        { upsert: true },
      );
    console.log("addVotingToken result:", result.result);
  }
  async getVotesFromToday() {
    const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
    const db = await this.connectToDB();
    const result = await db.collection("votes").find({ votingDate: today });
    return result;
  }
}

const exportPersistence = new PersistenceClass();
export default exportPersistence;
