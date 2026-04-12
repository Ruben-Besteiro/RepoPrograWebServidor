import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
