import Persistence from "../wrappers/MongoDB";
import schedule from "node-schedule";
import axios from "axios";
require("dotenv").config();

const getMax = (object: { [key: string]: number }) => {
  return Object.keys(object).filter(x => {
    return object[x] == Math.max.apply(null, Object.values(object));
  });
};
export function scheduleCron() {
  schedule.scheduleJob({ minute: [0, 30], dayOfWeek: [1, 2, 3, 4, 5] }, async function() {
    const votesCursor = await Persistence.getVotesFromToday();
    const voteObjects = await votesCursor.toArray();
    const votesDict: { [trackURI: string]: number } = {};
    for (const vote of voteObjects) {
      vote.votes.forEach(partialVoteOfUser => {
        if (votesDict[partialVoteOfUser.trackURI] === undefined) votesDict[partialVoteOfUser.trackURI] = 0;
        votesDict[partialVoteOfUser.trackURI] += partialVoteOfUser.vote;
      });
    }
    const mostVotedSongs = getMax(votesDict);
    const today = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    console.log("Most voted songs so far:", mostVotedSongs, "time:", today);
  });
}
