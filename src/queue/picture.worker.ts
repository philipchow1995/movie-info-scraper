import { Worker } from 'bullmq';
import { getRedisConnection } from '../init';
import { ProcessPicture } from '../services/picture.service';
import { IScrapePictureQueueJob } from './queue.type';
import { SourceMovieInfoModel, PictureScrapeStatus } from '../model';
import { MovieInfoScrapeStatus } from '../model';

let worker: Worker;

/*
    图片刮削队列
*/
export const initPictureWorker = () => {
    if (!worker) {
        worker = new Worker('scraperPicture', async (job) => {
            const { picture, code, source, referer, origin }: IScrapePictureQueueJob = job.data;
            try {
                console.log(`开始处理图片: ${code} - ${picture.id}`);

                const result = await ProcessPicture(code, source, picture, referer, origin);
                console.log(`处理完成: ${code} - ${picture.id}`);

                // 返回处理结果，这个结果会传递给 completed 事件处理器
                return {
                    code,
                    pictureId: picture.id,
                    success: true,
                    result
                };
            }
            catch (err) {
                console.error(`处理失败: ${code} - ${picture.id}`, err);
                throw err;
            }
        }, {
            connection: getRedisConnection(),
            concurrency: 3,  // 同时处理个任务
            limiter: {
                max: 3,     // 每个时间窗口最多处理任务数
                duration: 1000  // 时间窗口为1秒
            }
        });

        // 添加错误处理
        worker.on('error', err => {
            console.error('Worker error:', err);
        });

        // 添加完成处理
        worker.on('completed', async (job, result) => {
            try {
                const { code, pictureId, success, result: pictureResult } = result;

                // 更新图片状态
                const updatedDoc = await SourceMovieInfoModel.findOneAndUpdate(
                    {
                        code: code,
                        'pictures.id': pictureId  // 匹配数组中特定id的元素
                    },
                    {
                        $set: {
                            'pictures.$.status': PictureScrapeStatus.COMPLETED,
                            'pictures.$.updateAt': new Date(),
                            'pictures.$.md5': pictureResult.md5,
                            'pictures.$.width': pictureResult.width,
                            'pictures.$.height': pictureResult.height,
                            'pictures.$.size': pictureResult.size,
                            'pictures.$.directoryName': pictureResult.directoryName,
                            'pictures.$.fileName': pictureResult.fileName,
                            'pictures.$.extName': pictureResult.extName,
                            'pictures.$.compressList': pictureResult.compressList || []
                        }
                    },
                    { new: true }  // 返回更新后的文档
                );

                // 检查是否所有图片都已完成
                if (updatedDoc) {
                    const allPicturesCompleted = updatedDoc.pictures?.every(
                        pic => pic.status === PictureScrapeStatus.COMPLETED
                    );

                    if (allPicturesCompleted) {
                        // 更新影片状态为完成
                        await SourceMovieInfoModel.updateOne(
                            { _id: updatedDoc._id },
                            {
                                $set: {
                                    status: MovieInfoScrapeStatus.COMPLETED,
                                    updateAt: new Date()
                                }
                            }
                        );
                        console.log(`所有图片处理完成，影片状态已更新: ${code}`);
                    }
                }

                console.log(`任务完成: ${job.id}, 代码: ${code}, 图片: ${pictureId}`);
            } catch (err) {
                console.error(`更新图片状态失败: ${job.id}`, err);
            }
        });

        // 添加失败处理
        worker.on('failed', async (job, err) => {
            try {
                if (!job) return;

                const { picture, code } = job.data as IScrapePictureQueueJob;

                // 检查是否还有重试机会
                if (job.attemptsMade < job.opts.attempts!) {
                    console.log(`任务失败，将重试: ${job.id}, 代码: ${code}, 图片: ${picture.id}, 重试次数: ${job.attemptsMade}/${job.opts.attempts}`);
                    return;
                }

                // 所有重试都失败后，更新状态为失败
                await SourceMovieInfoModel.findOneAndUpdate(
                    {
                        code: code,
                        'pictures.id': picture.id
                    },
                    {
                        $set: {
                            'pictures.$.status': PictureScrapeStatus.FAILED,
                            'pictures.$.updateAt': new Date(),
                            'pictures.$.error': `失败(${job.attemptsMade}次尝试): ${err.message}`
                        }
                    },
                    { new: true }
                );

                console.error(`任务最终失败: ${job.id}, 代码: ${code}, 图片: ${picture.id}, 尝试次数: ${job.attemptsMade}`, err);
            } catch (updateErr) {
                console.error(`更新失败状态失败: ${job?.id}`, updateErr);
            }
        });

        console.log('图片处理Worker已启动');
    }
    return worker;
}


