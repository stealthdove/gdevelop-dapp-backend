import { Request, Response, NextFunction } from "express";

export const validateRequestBody = (givenReqBody: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const missingReqBody: string[] = [];
        if ( givenReqBody ) {
            if(Object.keys(req.body).length === 0) {
                return res.status(400).json({ error: 'Bad request', message: 'Request body is empty.' });
            }
            givenReqBody.forEach(param => {
                if (!(param in req.body)) {
                    missingReqBody.push(param);
                }
            });
        }
        if (missingReqBody.length > 0) {
            return res.status(400).json({ error: 'Bad request', message: `Missing required parameters: ${missingReqBody.join(', ')}` });
        }

        // All required parameters are present, proceed to the next middleware or route handler
        next();
    };
}