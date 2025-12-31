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
                partner,
                requestId: reqObj._id,
                isSender: reqObj.sender._id.toString() === req.userId,
                isCompleted: reqObj.isCompleted
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

// Complete Session & Rate
router.post("/complete-session", auth, async (req, res) => {
    try {
        const { requestId, rating } = req.body;
        const request = await MessageRequest.findById(requestId);

        if (!request) return res.status(404).json({ message: "Request not found" });

        // Identify Payer (Current User) and Payee (The other person)
        const payerId = req.userId;
        let payeeId;

        if (request.sender.toString() === payerId) {
            payeeId = request.recipient;
        } else if (request.recipient.toString() === payerId) {
            payeeId = request.sender;
        } else {
            return res.status(403).json({ message: "You are not part of this session" });
        }

        const student = await SkillUser.findById(payerId);
        const teacher = await SkillUser.findById(payeeId);

        if (student.credits < 1) {
            return res.status(400).json({ message: "Insufficient credits" });
        }

        // Deduct credit from Payer
        student.credits -= 1;
        await student.save();

        // Add credit to Payee
        teacher.credits += 1;

        // Add Rating to Payee
        if (rating) {
            teacher.ratings.push({ star: rating, reviewer: payerId });
        }
        await teacher.save();

        // request.isCompleted = true; // Allow multiple sessions
        // await request.save();

        res.json({ message: "Session completed, credit transferred", credits: student.credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
