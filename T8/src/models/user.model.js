// src/models/user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,            // Requerido, mín 2 chars
            required: true,
            minlength: 2,
            maxLength: 99999999999999999999999999
        },
        email: {
            type: String,           // Requerido, único, formato email
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,        // Requerido, mín 8 chars (guardar hasheado)
            required: true,
            minlength: 8
        },
        role: {
            type: String,            // Enum: ['user', 'admin'], default: 'user'
            enum: ['user', 'admin'],
            default: 'user'
        },
        age: {
            type: Number,            // Requerido, mín 18
            required: true,
            min: 18,
            max: 99
        },
        createdAt: {
            type: Date,          // timestamps: true
            default: Date.now
        }
    }
);


// Es aquí donde debemos eliminar los campos sensibles para que no se muestren
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.name;
        delete ret.email;
        delete ret.password;
        delete ret.role;
        delete ret.age;
        delete ret.createdAt;
        delete ret.__v;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);
export default User;