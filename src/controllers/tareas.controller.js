// src/controllers/tareas.controller.js
import { tareas } from '../data/tareas.js';
import { ApiError } from '../middleware/errorHandler.js';

// En tareas.routes.js definimos cuándo se llama a estas funciones (endpoints)
// Este script se encarga de la lógica de cada endpoint


// GET /api/tareas
export const getAll = (req, res) => {
  let resultado = [...tareas];
  const { id, title, description, priority, completed, dueDate, tags, createdAt, updatedAt, orden } = req.query;    // El campo orden va a estar vacío XD
  
  // Filtrar por ID
  if (id) {
    resultado = resultado.filter(c => c.id === parseInt(id));
  }
  
  // Filtrar por título
  if (title) {
    resultado = resultado.filter(c => c.title.toLowerCase().includes(title.toLowerCase()));
  }

  // Filtrar por descripción
  if (description) {
    resultado = resultado.filter(c => c.description && c.description.toLowerCase().includes(description.toLowerCase()));
  }

  // Filtrar por prioridad
  if (priority) {
    resultado = resultado.filter(c => c.priority === priority);
  }

  // Filtrar por completada
  if (completed) {
    const isCompleted = completed.toLowerCase() === 'true';
    resultado = resultado.filter(c => c.completed === isCompleted);
  }

  // Filtrar por fecha de vencimiento
  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    resultado = resultado.filter(c => new Date(c.dueDate).toDateString() === dueDateObj.toDateString());
  }

  // Filtrar por etiquetas
  if (tags) {
    const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    resultado = resultado.filter(c => c.tags && tagsArray.every(tag => c.tags.includes(tag)));
  }

  // Filtrar por fecha de creación
  if (createdAt) {
    const createdAtObj = new Date(createdAt);
    resultado = resultado.filter(c => new Date(c.createdAt).toDateString() === createdAtObj.toDateString());
  }

  // Filtrar por fecha de actualización
  if (updatedAt) {
    const updatedAtObj = new Date(updatedAt);
    resultado = resultado.filter(c => new Date(c.updatedAt).toDateString() === updatedAtObj.toDateString());
  }
  
  // Ordenar
  if (orden === 'id') {
    resultado.sort((a, b) => b.id - a.id);
  } else if (orden === 'title') {
    resultado.sort((a, b) => a.title.localeCompare(b.title));
  }
  
  res.json(resultado);
};

// GET /api/tareas/:id
export const getById = (req, res) => {
  const id = parseInt(req.params.id);
  const tarea = tareas.find(c => c.id === id);
  
  if (!tarea) {
    throw ApiError.notFound(`Tarea con ID ${id} no encontrada`);
  }
  
  res.json(tarea);
};

// POST /api/tareas
export const create = (req, res) => {
  const { id, title, description, priority, completed, dueDate, tags, createdAt, updatedAt } = req.body;
  
  const nuevaTarea = {
    id: tareas.length + 1,
    title,
    description,
    priority,
    completed,
    dueDate,
    tags,
    createdAt,
    updatedAt,
  };
  
  tareas.push(nuevaTarea);
  
  res.status(201).json(nuevaTarea);
};

// PUT /api/tareas/:id
export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const index = tareas.findIndex(c => c.id === id);
  
  if (index === -1) {
    //throw ApiError.notFound(`Tarea con ID ${id} no encontrada`);
  }
  
  const { title, description, priority, completed, dueDate, tags, createdAt, updatedAt } = req.body;

  tareas[index] = {
    id,
    title,
    description,
    priority,
    completed,
    dueDate,
    tags,
    createdAt,
    updatedAt,
  };
  
  res.json(tareas[index]);
};

// PATCH /api/tareas/:id
export const partialUpdate = (req, res) => {
  const id = parseInt(req.params.id);
  const index = tareas.findIndex(c => c.id === id);
  
  if (index === -1) {
    //throw ApiError.notFound(`Tarea con ID ${id} no encontrada`);
  }
  
  tareas[index] = {
    ...tareas[index],
    ...req.body
  };
  
  res.json(tareas[index]);
};

// DELETE /api/tareas/:id
export const remove = (req, res) => {
  const id = parseInt(req.params.id);
  const index = tareas.findIndex(c => c.id === id);
  
  if (index === -1) {
    //throw ApiError.notFound(`Tarea con ID ${id} no encontrada`);
  }
  
  tareas.splice(index, 1);
  
  res.status(204).end();
};