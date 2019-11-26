require("dotenv").config();

async function logRefreshToken(code) {
  const body = {
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI,
  };
  return axios
    .post(`${spotifyAccountsBaseUri}/api/token`, qs.stringify(body), {
      headers: {
        Authorization: `Basic ${new Buffer(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString(
          "base64",
        )}`,
      },
    })
    .catch(e => console.log(e))
    .then(response => {
      console.log(response.data);
    });
}

await logRefreshToken();
