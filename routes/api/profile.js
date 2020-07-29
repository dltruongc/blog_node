const express = require("express");
const { check, validationResult } = require("express-validator");
const request = require("request");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const config = require("../../config/default.json");

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
            return res
                .status(400)
                .send({ msg: "There is no profile for this user" });
        }

        return res.status(200).json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route POST api/profile
 * @desc Create new profile
 * @access Private
 */
router.post(
    "/",
    [
        auth,
        [
            check("status", "Status is required").not().isEmpty(),
            check("skills", "Skills is required").not().isEmpty(),
        ],
    ],
    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
        }

        const {
            user,
            handle,
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubusername,
            experience,
            education,
            social,
            date,
            youtube,
            twitter,
            facebook,
            linkedin,
            instagram,
        } = req.body;

        const profileFields = {};
        profileFields.user = req.user.id;
        // if (handle) profileFields.handle = handle;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills)
            profileFields.skills = skills
                .split(",")
                .map((skill) => skill.trim());
        // if (experience) profileFields.experience = experience;
        // if (education) profileFields.education = education;
        // if (social) profileFields.social = social;
        // if (date) profileFields.date = date;
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({ user: req.user.id });

            if (profile) {
                // Update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { set: { profileFields } },
                    { new: true }
                );

                res.status(200).json(profile);
            }

            // Create
            profile = new Profile(profileFields);

            await profile.save();
            res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server error");
        }
    }
);

/**
 * @route GET api/profile
 * @description Get all profiles
 * @access public
 */
router.get("/", async (req, res, next) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar",
        ]);

        return res.status(200).json(profiles);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route GET api/profile/users/:user_id
 * @description Get all profiles
 * @access public
 */
router.get("/users/:user_id", async (req, res, next) => {
    const user = req.params.user_id;

    if (!user) {
        return res
            .status(400)
            .json({ errors: [{ msg: "No profile found for this user." }] });
    }

    try {
        const profile = await Profile.findOne({ user }).populate("user", [
            "name",
            "avatar",
        ]);
        return res.json(profile);
    } catch (err) {
        console.error(err.message);

        if (err.kind == "ObjectId") {
            return res
                .status(400)
                .json({ errors: [{ msg: "No profile found for this user." }] });
        }

        return res.status(500).send("Server error");
    }
});

/**
 * @route DELETE api/profile
 * @description Delete user & profile
 * @access private
 */
router.delete("/profile", async (req, res, next) => {
    try {
        await Profile.findOneAndDelete({ user: req.user.id });
        await User.findOneAndDelete({ _id: req.user.id });

        return res.status(200).json({ msg: "User deleted" });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route PUT api/profile/experience
 * @description Add experience
 * @access private
 */
router.put("/experience", [
    auth,
    [
        check("title", "Title is required").not().isEmpty(),
        check("company", "Company is required").not().isEmpty(),
        check("from", "From date is required").not().isEmpty(),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        } = req.body;

        let newExp = {
            title,
            company,
            from,
            location,
            to,
            current,
            description,
        };
        try {
            let profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);

            await profile.save();
            return res.status(200).json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send("Server error!");
        }
    },
]);

/**
 * @route DELETE api/profile/experience/exp_id
 * @description Delete an experience by {number} index
 * @access private
 */
router.delete("/experience/:exp_id", auth, async (req, res, next) => {
    try {
        let profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experience
            .map((exp) => exp.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route PUT api/profile/education
 * @description Put new education
 * @access private
 */
router.put(
    "/education",
    [
        auth,
        [
            check("school", "School is required").not().isEmpty(),
            check("degree", "Degree is required").not().isEmpty(),
            check("from", "From date is required").not().isEmpty(),
        ],
    ],
    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        };

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);

            await profile.save();
            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send("Server error");
        }
    }
);

/**
 * @route DELETE api/profile/education/edu_id
 * @description Delete an education by {number} index
 * @access private
 */
router.delete("/education/:edu_id", auth, async (req, res, next) => {
    try {
        let profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education
            .map((edu) => edu.id)
            .indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route api/profile/github/:github_username
 * @description Get Github profile by Github username
 * @access public
 */
router.get("/github/:github_username", async (req, res, next) => {
    try {
        const options = {
            uri:
                `https://api.github.com/users/${req.params.github_username}` +
                `/repos?per_page=5&sort=created:asc` +
                `&client_id=${config.githubClientId}` +
                `&client_secret=${config.githubClientSecret}`,
            method: "GET",
            headers: { "user-agent": "node.js" },
        };

        request(options.uri, options, (err, response, body) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Server error");
            }

            if (response.statusCode !== 200) {
                return res.status(400).json({ msg: "No github profile found" });
            }

            return res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});
module.exports = router;
