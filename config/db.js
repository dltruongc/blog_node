const mongoose = require("mongoose");
const config = require("config");

const db = config.get("mongoURI");

const connectDB = async function () {
  try {
    await mongoose.connect(db, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log("MongoDB connected 👌");
  } catch (err) {
    console.error("DB connection failure! 💥\nError: " + err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
