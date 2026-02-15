import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import MongoDBStore from '@iroomit/rate-limit-mongodb';

export function createLimiter(windowMs: number, max: number): RateLimitRequestHandler {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: { 
            error: 'API rate limit exceeded', 
            message: 'Too many requests, please slow down', 
            status: 429
        }, 
        standardHeaders: true,
        legacyHeaders: false,
        store: new MongoDBStore({
            uri: process.env.MONGO_URI,
            collectionName: "rate_limits"
        })
    });
};

export const globalLimiter = rateLimit({
    windowMs: 60 * 1 * 1000, // 1 minute limit
    max: 600, // 600 in one minute
    message: { 
            error: 'API rate limit exceeded', 
            message: 'Too many requests, please slow down', 
            status: 429
        }, 
    standardHeaders: true,
    legacyHeaders: false,
    store: new MongoDBStore({
        uri: process.env.MONGO_URI,
        collectionName: "rate_limits"
    }),
    keyGenerator: (req, res) => {
        return req.ip + ":" + req.path
    }
});
