const express = require("express");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");
const Post = require("../../models/Post");
const User = require("../../models/User");

const router = express.Router();

/**
 * @route   POST api/posts
 * @description create new post
 * @access Private
 */
router.post(
    "/",
    [auth, [check("text", "Text is required").not().isEmpty()]],
    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select("-password");
            let newPost = new Post({
                text: req.body.text,
                user: req.user.id,
                name: user.name,
                avatar: user.avatar,
            });

            const post = await newPost.save();
            return res.json(post);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send("Server error");
        }
    }
);

/**
 * @route   GET api/posts
 * @desc    Get all posts for current user
 * @access  private
 */
router.get("/", auth, async (req, res) => {
    try {
        let posts = await Post.find({ user: req.user.id });

        return res.json(posts);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route DELETE api/posts
 * @description Delete a post
 * @access private
 */
router.delete("/:post_id", auth, async (req, res, next) => {
    try {
        await Post.deleteOne({ user: req.user.id, _id: req.params.post_id });
        return res.json({ msg: "Post deleted" });
    } catch (err) {
        console.error(err.message);

        if (err.kind == "ObjectId") {
            return res
                .status(400)
                .json({ errors: [{ msg: "Post not found!" }] });
        }

        return res.status(500).send("Server error");
    }
});

module.exports = router;
