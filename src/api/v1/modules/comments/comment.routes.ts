import { Router }        from "express"
import authMiddleware    from "@middleware/auth.middleware"
import CommentController from "@modules/comments/comment.controller"
import CommentService    from "./comment.service"

const router            = Router()
const commentService    = new CommentService()
const commentController = new CommentController( commentService )

/**
 * @desc get comments
 * @route GET /posts/:postId/comments
 * @access Private
 */
router.get( '/:postId/comments/', commentController.getMany )

/**
 * @desc create comment
 * @route POST /posts/:postId/comments
 * @access Private
 */
router.post( '/:postId/comments/', authMiddleware, commentController.create )

/**
 * @desc delete comment
 * @route DELETE /posts/:postId/comments/:commentId
 * @access Private
 */
router.delete( '/:postId/comments/:commentId', authMiddleware, commentController.delete )


/**
 * @desc save comment like
 * @route POST /posts/:postId/comments/:commentId/like
 * @access Private
 */
router.post( '/:postId/comments/:commentId/like', authMiddleware, commentController.like )

/**
 * @desc comment unlike
 * @route POST /posts/:postId/comments/:commentId/unlike
 * @access Private
 */
router.post( '/:postId/comments/:commentId/unlike', authMiddleware, commentController.unlike )

export default router