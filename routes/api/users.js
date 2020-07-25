const express = require("express");
const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const gravatar = require("gravatar");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../../config/default.json");

const router = express.Router();

/*
 * @route   POST api/users
 * @desc    Test route
 * @access  Public
 */
router.post(
  "/",
  [
    check("name", "Name is required!").not().isEmpty(),
    check("email", "Please include email!").isEmail(),
    check("password", "Please fill password at least 6 characters!").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password } = req.body;

    try {
      // See if user is exists
      let user = await User.findOne({ email });

      if (user) {
        res.status(400).json({ errors: [{ msg: "User already exists" }] });
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        d: "mm",
        s: "200",
        r: "pg",
      });

      // Encrypt password
      const salt = bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonWebToken
      const payload = {
        id: user.id,
      };

      jwt.sign(
        payload,
        config.jwtSecret,
        {
          expiresIn: 3600,
        },
        (err, token) => {
          if (err) {
            throw err;
          }

          res.status(400).json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
