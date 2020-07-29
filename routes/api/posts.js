const express = require("express");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");
const Post = require("../../models/Post");
const User = require("../../models/User");
const mongoose = require("mongoose");

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

/**
 * @route PUT api/posts/like/:post_id
 * @description Like one post
 * @access private
 */
router.put("/like/:post_id", auth, async (req, res, next) => {
    try {
        let post = await Post.findOne({
            user: req.user.id,
            _id: req.params.post_id,
        });

        if (
            post.likes.filter((like) => like.user.toString() === req.user.id)
                .length > 0
        ) {
            return res
                .status(400)
                .json({ errors: [{ msg: "You already liked this post!" }] });
        }

        post.likes.unshift({ user: req.user.id });
        await post.save();
        return res.json(post);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route PUT api/posts/unlike/:post_id
 * @description Unlike a post
 * @access private
 */
router.put("/unlike/:post_id", auth, async (req, res, next) => {
    try {
        let post = await Post.findOne({
            _id: req.params.post_id,
            user: req.user.id,
        });

        let likeCount = post.likes.filter(
            (like) => like.user.toString() === req.user.id
        ).length;

        if (likeCount <= 0) {
            return res
                .status(400)
                .json({ errors: [{ msg: "You don't like this post" }] });
        }

        post.likes.splice(
            post.likes.find((like) => like.user.toString() === req.user.id),
            1
        );

        await post.save();
        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

module.exports = router;
