const express = require("express");
const { getProfile, updateProfile, changePassword } = require("../controllers/profileController");

const router = express.Router();

router.get("/:id", getProfile);
router.put("/:id", updateProfile);
router.put("/:id/password", changePassword);

module.exports = router;