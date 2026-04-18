const express = require('express');
const router = express.Router();
const managementAiController = require('./management-ai.controller');
const authMiddleware = require('../gateway/middlewares/auth.middleware');
const authorize = require('../gateway/middlewares/role.middleware');

router.get(
  '/overview',
  authMiddleware,
  authorize(['admin', 'staff']),
  managementAiController.getManagementOverview
);

router.post(
  '/notion/export',
  authMiddleware,
  authorize(['admin', 'staff']),
  managementAiController.exportManagementOverviewToNotion
);

module.exports = router;
