import CryptoJS from 'crypto-js';
import jwt from "jsonwebtoken";

// Encrypt function
export function apiKeyGen(text: string): string {
	return CryptoJS.AES.encrypt(text, process.env.SECRET_KEY as string).toString();
}

// Decrypt function
export function decryptApiKey(ciphertext: string): string {
	const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.SECRET_KEY as string);
	return bytes.toString(CryptoJS.enc.Utf8);
}

// Middleware function to generate JWT token
export const generateToken = (payload: any): string => {
	return jwt.sign(payload, process.env.SECRET_KEY as string, { expiresIn: '1h' }); // Token expires in 1 hour
};

export const generateRandomString = (length: number = 10) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}