import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env"), override: false });

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET");
}

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

export const signTokenWithExpiry = (payload, expiresIn) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
