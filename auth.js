const LocalStrategy = require("passport-local");
const passport = require("passport");
const { ObjectID } = require("mongodb");
const bcrypt = require("bcrypt");
const GitHubStrategy = require("passport-github").Strategy;
const User = require("./models/user.js");
require("dotenv").config();

module.exports = function (app) {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    let foundUser = await User.findOne({ _id: new ObjectID(id) }).exec();
    done(null, foundUser);
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      let foundUser = await User.findOne({ username }).exec();
      console.log(`User ${username} attempted to log in.`);
      try {
        if (!foundUser) {
          console.log("此帳號未註冊");
          return done(null, false);
        }
        let result = bcrypt.compareSync(password, foundUser.password);
        if (!result) {
          console.log("密碼錯誤");
          return done(null, false);
        }
        return done(null, foundUser);
      } catch (e) {
        return done(e);
      }
    })
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://8080-freecodecam-boilerplate-p7j205zruyt.ws-us110.gitpod.io/auth/github/callback",
      },
      async function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        //Database logic here with callback containing your user object
        let foundUser = await User.findOne({ githubID: profile.id }).exec();
        if (foundUser) {
          console.log("使用者已註冊過");
          done(null, foundUser);
        } else {
          console.log("新用戶，需註冊");
          let newUser = new User({
            name: profile.username,
            githubID: profile.id,
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : "No public email",
          });
          let savedUser = await newUser.save();
          console.log("成功創建新用戶");
          done(null, savedUser);
        }
      }
    )
  );
};
