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

const votingReminders = [
  "Don't forget to add a song and vote today :)",
  "C'mon! Why has nobody added a song yet?",
  "The first one who votes today gets a custom joke delivered to him!",
  "I'm kind of lonely here, can anybody add a song to give me some company? :(",
  "Hey, guys! An added song and a vote a day keeps the doc away. Just sayin'...",
];

const singleTrackLeading = [
  "Current leader is spotify track ",
  "And in the pole position leading today, we have ",
  "Guess who's on top right now? That's right, it's ",
  "The one song to rule them all (well, if nobody changes his vote...) ",
  "Sorry kids, no participation throphies here... Currently leading is ",
  "Don't count your chickens before they hatch! You may be leading but you have not won yet. ",
];

const multipleTracksLeading = [
  "Don't count your chickens before they hatch! And you have multiple eggs today. ",
  "I can't give you a single leader right now, we've got a tie: ",
  "The following songs are leading right now, it's a tie: ",
  "What's the best thing about Switzerland? I don't know but flag is a big plus. Oh and by the way, multiple songs are leading right now:",
];

const singleTrackWinning = [
  "And the winner is... ",
  "The one song to rule them all (for today): ",
  "Sorry kids, no participation trophies here... better luck next time. The winner is: ",
  "Wow, how could you guys let such a shitty sing win? ",
  "Guys, I'm proud of you. You let a great song win today! ",
  "Winner winner, chicken dinner: ",
  "Did you here about that new Asian Karma restaurant around here? They don't have a menu, you just get what you deserve. Also this track won today: ",
];

const multipleTracksWinning = [
  "There were multiple winners! You're a winner, you're a winner, everyone is a winner! ",
  "Wow, you guys are really indecisive! Multiple songs won today: ",
  "There are many Ways to Rome and you guys let many songs win today: ",
  "The more the merrier! Multiple songs won today: ",
  "Wow, more than one song? You guys are really blessing me today! The following songs won today: ",
];

function randomChoice(arr: Array<any>) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLeadingMessage(mostVotedSongs: string[]) {
  let leadingTidbit: string;
  let songInfo: string;
  if (mostVotedSongs.length === 1) {
    leadingTidbit = randomChoice(singleTrackLeading);
    songInfo = mostVotedSongs[0];
  } else {
    leadingTidbit = randomChoice(multipleTracksLeading);
    songInfo = mostVotedSongs.join(" and ");
  }
  return `${leadingTidbit} ${songInfo}`;
}

function getWinningMessage(mostVotedSongs: string[]) {
  const suffix =
    "Check out the EPIC Seleçion at https://open.spotify.com/playlist/4QXV4uZAyINdgUX1yPCtEJ?si=Rq8zaUjiSn-Qy0w5tWuOrw";
  let winTidbit: string;
  let songInfo: string;
  if (mostVotedSongs.length === 1) {
    winTidbit = randomChoice(singleTrackWinning);
    songInfo = mostVotedSongs[0];
  } else {
    winTidbit = randomChoice(multipleTracksWinning);
    songInfo = mostVotedSongs.join(" and ");
  }
  return `${winTidbit} ${songInfo} | ${suffix}`;
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
    if (today.getHours() === 8) {
      const suffix =
        "Add a song here: https://open.spotify.com/playlist/7mZIe5mLaO2UdVwPW0zTFN?si=wpOOST8bSX-Lj1OFiwg4xg. Vote on this premium website: vote.konstantin-dobler.de";
      postToSlack(randomChoice(votingReminders) + suffix);
    } else if (today.getHours() > 8 && today.getHours() < 18) {
      console.log("Most voted songs so far:", mostVotedSongs, "time:", today.toString(), today.getHours());
      if (today.getHours() === 17 || today.getHours() === 16) {
        postToSlack(getLeadingMessage(mostVotedSongs));
      }
    } else if (today.getHours() == 18) {
      await axios.post(`${httpScheme}://backend:${process.env.PORT}/add-song-to-selecion`, {
        secret: process.env.SECRET,
        trackURIs: mostVotedSongs,
      });
      postToSlack(getWinningMessage(mostVotedSongs));
    }
  });
}
