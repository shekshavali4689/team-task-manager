const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET ALL PROJECTS FOR CURRENT USER
router.get('/', authenticate, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) { next(err); }
});

// CREATE PROJECT
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: { create: { userId: req.user.id, role: 'ADMIN' } }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// GET SINGLE PROJECT
router.get('/:projectId', authenticate, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } }
    });
    if (!membership) return res.status(403).json({ message: 'Not a member of this project' });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.json({ ...project, currentUserRole: membership.role });
  } catch (err) { next(err); }
});

// ADD MEMBER TO PROJECT (admin only)
router.post('/:projectId/members', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.projectId } }
    });
    if (existing) return res.status(409).json({ message: 'User already a member' });

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: req.params.projectId,
        role: role || 'MEMBER'
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json(member);
  } catch (err) { next(err); }
});

// REMOVE MEMBER (admin only)
router.delete('/:projectId/members/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    if (userId === req.user.id)
      return res.status(400).json({ message: 'Cannot remove yourself' });

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } }
    });
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
});

// DELETE PROJECT (admin only)
router.delete('/:projectId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
});

module.exports = router;