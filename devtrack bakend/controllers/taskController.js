const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { logActivity } = require('./activityController');
const sendEmail = require('../utils/sendEmail');
const { GoogleGenAI } = require('@google/genai');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// 1. Get Tasks (Supports role-based filtering: Developer/Tester see only assigned tasks, Admin/PM see all + Comment Count)
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, sortBy, page = 1, limit = 100, project } = req.query;

    let query = {};
    
    const targetProject = project || (req.params && req.params.projectId);
    if (targetProject) {
      query.project = targetProject;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-Based Filtering Check:
    // Agar user logged-in hai aur uska role Admin ya Project Manager nahi hai, 
    // toh use sirf wahi tasks dikhenge jo uske assignedTo field mein match karte hain.
    if (req.user && req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      query.assignedTo = req.user.id;
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'dueDate') sortOptions = { dueDate: 1 };
    if (sortBy === 'priority') sortOptions = { priority: -1 };
    if (sortBy === 'oldest') sortOptions = { createdAt: 1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort(sortOptions)
      .skip(startIndex)
      .limit(limitNum)
      .lean(); // .lean() use kiya hai taaki plain JavaScript objects mil jayein aur commentCount safely attach ho sake

    // Attach real-time comment count to each task object safely
    const tasksWithCommentCount = await Promise.all(
      tasks.map(async (task) => {
        const count = await Comment.countDocuments({ task: task._id });
        return {
          ...task,
          commentCount: count
        };
      })
    );

    res.json({
      success: true,
      count: tasksWithCommentCount.length,
      pagination: {
        totalTasks: total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      data: tasksWithCommentCount
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Task
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('project', 'title');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// 3. Create Task
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, type, project, assignedTo, assignee, dueDate, startDate } = req.body;

    let finalAssignedTo = assignedTo || assignee;

    console.log("=== CREATE TASK BODY ===", req.body);

    if (finalAssignedTo) {
      if (!mongoose.Types.ObjectId.isValid(finalAssignedTo)) {
        const targetUser = await User.findOne({ 
          $or: [{ email: finalAssignedTo }, { name: finalAssignedTo }] 
        });
        if (targetUser) {
          finalAssignedTo = targetUser._id;
        } else {
          return res.status(400).json({ success: false, message: `Assigned user '${finalAssignedTo}' not found in database.` });
        }
      }
    }

    console.log("=== FINAL RESOLVED ASSIGNED TO ID ===", finalAssignedTo);

    const newTask = new Task({
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      type,
      project: project || undefined,
      assignedTo: finalAssignedTo || undefined,
      createdBy: req.user._id,
      dueDate: dueDate || undefined,
      startDate: startDate || undefined
    });

    await newTask.save();

    const populatedTask = await Task.findById(newTask._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    await logActivity(newTask._id, req.user._id, `Created task: "${title}"`);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskCreated', populatedTask || newTask);
    }

    if (finalAssignedTo) {
      try {
        const assignedUser = await User.findById(finalAssignedTo);
        console.log("--> Database se mila developer user:", assignedUser);
        
        if (assignedUser && assignedUser.email) {
          console.log(`--> Sending email to developer: ${assignedUser.email}`);
          await sendEmail({
            email: assignedUser.email,
            subject: `New Task Assigned: ${title}`,
            message: `Hi ${assignedUser.name},\n\nYou have been assigned a new task: "${title}".\nPriority: ${priority || 'Medium'}\n\nCheck your DevTrack dashboard for details.`
          });
          console.log("--> Email successfully sent to developer!");
        } else {
          console.log("--> User found, but email field is missing in database!");
        }
      } catch (emailErr) {
        console.error('--> Email notification error:', emailErr.message);
      }
    } else {
      console.log("--> No assignedTo/assignee ID provided in request body.");
    }

    res.status(201).json({ success: true, data: populatedTask || newTask });
  } catch (error) {
    next(error);
  }
};

// 4. Update Task Status
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await logActivity(
      updatedTask._id,
      req.user._id,
      `Changed status to '${status}'`
    );

    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskUpdated', updatedTask);
    }

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

// 5. Update Full Task Details
exports.updateTask = async (req, res, next) => {
  try {
    let updateData = { ...req.body };

    if (updateData.assignedTo && !mongoose.Types.ObjectId.isValid(updateData.assignedTo)) {
      const targetUser = await User.findOne({ 
        $or: [{ email: updateData.assignedTo }, { name: updateData.assignedTo }] 
      });
      if (targetUser) {
        updateData.assignedTo = targetUser._id;
      } else {
        return res.status(400).json({ success: false, message: `Assigned user '${updateData.assignedTo}' not found.` });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await logActivity(
      updatedTask._id,
      req.user._id,
      `Updated task details for "${updatedTask.title}"`
    );

    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskUpdated', updatedTask);
    }

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

// 6. Delete Task
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await logActivity(
      task._id,
      req.user._id,
      `Deleted task "${task.title}"`
    );

    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskDeleted', req.params.id);
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 7. Generate AI Subtasks (Pillar 11)
exports.generateAISubtasks = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required for AI generation.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Break down the following development task into 4 to 5 clear, actionable subtasks. Return the response strictly as a JSON array of strings: "${prompt}"`,
    });

    let subtasks = [];
    try {
      const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      subtasks = JSON.parse(text);
    } catch (parseErr) {
      subtasks = [response.text];
    }

    res.status(200).json({
      success: true,
      data: subtasks
    });
  } catch (error) {
    next(error);
  }
};

// 8. Upload Task Attachment (Pillar 2)
exports.uploadAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const attachment = {
      url: req.file.path,
      public_id: req.file.filename,
      fileName: req.file.originalname
    };

    task.attachments.push(attachment);
    await task.save();

    await logActivity(
      task._id,
      req.user._id,
      `Attached file: "${req.file.originalname}"`
    );

    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskUpdated', task);
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// 9. Delete Task Attachment (Pillar 2)
exports.deleteAttachment = async (req, res, next) => {
  try {
    const { taskId, attachmentId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    await cloudinary.uploader.destroy(attachment.public_id);

    task.attachments.pull(attachmentId);
    await task.save();

    await logActivity(
      task._id,
      req.user._id,
      `Removed attachment: "${attachment.fileName}"`
    );

    const io = req.app.get('socketio');
    if (io) {
      io.emit('taskUpdated', task);
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};