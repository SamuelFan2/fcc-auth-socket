const mongoose = require("mongoose");
const { Schema } = require("mongoose");

let userSchema = new Schema({
  username: String,
  password: String,
  githubID: String,
  email: String,
  name: String,
});

module.exports = mongoose.model("User", userSchema);
