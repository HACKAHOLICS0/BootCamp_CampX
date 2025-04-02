const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    image: {
        type: String
    },
    duration: {
        type: Number, // in hours
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    statistics: {
        totalStudents: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 }
    },
    completionCount: { type: Number, default: 0 }, // NEW: Track module engagement
    mostPopularCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // NEW: Highlight high-demand modules
    mostSkippedLecture: { type: String, default: "" }, // NEW: Lecture with most skips
    mostRewatchedLecture: { type: String, default: "" }, // NEW: Lecture students rewatch the most
    lectureStats: [
        {
            lectureTitle: String,
            skips: { type: Number, default: 0 }, // NEW: Number of times skipped
            rewatches: { type: Number, default: 0 } // NEW: Number of times rewatched
        }
    ]
});
moduleSchema.methods.updateLectureStats = function () {
    if (this.lectureStats.length > 0) {
        const mostSkipped = this.lectureStats.reduce((prev, current) =>
            prev.skips > current.skips ? prev : current
        );
        const mostRewatched = this.lectureStats.reduce((prev, current) =>
            prev.rewatches > current.rewatches ? prev : current
        );

        this.mostSkippedLecture = mostSkipped.lectureTitle;
        this.mostRewatchedLecture = mostRewatched.lectureTitle;
        
    }};

module.exports = mongoose.model('Module', moduleSchema);
