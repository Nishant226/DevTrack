const Task = require('../models/Task');

// Get project analytics metrics
exports.getAnalytics = async (req, res, next) => {
  try {
    console.log("=== ANALYTICS REQUEST HIT ===");
    console.log("--> Logged-in User:", req.user); // Yahan pata chalega ki req.user mein role kya aa raha hai

    const { projectId } = req.query; 
    let filter = {};

    if (projectId && projectId !== 'null' && projectId !== 'undefined' && projectId !== '') {
      filter.project = projectId;
    }

    const userRole = req.user?.role ? req.user.role.toLowerCase().trim() : '';
    const isAdminOrPM = userRole === 'admin' || userRole === 'project manager';

    console.log("--> User Role:", userRole, "| Is Admin or PM?:", isAdminOrPM);

    if (!isAdminOrPM && req.user) {
      filter.assignedTo = req.user.id;
    }

    console.log("--> Final MongoDB Filter:", filter);

    const totalTasks = await Task.countDocuments(filter);
    
    const todoCount = await Task.countDocuments({ ...filter, status: 'To Do' });
    const inProgressCount = await Task.countDocuments({ ...filter, status: 'In Progress' });
    const inReviewCount = await Task.countDocuments({ ...filter, status: 'In Review' });
    const completedCount = await Task.countDocuments({ ...filter, status: 'Completed' });

    const highPriorityCount = await Task.countDocuments({ ...filter, priority: 'High' });
    const mediumPriorityCount = await Task.countDocuments({ ...filter, priority: 'Medium' });
    const lowPriorityCount = await Task.countDocuments({ ...filter, priority: 'Low' });

    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        statusBreakdown: {
          toDo: todoCount,
          inProgress: inProgressCount,
          inReview: inReviewCount,
          completed: completedCount,
        },
        priorityBreakdown: {
          high: highPriorityCount,
          medium: mediumPriorityCount,
          low: lowPriorityCount,
        },
        completionRate,
      },
    });
  } catch (error) {
    console.error("--> Analytics Error:", error);
    next(error);
  }
};