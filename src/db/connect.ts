// src/db/connect.ts

import mongoose from 'mongoose';

const { MONGODB_URI = '' } = process.env;
if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');

type GlobalWithMongoose = typeof globalThis & { _mongoose?: Promise<typeof mongoose> };
const g = global as GlobalWithMongoose;

export async function dbConnect() {
    if (!g._mongoose) {
        g._mongoose = mongoose.connect(MONGODB_URI, {
            dbName: 'ancretoi',
            autoIndex: true,
            maxPoolSize: 10,
        });
    }
    return g._mongoose;
}
