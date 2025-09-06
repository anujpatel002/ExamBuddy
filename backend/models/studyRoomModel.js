import mongoose from 'mongoose';

const studyRoomSchema = mongoose.Schema({
    name: { type: String, required: true },
    roomCode: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    members: [{
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        socketId: String,
        score: { type: Number, default: 0 }
    }],
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'finished'],
        default: 'waiting'
    },
    currentQuestion: { type: Number, default: 0 },
}, { timestamps: true });

const StudyRoom = mongoose.model('StudyRoom', studyRoomSchema);
export default StudyRoom;