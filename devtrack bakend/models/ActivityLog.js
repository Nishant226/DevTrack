const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);