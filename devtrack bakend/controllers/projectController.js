const Project = require('../models/Project');
const Task = require('../models/Task'); // Task model import kiya hai taaki project delete hone par uske tasks bhi clean-up ho sakein

// Create new project
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, members, deadline } = req.body;

    const project = new Project({
      title,
      description,
      owner: req.user._id,
      members: members || [],
      deadline
    });

    await project.save();
    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error); // Pillar 22 Centralized Error Handler
  }
};

// Get projects for logged-in user
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    res.status(200).json({ success: true, projects });
  } catch (error) {
    next(error); // Pillar 22 Centralized Error Handler
  }
};

// Add member to project
exports.addMember = async (req, res, next) => {
  try {
    const { memberId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.members.includes(memberId)) {
      project.members.push(memberId);
      await project.save();
    }

    res.status(200).json({ success: true, message: 'Member added successfully', project });
  } catch (error) {
    next(error); // Pillar 22 Centralized Error Handler
  }
};

// Delete project and its associated tasks
exports.deleteProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete all tasks associated with this project to prevent orphaned data
    await Task.deleteMany({ project: projectId });

    // Delete the project itself
    await project.deleteOne();

    res.status(200).json({ success: true, message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    next(error); // Pillar 22 Centralized Error Handler
  }
};