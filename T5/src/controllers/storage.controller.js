// src/controllers/storage.controller.js
import Storage from '../models/storage.model.js';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3000';

// POST /api/storage (cuando subimos un archivo)
export const uploadFile = async (req, res) => {
  // Si no hay nada
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  // Desestructuramos la información del archivo y la metemos en un json (creo)
  const { filename, originalname, mimetype, size } = req.file;

  const fileData = await Storage.create({
    filename,
    originalName: originalname,
    url: `${PUBLIC_URL}/uploads/${filename}`,
    mimetype,
    size
  });

  res.status(201).json({ data: fileData });
};

// GET /api/storage
export const getFiles = async (req, res) => {
  const files = await Storage.find().sort({ createdAt: -1 });
  res.json({ data: files });
};

// GET /api/storage/:id
export const getOneFile = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Valor inválido para _id' });
  }

  const file = await Storage.findById(id);

  if (!file) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  res.json({ data: file });
};

// DELETE /api/storage/:id
export const deleteFile = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Valor inválido para _id' });
  }

  const file = await Storage.findById(id);

  if (!file) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  // Eliminar archivo físico
  try {
    const filePath = join(process.cwd(), 'storage', file.filename);
    await unlink(filePath);
  } catch (err) {
    console.warn('Archivo físico no encontrado');
  }

  await Storage.findByIdAndDelete(id);
  res.status(204).send();
};
