const router = require('express').Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const dessesionController = require('../controller/dessesion.controller');
const discussionModel = require('../model/dessesion.model');

async function attachWorkspaceFromMessage(req, res, next) {
    try {
        const message = await discussionModel.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        req.params.workspaceId = message.workspace.toString();
        return next();
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

router.delete('/messages/:messageId', authMiddleware, attachWorkspaceFromMessage, dessesionController.deleteMessage);
router.post('/messages/:messageId/pin', authMiddleware, attachWorkspaceFromMessage, dessesionController.pinMessage);
router.post('/messages/:messageId/unpin', authMiddleware, attachWorkspaceFromMessage, dessesionController.unpinMessage);

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
