/* eslint-disable require-jsdoc */
const schedule = require("node-schedule");
const axios = require("axios");
require("dotenv").config();

import Persistence from "./Persistence";
const getMax = object => {
  return Object.keys(object).filter(x => {
    return object[x] == Math.max.apply(null, Object.values(object));
  });
};
export function schduleCron() {
  schedule.scheduleJob({ minute: [0, 30], dayOfWeek: [1, 2, 3, 4, 5] }, async function() {
    const votesCursor = await Persistence.getVotesFromToday();
    const voteObjects = await votesCursor.toArray();
    const votesDict = {};
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
