import jwt from 'jsonwebtoken'

export const generateToken = (user: any) => {
    const JWT_SECRET = process.env.JWT_SECRET as string;

    return jwt.sign({user}, JWT_SECRET, { expiresIn: "24h" });
}

