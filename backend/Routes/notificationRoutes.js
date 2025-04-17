const express = require("express");
const { createNotification, getNotifications, deleteNotification } = require("../controller/notificationController");

const router = express.Router();

router.route("/").post(createNotification);
router.route("/:userId").get(getNotifications);
router.route("/:id").delete(deleteNotification);

module.exports = router;
