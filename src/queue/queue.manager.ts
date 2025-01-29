import { Queue, Worker } from 'bullmq';
import { getRedisConfig, type IRedisConfig } from '@d680/shared';
import { Redis } from 'ioredis';

const redisConfig = getRedisConfig();

const redisConnection = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
    }
});

// 刮削详情队列
export const ScraperDetailQueue = new Queue('scraperDetail', { connection: redisConnection });

// 刮削图片队列
export const ScraperPictureQueue = new Queue('scraperPicture', { connection: redisConnection });

