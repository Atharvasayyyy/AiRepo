const router = require('express').Router();
const { authMuddleware } = require('../middlewares/auth.middleware');
const dessesionController = require('../controllers/dessesion.controller');
const { validateDessesion } = require('../middlewares/validation.middleware');
// send the massages routees
router.post('/:workspaceId/messages',[
    check('content').notEmpty().withMessage('Content is required'),
    check('author').notEmpty().withMessage('Author is required'),
    check('type').isIn(['message', 'ai', 'decision', 'system']).withMessage('Type must be one of message, ai, decision, system'),
    check('mentions').isArray().withMessage('Mentions must be an array of user IDs'),
    check('replyTo').optional().isMongoId().withMessage('ReplyTo must be a valid message ID'),
    check('isPinned').optional().isBoolean().withMessage('isPinned must be a boolean'),
    check('pinnedBy').optional().isMongoId().withMessage('pinnedBy must be a valid user ID'),
    check('pinnedAt').optional().isISO8601().withMessage('pinnedAt must be a valid date')
],
    authMuddleware, dessesionController.sendMessage);

router.get('/:workspaceId/messages', authMuddleware, dessesionController.getMessages);
router.delete('/:workspaceId/messages', authMuddleware, dessesionController.deleteMessage);

// pin the messages routees
router.post('/messages/:messageId/pin', authMuddleware, dessesionController.pinMessage);
router.post('/messages/:messageId/unpin', authMuddleware, dessesionController.unpinMessage);

router.get('/:workspaceId/pinned', authMuddleware, dessesionController.getPinnedMessages);
router.get('/:workspaceId/decisions', authMuddleware, dessesionController.getDecisions);

module.exports = router;