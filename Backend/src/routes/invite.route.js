const router = require('express').Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const inviteController = require('../controller/invite.controller');

router.post(
    '/workspaces/:workspaceId/invites',
    authMiddleware,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('role').isIn(['admin', 'member']).withMessage('Role must be either admin or member')
    ],
    inviteController.sendInvite
);

router.get('/workspaces/:workspaceId/invites', authMiddleware, inviteController.getInvites);

router.put(
    '/workspaces/:workspaceId/invites/:userId',
    authMiddleware,
    [
        body('role').isIn(['admin', 'member']).withMessage('Role must be either admin or member')
    ],
    inviteController.updateInvite
);

router.delete('/workspaces/:workspaceId/invites/:userId', authMiddleware, inviteController.deleteInvite);

module.exports = router;
