import { Redis } from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { getCurrentDateTime, getRedisConfig, type IRedisConfig } from '@d680/shared';
import { getRedisConnection } from '../init';
import { getLogger } from '../init/logger'
import { MovieInfoScrapeSource } from '../types/movie.enum';
import { ISourcePictureModel } from '../model/picture';
import { IScrapePictureQueueJob } from './queue.type';

const queueName = 'pictureDownload';

// 刮削图片队列
export const ScraperPictureQueue = new Queue(queueName, { connection: getRedisConnection() });

// 添加任务
export const AddJob = async (data: IScrapePictureQueueJob) => {
    const logger = getLogger();

    // 将 BigInt 转换为字符串
    const jobData = {
        ...data,
        picture: {
            ...data.picture,
            id: data.picture.id.toString(),  // 转换 id
            targetId: data.picture.targetId?.toString()  // 转换 targetId（如果存在）
        }
    };

    const jobId = `picture_download_${jobData.picture.url}`;
    // 检查任务是否已存在
    const existingJob = await ScraperPictureQueue.getJob(jobId);
    if (existingJob) {
        logger.infoDetail(`【${getCurrentDateTime('yyyy-MM-dd HH:mm:ss')}】【Redis队列:${queueName}】任务已存在: ${jobId}`, data.code);
        return;
    }

    await ScraperPictureQueue.add(queueName, jobData, {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: true,
        priority: 1
    });

    console.log(`【${getCurrentDateTime('yyyy-MM-dd HH:mm:ss')}】【Redis队列:${queueName}】创建成功: ${jobId}`);
}

// 取消图片指定番号及源的所有队列任务
export const cancel = async (code: string, source: MovieInfoScrapeSource) => {
    const logger = getLogger();
    const jobs = await ScraperPictureQueue.getJobs();
    for (const job of jobs) {
        const data = job.data as IScrapePictureQueueJob;
        if (data.source === source && data.code === code) {
            try {
                await job.discard();
                await job.remove();
                logger.infoDetail(`【${getCurrentDateTime('yyyy-MM-dd HH:mm:ss')}】【Redis队列:${queueName}】已取消: ${job.id}`, code);
            } catch (err) {
                logger.errorDetail(`【${getCurrentDateTime('yyyy-MM-dd HH:mm:ss')}】【Redis队列:${queueName}】取消任务失败: ${job.id}`, code, err);
            }
        }
    }
}

// 清空队列
export const clearQueue = async () => {
    await ScraperPictureQueue.obliterate({ force: true });
}