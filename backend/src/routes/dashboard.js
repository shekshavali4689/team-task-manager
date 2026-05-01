const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET DASHBOARD STATS
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Get all projects this user belongs to
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true, role: true }
    });
    const projectIds = memberships.map(m => m.projectId);

    // Get all tasks in those projects
    const allTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignedTo: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    });

    // Count tasks by status
    const byStatus = {
      TODO: allTasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
      DONE: allTasks.filter(t => t.status === 'DONE').length
    };

    // Find overdue tasks
    const overdueTasks = allTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    // Count tasks per user
    const tasksByUser = {};
    allTasks.forEach(t => {
      if (t.assignedTo) {
        const key = t.assignedTo.id;
        if (!tasksByUser[key])
          tasksByUser[key] = { name: t.assignedTo.name, count: 0 };
        tasksByUser[key].count++;
      }
    });

    // My tasks specifically
    const myTasks = allTasks.filter(t => t.assignedToId === userId);

    res.json({
      totalProjects: projectIds.length,
      totalTasks: allTasks.length,
      byStatus,
      overdueTasks: overdueTasks.length,
      overdueTasksList: overdueTasks.slice(0, 5),
      tasksByUser: Object.values(tasksByUser),
      myTasks: {
        total: myTasks.length,
        TODO: myTasks.filter(t => t.status === 'TODO').length,
        IN_PROGRESS: myTasks.filter(t => t.status === 'IN_PROGRESS').length,
        DONE: myTasks.filter(t => t.status === 'DONE').length
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;