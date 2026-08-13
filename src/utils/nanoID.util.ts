import { customAlphabet } from 'nanoid';
export const generateCode = customAlphabet(
  '1234567890ABCDEFGHJKLMNPQRSTUVWXYZ',
  10,
);
