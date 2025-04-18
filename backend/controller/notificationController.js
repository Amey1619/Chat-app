const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

// POST /api/notification
const createNotification = asyncHandler(async (req, res) => {
  try {
    const { id, chat, chatName, isGroupChat, latestMessage, users } = req.body;
    if (
      !id ||
      !chat ||
      !chatName ||
      !latestMessage ||
      !users ||
      users.length === 0
    ) {
      throw new Error("Missing required fields");
    }
    const notification = await Notification.create({
      _id: id,
      chat: chat,
      chatName: chatName,
      isGroupChat: isGroupChat,
      latestMessage: latestMessage,
      users: users,
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
});

// GET /api/notification/:userId
const getNotifications = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const objectId = new mongoose.Types.ObjectId(userId);
    const notifications = await Notification.find({"users._id": objectId});
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error});
  }
});

// DELETE /api/notification/:id
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res
      .status(500)
      .json({ message: "Failed to delete notification", error });
  }
});

module.exports = { createNotification, getNotifications, deleteNotification };
