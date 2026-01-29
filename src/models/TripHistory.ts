import mongoose from 'mongoose';

const TripHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    origin: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    plan: {
        type: Object, // Stores the full TripPlan object
        required: true,
    },
});

export default mongoose.models.TripHistory || mongoose.model('TripHistory', TripHistorySchema);
