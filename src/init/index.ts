import { Redis } from 'ioredis';
import { getRedisConfig } from '@d680/shared';
import { CreateLocalStorage, ILocalStorageModel } from '@d680/localstorage-service'
import { createLogger } from './logger';

export const SERVICE_NAME = '影片信息刮削器';

let DEFAULT_PATH: string = '';
let DEFAULT_STORAGE_ID: string = '';

// Redis 连接实例
let redis: Redis;

// 初始化Redis连接
const initRedis = () => {
    if (!redis) {
        const redisConfig = getRedisConfig();
        redis = new Redis({
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: redisConfig.db,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                return Math.min(times * 50, 2000);
            }
        });
    }
    return redis;
}

// 获取本地存储ID
export const getLocalStorageId = (): string => {
    return DEFAULT_STORAGE_ID;
}

// 获取图片默认路径
export const getPictureDefaultPath = (): string => DEFAULT_PATH ? `${DEFAULT_PATH}/pictures` : '';

// 获取Redis连接
export const getRedisConnection = (): Redis => {
    return initRedis();
}

/**
 * 初始化所有服务
 */
export async function init() {
    try {
        // 初始化 Logger
        await createLogger();

        const deviceFactory = await CreateLocalStorage();
        if (!deviceFactory)
            throw new Error('本地存储服务初始化失败');

        const defaultStorage = await deviceFactory.getDefaultStorage();
        if (!defaultStorage)
            throw new Error('未找到默认存储');

        // 设置默认存储ID
        DEFAULT_STORAGE_ID = defaultStorage!.id;

        // 设置默认路径
        const defaultPath = await deviceFactory.getDefaultPath();
        if (!defaultPath) {
            throw new Error('未找到默认存储');
        }

        // 初始化默认存储路径
        DEFAULT_PATH = defaultPath;

        // 初始化Redis连接
        initRedis();

        // 初始化Worker
        const { initPictureWorker } = await import('../queue/picture.worker');
        initPictureWorker();

    }
    catch (error) {
        console.error(`${SERVICE_NAME} 初始化失败: ${error}`);
        throw error;
    }
}

// 清除Redis缓存 
export const clearRedis = (key?: string) => {
    try {
        if (key) {
            redis.del(key);
        } else {
            redis.flushall();
        }
    } catch (error) {
        console.error(`清除Redis缓存失败: ${error}`);
    }
}
