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
 * @route   GET api/posts/:post_id
 * @desc    Get post by id
 * @access  public
 */
router.get("/:post_id", async (req, res, next) => {
    try {
        return res.json(await Post.findById(req.params.post_id));
    } catch (err) {
        console.error(err.message);

        if (err.kind === "ObjectId") {
            return res.status(400).send("Post not found");
        }

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

        const removeIndex = post.likes
            .map((like) => like.user.toString())
            .indexOf(req.user.id);

        if (removeIndex !== -1) {
            post.likes.splice(removeIndex, 1);
        }

        await post.save();
        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route GET api/posts/comment/:post_id/:comment_id
 * @description Get a comment
 * @access private
 */
router.get("/comment/:post_id/:comment_id", async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.post_id);
        const cmt = post.comments.find(
            (cmt) => cmt.id.toString() === req.params.comment_id
        );
        return res.json(cmt);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

/**
 * @route POST api/posts/comment
 * @description Post a new comment to post
 * @access private
 */
router.post(
    "/comment/:post_id",
    [auth, [check("text", "Comment content is required").not().isEmpty()]],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const post = await Post.findById(req.params.post_id);

            if (!post) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Post not found" }] });
            }

            const user = await User.findById(req.user.id).select("-password");
            const newCmt = {
                user: req.user.id,
                name: user.name,
                avatar: user.avatar,
                text: req.body.text,
            };

            post.comments.unshift(newCmt);
            await post.save();

            return res.json(post);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send("Server error");
        }
    }
);

/**
 * @route DELETE api/posts/comment/:post_id/:comment_id
 * @description Delete a comment from post
 * @access private
 */
router.delete("/comment/:post_id/:comment_id", auth, async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (!post) {
            return res
                .status(400)
                .json({ errors: [{ msg: "Post not found" }] });
        }

        comment = post.comments.find(
            (cmt) => cmt.id.toString() === req.params.comment_id
        );

        if (!comment) {
            return res.status(400).json({ msg: "Comment not found" });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({
                msg: "Unauthorized! Permission denied.",
            });
        }

        const removeIndex = post.comments
            .map((cmt) => cmt.user.toString())
            .indexOf(req.user.id);

        if (removeIndex !== -1) {
            post.comments.splice(removeIndex, 1);
        }

        await post.save();
        return res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});

module.exports = router;
