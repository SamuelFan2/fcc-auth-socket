const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require("./models/user.js");
const { render } = require("pug");

module.exports = function (app) {
  app.route("/").get((req, res) => {
    res.render("index", {
      title: "Connected to DataBase",
      message: "Please login",
      showLogin: true,
      showSocialAuth: true,
    });
  });

  app.get("/profile", ensureAuthenticated, (req, res) => {
    console.log(req.user);
    return res.render("profile", {
      username: req.user.username,
      name: req.user.name,
    });
  });

  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.get("/register", (req, res) => {
    return res.render("index", { showRegistration: true });
  });

  app.get("/auth/github", passport.authenticate("github"));

  app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/" }),
    (req, res) => {
      req.session.user_id = req.user.githubID;
      res.redirect("/chat");
    }
  );

  app.get("/chat", ensureAuthenticated, (req, res) => {
    return res.render("chat", { user: req.user });
  });

  app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/profile");
    }
  );

  app.post(
    "/register",
    async (req, res, next) => {
      let { username, password } = req.body;
      try {
        let foundUser = await User.findOne({
          username: username,
        }).exec();
        if (foundUser) {
          alert("此 username 已註冊過");
          res.redirect("/");
        } else {
          let hash = await bcrypt.hash(password, 10);
          let newUser = new User({ username, password: hash });
          let savedUser = await newUser.save();
          console.log(savedUser);
          next();
        }
      } catch (e) {
        return res.status(500).send(e.message);
      }
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/profile");
    }
  );

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
};

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
