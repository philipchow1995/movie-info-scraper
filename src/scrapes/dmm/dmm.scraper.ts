import { getDateTime } from '@d680/shared';
import { IMovieInfoScraper, IBaseQuery } from '../../interface/scraper';
import { ISourceMovieInfoDocument, ISourceMovieInfoModel, MovieInfoScrapeSource, SourceMovieInfoModel, createModel, MovieInfoScrapeStatus, PictureScrapeStatus } from '../../model';
import { MovieInfoScrapeException } from '../../types/movie.exception';
import { DEFAULT_DMM_QUERY, IDmmQuery, DmmContentType } from './query';
import { DmmListScrape } from './dmm.list';
import { AddScraperPictureJob } from '../../queue/queue.manager';

/**
 * DMM刮削器
 */
export class DmmScraper implements IMovieInfoScraper {

    // 刮削源
    private readonly SOURCE = MovieInfoScrapeSource.DMM;

    public static async init(): Promise<DmmScraper> {
        return new DmmScraper();
    }

    // 获取最新刮削数据
    async getNew(): Promise<void> {
        return;
    }

    async getDay(date: Date): Promise<void> {
        try {
            // 构造条件
            const query: IDmmQuery = {
                ...DEFAULT_DMM_QUERY,
                contentType: DmmContentType.TWO_DIMENSION,
                deliveryStartDate: date,
            }
            await this.getList(query);
        }
        catch (e) {
            throw new MovieInfoScrapeException(`Dmm刮削指定日${getDateTime(date)} 数据失败`, this.SOURCE, e);
        }
    }

    // 搜索刮削数据
    async search(keyword: string): Promise<void> {
        try {
            // 构造条件
            const query: IDmmQuery = {
                ...DEFAULT_DMM_QUERY,
                contentType: DmmContentType.TWO_DIMENSION,
                searchStr: keyword,
            }
            await this.getList(query);

        }
        catch (e) {
            throw new MovieInfoScrapeException('Dmm搜索刮削数据失败', this.SOURCE, e);
        }
    }

    // 条件搜索
    async getQuery(query: IDmmQuery): Promise<void> {
        try {
            await this.getList(query);
        }
        catch (e) {
            throw new MovieInfoScrapeException('Dmm构造刮削条件失败', this.SOURCE, e);
        }
    }



    // 获取详情
    async getDetailCode(code: string): Promise<void> {
        return;
    }

    // 获取详情
    async getDetailUrl(url: string): Promise<void> {
        return;
    }

    // 获取刮削列表
    private async getList(query: IDmmQuery): Promise<void> {
        try {
            const dmmListScrape = await DmmListScrape.init();
            const result = await dmmListScrape.scrapeList(query);
            await Promise.all(
                result.flatMap(async item => {
                    // 如果是已经完成的，则跳过
                    if (item.status === MovieInfoScrapeStatus.COMPLETED) return;

                    // 如果是部分完成状态，则更新记录
                    if (item.isExist) {
                        // 先获取当前记录
                        const currentDoc = await SourceMovieInfoModel.findOne({
                            code: item.code,
                            source: this.SOURCE
                        });

                        if (currentDoc) {
                            // 合并图片列表，保留已完成的图片状态
                            const mergedPictures = item.pictures?.map(newPic => {
                                // 查找当前文档中对应的图片
                                const existingPic = currentDoc.pictures?.find(p =>
                                    p.url === newPic.url
                                );

                                // 如果找到且状态是完成，保留原有图片信息
                                if (existingPic && existingPic.status === PictureScrapeStatus.COMPLETED) {
                                    return existingPic;
                                }

                                // 否则使用新的图片信息
                                return newPic;
                            });

                            item.pictures = mergedPictures;

                            // 更新文档
                            const response = await SourceMovieInfoModel.findOneAndUpdate(
                                { code: item.code, source: this.SOURCE },
                                {
                                    $set: {
                                        ...item,
                                        pictures: item.pictures,
                                        updateAt: new Date()
                                    }
                                },
                                { new: true }
                            );

                        }
                    } else {
                        // 否则创建新记录
                        item.status = MovieInfoScrapeStatus.PICTURES_DOWNLOADING;
                        const data = await SourceMovieInfoModel.create(item);
                        await data.save();
                    }

                    // 图片处理任务
                    // 仅处理状态为未完成
                    item.pictures?.map(picture => {
                        if (picture.status !== PictureScrapeStatus.COMPLETED) {
                            AddScraperPictureJob({
                                picture,
                                code: item.code!,
                                source: this.SOURCE,
                                referer: item.sourceUrl!,
                                origin: item.sourceUrl!
                            })
                        }
                    }) || []
                })
            )
        }
        catch (e) {
            throw new MovieInfoScrapeException('Dmm获取刮削列表失败', this.SOURCE, e);
        }
    }
}
