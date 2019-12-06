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
      vote.ratings.forEach(ratings => {
        if (votesDict[ratings.trackURI] === undefined) votesDict[ratings.trackURI] = 0;
        votesDict[ratings.trackURI] += ratings.value;
      });
    }
    const mostVotedSongs = getMax(votesDict);
    const today = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    console.log("Most voted songs so far:", mostVotedSongs, "time:", today);
  });
}
