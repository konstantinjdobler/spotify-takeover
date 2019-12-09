import Persistence from "../wrappers/MongoDB";
import schedule from "node-schedule";
import axios from "axios";
require("dotenv").config();
const getMax = (object: { [key: string]: number }) => {
  return Object.keys(object).filter(x => {
    return object[x] == Math.max.apply(null, Object.values(object));
  });
};

function postToSlack(text: string) {
  axios.post(process.env.SLACK_WEBHOOK_URL!, { text });
}

async function getMostVotedSongsToday() {
  const votesCursor = await Persistence.getVotesFromToday();
  const voteObjects = await votesCursor.toArray();
  const votesDict: { [trackURI: string]: number } = {};
  for (const vote of voteObjects) {
    vote.ratings.forEach(ratings => {
      if (votesDict[ratings.trackURI] === undefined) votesDict[ratings.trackURI] = 0;
      votesDict[ratings.trackURI] += ratings.value;
    });
  }
  return getMax(votesDict);
}
export async function scheduleCron() {
  const httpScheme = process.env.NODE_ENV === "production" ? "https" : "http";

  schedule.scheduleJob("Vote Analysis", { minute: [30], dayOfWeek: [1, 2, 3, 4, 5] }, async function() {
    const mostVotedSongs = await getMostVotedSongsToday();
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    if (today.getHours() === 8) postToSlack("Don't forget to add a song and vote today :)");
    else if (today.getHours() > 8 && today.getHours() < 18) {
      console.log("Most voted songs so far:", mostVotedSongs, "time:", today.toString(), today.getHours());
      if (today.getHours() === 17 || today.getHours() === 16) {
        mostVotedSongs.length === 1
          ? postToSlack(`Current leader is spotify track ${mostVotedSongs[0]}`)
          : postToSlack(`There's a tie! Current leaders are spotify tracks ${mostVotedSongs.join(" and ")}`);
      }
    } else if (today.getHours() == 18) {
      await axios.post(`${httpScheme}://backend:${process.env.PORT}/add-song-to-selecion`, {
        secret: process.env.SECRET,
        trackURIs: mostVotedSongs,
      });
      const winMessage =
        mostVotedSongs.length === 1
          ? `And the winner is... ${mostVotedSongs[0]} .`
          : `There were multiple winners! You're a winner, you're a winner, everyone is a winner! ${mostVotedSongs.join(
              " and ",
            )} .`;
      postToSlack(
        `${winMessage} Check out the EPIC Seleçion at https://open.spotify.com/playlist/4QXV4uZAyINdgUX1yPCtEJ?si=Rq8zaUjiSn-Qy0w5tWuOrw`,
      );
    }
  });
}
