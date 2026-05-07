import { UserInterface } from '../../models/user.model.js';

// Esto es para que TypeScript se entere de que la propiedad user existe en el objeto request
declare global {
  namespace Express {
    interface Request {
      user?: UserInterface;
    }
  }
}