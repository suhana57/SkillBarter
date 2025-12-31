import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: String,
    skills: [{
        name: String,
        type: { type: String, enum: ['teach', 'learn'] }, // 'teach' or 'learn'
        level: { type: Number, default: 1 } // 1-5
    }],
    embedding: [Number], // Flattened embedding for simplicity or weighted average
    credits: { type: Number, default: 5 },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    ratings: [{
        star: Number,
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillUser' }
    }]
});

export default mongoose.model("SkillUser", UserSchema);
