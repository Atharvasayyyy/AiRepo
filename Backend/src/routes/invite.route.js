const router = require('express').Router()
const authMiddleware = require('../middleware/auth.middleware')
const inviteController = require('../controller/invite.controller')
const {validaator} = require('express-validator')

//  to send the invite to the user to join the workspace
router.post('/workspaces/:workspaceId/invites',
    [
        check('email').isEmail().withMessage('Valid email is required'),
        check('role').isIn(['admin', 'member']).withMessage('Role must be either admin or member')
    ], authMiddleware, inviteController.sendInvite)

// to get the all invite and join the workspace
router.get('/workspaces/:workspaceId/invites', authMiddleware, inviteController.getInvites)

// to update the role of the invie
router.put('/workspaces/:workspaceId/invites/:inviteId',
    [
        check('role').isIn(['admin', 'member']).withMessage('Role must be either admin or member')
    ], authMiddleware, inviteController.updateInvite)

// to delete the invite
router.delete('/workspaces/:workspaceId/invites/:inviteId', authMiddleware, inviteController.deleteInvite)

module.exports = router