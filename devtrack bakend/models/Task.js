const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'In Review', 'Completed'], 
    default: 'To Do' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  type: { 
    type: String, 
    enum: ['Task', 'Bug', 'Feature', 'Improvement'], 
    default: 'Task' 
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date }, // <-- Yeh wali field yahan add kar di hai
  dueDate: { type: Date },
  attachments: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      fileName: { type: String }
    }
  ]
}, { timestamps:true }); // (timestamps: true)

module.exports = mongoose.model('Task', taskSchema);