const router = require('express').Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const dessesionController = require('../controller/dessesion.controller');

router.post(
    '/:workspaceId/messages',
    authMiddleware,
    [
        body('content').notEmpty().withMessage('Content is required'),
        body('type').optional().isIn(['message', 'ai', 'decision', 'system']).withMessage('Type must be one of message, ai, decision, system'),
        body('mentions').optional().isArray().withMessage('Mentions must be an array of user IDs'),
        body('replyTo').optional().isMongoId().withMessage('ReplyTo must be a valid message ID'),
        body('isPinned').optional().isBoolean().withMessage('isPinned must be a boolean')
    ],
    dessesionController.sendMessage
);

router.get('/:workspaceId/messages', authMiddleware, dessesionController.getMessages);
router.delete('/:workspaceId/messages/:messageId', authMiddleware, dessesionController.deleteMessage);

router.post('/:workspaceId/messages/:messageId/pin', authMiddleware, dessesionController.pinMessage);
router.post('/:workspaceId/messages/:messageId/unpin', authMiddleware, dessesionController.unpinMessage);

router.get('/:workspaceId/pinned', authMiddleware, dessesionController.getPinnedMessages);
router.get('/:workspaceId/decisions', authMiddleware, dessesionController.getDecisions);

module.exports = router;
