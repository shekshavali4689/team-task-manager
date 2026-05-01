const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const getMembership = async (userId, projectId) =>
  prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } }
  });

// GET ALL TASKS IN A PROJECT
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: 'projectId required' });

    const membership = await getMembership(req.user.id, projectId);
    if (!membership) return res.status(403).json({ message: 'Not a member' });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) { next(err); }
});

// CREATE TASK (admin only)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignedToId, projectId } = req.body;
    if (!title || !projectId)
      return res.status(400).json({ message: 'Title and projectId required' });

    const membership = await getMembership(req.user.id, projectId);
    if (!membership) return res.status(403).json({ message: 'Not a member' });
    if (membership.role !== 'ADMIN')
      return res.status(403).json({ message: 'Only admins can create tasks' });

    if (assignedToId) {
      const assigneeMembership = await getMembership(assignedToId, projectId);
      if (!assigneeMembership)
        return res.status(400).json({ message: 'Assignee is not a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId,
        projectId,
        createdById: req.user.id
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// UPDATE TASK
router.put('/:taskId', authenticate, async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const membership = await getMembership(req.user.id, task.projectId);
    if (!membership) return res.status(403).json({ message: 'Not a member' });

    const isAdmin = membership.role === 'ADMIN';
    const isAssignee = task.assignedToId === req.user.id;

    if (!isAdmin && !isAssignee)
      return res.status(403).json({ message: 'Not authorized to update this task' });

    const { title, description, priority, dueDate, assignedToId, status } = req.body;

    // Members can only update status, Admins can update everything
    const updateData = isAdmin
      ? { title, description, priority, dueDate: dueDate ? new Date(dueDate) : undefined, assignedToId, status }
      : { status };

    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE TASK (admin only)
router.delete('/:taskId', authenticate, async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const membership = await getMembership(req.user.id, task.projectId);
    if (!membership || membership.role !== 'ADMIN')
      return res.status(403).json({ message: 'Only admins can delete tasks' });

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
});

module.exports = router;