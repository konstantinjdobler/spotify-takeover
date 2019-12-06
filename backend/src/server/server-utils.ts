import axios from "axios";
import qs from "querystring";

export function makeID(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export async function getRefreshToken(authorizationCode: string, spotifyAuthCallback: string) {
  const body = {
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: spotifyAuthCallback,
  };
  return axios
    .post(`https://accounts.spotify.com/api/token`, qs.stringify(body), {
      headers: {
        Authorization: `Basic ${new Buffer(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString(
          "base64",
        )}`,
      },
    })
    .then(response => response.data)
    .catch(e => console.log(e));
}
