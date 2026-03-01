// Se pone el link a la carátula para la imagen
import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    _id: {
      type: Number
    },
    title: {
      type: String,
      required: true,
      minlength: 2
    },
    director: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      min: 1888,
      max: new Date().getFullYear()
    },
    genre: {
      type: String,
      enum: ['action', 'comedy', 'drama', 'horror', 'scifi']
    },
    copies: {         // Esto no se modifica nunca
      type: Number,
      default: 5
    },
    availableCopies: {
      type: Number,
      default: 5
    },
    timesRented: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 10
    },
    cover: String         // Nombre del archivo de carátula (default: null)
  }
  , {
    timestamps: true,
    versionKey: false
  });


// Esto de aquí es para que el ID sea numérico y no un string
movieSchema.pre('validate', async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    // Buscamos el último que sea numérico explícitamente para evitar conflictos con ObjectIds si los hubiera
    const lastMovie = await this.constructor.findOne(
      { _id: { $type: "number" } },
      {},
      { sort: { '_id': -1 } }
    );

    if (lastMovie && typeof lastMovie._id === 'number') {
      this._id = lastMovie._id + 1;
    } else {
      this._id = 1;
    }
    console.log(`Generando ID para película: ${this._id}`);
  }
});




const Movie = mongoose.model('Movie', movieSchema);
export default Movie;