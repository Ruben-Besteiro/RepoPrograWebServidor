// src/models/storage.model.js
import mongoose from 'mongoose';

const storageSchema = new mongoose.Schema({
  _id: {
    type: Number
  },
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  url: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});


// Esto sirve para que el ID sea numérico y no un string
storageSchema.pre('validate', async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    // Buscamos el último que sea numérico explícitamente
    const lastStorage = await this.constructor.findOne(
      { _id: { $type: "number" } },
      {},
      { sort: { '_id': -1 } }
    );

    if (lastStorage && typeof lastStorage._id === 'number') {
      this._id = lastStorage._id + 1;
    } else {
      this._id = 1;
    }
    console.log(`Generando ID para storage: ${this._id}`);
  }
});


const Storage = mongoose.model('Storage', storageSchema);

export default Storage;