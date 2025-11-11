const Project = require('../models/Project');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ active: true }).sort({ name: 1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const trimmed = name.trim();

    const existing = await Project.findOne({
      name: new RegExp(`^${escapeRegExp(trimmed)}$`, 'i'),
      active: true,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: 'A project with this name already exists' });
    }

    const project = await Project.create({ name: trimmed });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};
