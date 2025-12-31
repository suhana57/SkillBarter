import express from "express";
import Message from "../Message.js";
import MessageRequest from "../MessageRequest.js";
import SkillUser from "../SkillUser.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Send a connection request
router.post("/request", auth, async (req, res) => {
    try {
        const { recipientId, note, scheduledTime } = req.body;
        const senderId = req.userId;

        const existingRequest = await MessageRequest.findOne({
            sender: senderId,
            recipient: recipientId
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Request already sent" });
        }

        const newRequest = await MessageRequest.create({
            sender: senderId,
            recipient: recipientId,
            note,
            scheduledTime,
            status: 'pending'
        });

        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get pending requests (received)
router.get("/requests", auth, async (req, res) => {
    try {
        const requests = await MessageRequest.find({
            recipient: req.userId,
            status: 'pending'
        }).populate("sender", "username email"); // Adjust fields based on User schema
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Respond to request
router.post("/request/:id/:action", auth, async (req, res) => {
    try {
        const { id, action } = req.params; // action: accept or reject
        const request = await MessageRequest.findById(id);

        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.recipient.toString() !== req.userId) return res.status(403).json({ message: "Unauthorized" });

        if (action === "accept") {
            request.status = "accepted";
        } else if (action === "reject") {
            request.status = "rejected";
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        await request.save();
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get accepted conversations
router.get("/conversations", auth, async (req, res) => {
    try {
        // Find all accepted requests where user is sender or recipient
        const requests = await MessageRequest.find({
            $or: [{ sender: req.userId }, { recipient: req.userId }],
            status: 'accepted'
        }).populate("sender recipient", "username email");

        // Format into a list of conversation partners
        const conversations = requests.map(reqObj => {
            const partner = reqObj.sender._id.toString() === req.userId
                ? reqObj.recipient
                : reqObj.sender;
            return {
                requestId: reqObj._id,
                partner
            };
        });

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get chat history with specific user
router.get("/:userId", auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        // Verify connection exists
        const connection = await MessageRequest.findOne({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ],
            status: 'accepted'
        });

        if (!connection) return res.status(403).json({ message: "No active connection" });

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
});

export default router;
