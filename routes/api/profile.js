const express = require("express");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const auth = require("../../middleware/auth");

const router = express.Router();

/*
 * @route   GET api/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", auth, async (req, res, next) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).send({ msg: "There is no profile for this user" });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
