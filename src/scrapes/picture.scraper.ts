import { getLogger } from "src/init/logger";
import { ISourceMovieInfoModel, MovieInfoScrapeSource } from "../database/source.movie.model";
import { PictureStatus, IPictureModel, PictureTargetType, PictureRepository, PictureLinkRepository } from "../database/picture.model";
import { AddJob } from "src/queue/picture.queue";



// 定义图片目标是影片
const TARGET_TYPE = PictureTargetType.MOVIE

// 刮削图片列表
export const ScrapePictureList = async (targetId: bigint, code: string, source: MovieInfoScrapeSource, pictures: IPictureModel[]): Promise<void> => {
    // 可以并发处理所有图片
    await Promise.all(pictures.map(picture => ScraperPicture(targetId, code, source, picture)));
}


// 刮削图片

export const ScraperPicture = async (targetId: bigint, code: string, source: MovieInfoScrapeSource, picture: IPictureModel): Promise<void> => {
    const logger = getLogger()
    let pictureJobData: IPictureModel | undefined = undefined;;

    try {
        // 先查询数据库中是否存在该 URL 对应的图片记录（不考虑关联关系）
        const existingPicture = await PictureRepository.findOne({ url: picture.url });

        if (existingPicture) {
            // 检查是否已存在当前 target 的关联关系
            const existingLink = await PictureLinkRepository.findOne({
                targetId: targetId,
                targetType: TARGET_TYPE,
                pictureId: existingPicture._id
            });
            // 如果关联关系不存在，则建立新的关联关系
            if (!existingLink) {
                await PictureLinkRepository.create({
                    targetId: targetId,
                    targetType: TARGET_TYPE,
                    pictureId: existingPicture._id
                });
            }
            pictureJobData = existingPicture.toObject();
        } else {
            // 不存在该图片记录，先创建图片文档
            const data = await PictureRepository.create({
                ...picture,
                targetType: TARGET_TYPE,
                targetId: targetId
            });

            await data.save();
            pictureJobData = data.toObject();
            // 为新创建的图片建立关联关系
            await PictureLinkRepository.create({
                targetId: targetId,
                targetType: TARGET_TYPE,
                pictureId: data._id
            });
        }

        // 创建任务
        if (pictureJobData) {
            AddJob({
                picture: pictureJobData,
                code,
                source,
                referer: picture.url,
                origin: picture.url
            });
        }
    }
    catch (e) {
        const message = e instanceof Error ? e.message : e?.toString() || '未知错误'
        logger.error(`刮削图片失败 ${picture.url} : ${message}`, e as Error, {
            TargetId: targetId,
            Code: code,
            Source: source,
            Picture: picture
        })
    }

}

