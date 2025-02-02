import { Queue } from 'bullmq';
import { getRedisConnection } from '../init';
import { IScrapePictureQueueJob } from './queue.type';

// 刮削详情队列
export const ScraperDetailQueue = new Queue('scraperDetail', { connection: getRedisConnection() });

// 刮削图片队列
export const ScraperPictureQueue = new Queue('scraperPicture', { connection: getRedisConnection() });

export const AddScraperPictureJob = async (data: IScrapePictureQueueJob) => {
    console.log(`添加图片刮削队列任务:${data.picture.url}`);

    // 使用图片URL作为唯一标识
    const jobId = `picture_${data.source}_${data.code}_${data.picture.id}`.toLocaleLowerCase();

    // 检查任务是否已存在
    const existingJob = await ScraperPictureQueue.getJob(jobId);
    if (existingJob) {
        console.log(`任务已存在，跳过添加: ${jobId}`);
        return;
    }

    await ScraperPictureQueue.add('scraperPicture', data, {
        jobId,  // 设置任务ID
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },  // 指数退避
        removeOnComplete: true,
        removeOnFail: true,
        priority: 1  // 优先级，数字越小优先级越高
    });
}

// 根据状态获取任务
export const getJobsByState = async (state: 'active' | 'waiting' | 'completed' | 'failed') => {
    return await ScraperPictureQueue.getJobs([state]);
}

// 根据source和code移除任务
export const removeJobsBySourceAndCode = async (source: string, code: string) => {
    // 获取所有等待中的任务
    const jobs = await ScraperPictureQueue.getJobs(['waiting']);

    for (const job of jobs) {
        const data = job.data as IScrapePictureQueueJob;
        if (data.source === source && data.code === code) {
            console.log(`移除任务: ${job.id}`);
            await job.remove();
        }
    }
}

// 根据jobId移除任务
export const removeJobById = async (jobId: string) => {
    const job = await ScraperPictureQueue.getJob(jobId);
    if (job) {
        console.log(`移除任务: ${jobId}`);
        await job.remove();
    }
}

// 清空所有等待中的任务
export const clearWaitingJobs = async () => {
    const jobs = await ScraperPictureQueue.getJobs(['waiting']);
    console.log(`清空${jobs.length}个等待中的任务`);
    await Promise.all(jobs.map(job => job.remove()));
}

// 停止并移除正在执行的任务
export const stopActiveJobs = async () => {
    const activeJobs = await ScraperPictureQueue.getJobs(['active']);
    console.log(`停止${activeJobs.length}个正在执行的任务`);

    for (const job of activeJobs) {
        try {
            // 先尝试停止任务
            await job.discard();
            // 然后移除任务
            await job.remove();
            console.log(`已停止并移除任务: ${job.id}`);
        } catch (err) {
            console.error(`停止任务失败: ${job.id}`, err);
        }
    }
}

// 根据source和code停止并移除正在执行的任务
export const stopActiveJobsBySourceAndCode = async (source: string, code: string) => {
    const activeJobs = await ScraperPictureQueue.getJobs(['active']);

    for (const job of activeJobs) {
        const data = job.data as IScrapePictureQueueJob;
        if (data.source === source && data.code === code) {
            try {
                await job.discard();
                await job.remove();
                console.log(`已停止并移除任务: ${job.id}`);
            } catch (err) {
                console.error(`停止任务失败: ${job.id}`, err);
            }
        }
    }
}

// 停止并清空所有任务（包括等待和执行中的）
export const clearAllJobs = async () => {
    // 先停止正在执行的任务
    await stopActiveJobs();

    // 然后移除等待中的任务
    await clearWaitingJobs();

    // 移除失败的任务
    const failedJobs = await ScraperPictureQueue.getJobs(['failed']);
    await Promise.all(failedJobs.map(job => job.remove()));

    console.log('已清空所有任务');
}

// 暂停队列
export const pauseQueue = async () => {
    await ScraperPictureQueue.pause();
    console.log('队列已暂停');
}

// 恢复队列
export const resumeQueue = async () => {
    await ScraperPictureQueue.resume();
    console.log('队列已恢复');
}

// 获取队列状态信息
export const getQueueInfo = async () => {
    const [waiting, active, completed, failed] = await Promise.all([
        ScraperPictureQueue.getWaitingCount(),
        ScraperPictureQueue.getActiveCount(),
        ScraperPictureQueue.getCompletedCount(),
        ScraperPictureQueue.getFailedCount()
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed
    };
}

