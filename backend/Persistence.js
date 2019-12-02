const persistence = {
  userWhitelist: [],
  votingTokens: {},
  votes: {},
  userHasStaleToken: function(user) {
    let foundToken = null;
    if (!this.votingTokens) return false;
    for (const token of Object.keys(this.votingTokens)) {
      if (this.votingTokens[token].user.id === user) foundToken = token;
    }
    return foundToken;
  },
};

export default persistence;
