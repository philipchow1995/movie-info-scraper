import { getDateTime } from "@d680/shared";
import { getLogger } from "src/init/logger";
import { IMovieInfoScraper, IBaseQuery } from "../interface/scraper";
import { ISourceMovieInfoModel, MovieInfoScrapeSource, MovieInfoScrapeStatus, SourceMovieInfoRepository } from "../database/source.movie.model";
import { PictureStatus } from "../database/picture.model";
import { AddJob } from "../queue/picture.queue";
import { MovieInfoScrapeException } from "../types/movie.exception";

export abstract class BaseScraper implements IMovieInfoScraper {

    protected readonly logger = getLogger();

    protected abstract readonly SOURCE: MovieInfoScrapeSource;

    protected async processResults(results: ISourceMovieInfoModel[]) {
        await Promise.all(results.map(async item => await this.handleProcessItem(item)));
    }

    protected async handleProcessItem(item: ISourceMovieInfoModel) {
        try {
            this.logger.info(`【${this.SOURCE} ${item.code || ''}】影片刮削后处理开始: ${item.code}`);

            // 这个是已存在且不需要更新的记录 - 跳过
            if (item.status === MovieInfoScrapeStatus.COMPLETED) {
                this.logger.info(`【${this.SOURCE} ${item.code || ''}】该影片于${getDateTime(item.updateAt!)}已刮削过且状态为完成，不需要再处理`);
                return;
            }

            // 设置状态为部分完成
            item.status = MovieInfoScrapeStatus.PARTIAL_DONE;
            if (item.isExist) {
                // 更新状态就好了
                this.logger.info(`【${this.SOURCE} ${item.code || ''}】开始更新影片状态:上次于${getDateTime(item.updateAt!)}采集未全部完成`);
                await SourceMovieInfoRepository.updateOne(
                    { id: item.id },
                    { $set: { status: item.status, updateAt: new Date() } }
                );
            }
            else {
                // 创建
                this.logger.info(`【${this.SOURCE} ${item.code || ''}】开始创建影片:${item.code}`);
                await SourceMovieInfoRepository.create(item);
            }

            // 图片处理任务
            this.handlePictures(item);

        }
        catch (err) {
            const message = err instanceof Error ? err.message : err?.toString() || '未知错误';
            this.logger.error(`【${this.SOURCE} ${item.code || ''}】影片处理失败: ${message}`);
        }
    }

    // 通用图片处理 | 队列处理
    protected async handlePictures(movieInfo: ISourceMovieInfoModel) {
        movieInfo.pictures?.forEach(picture => {
            if (picture.status !== PictureStatus.COMPLETED) {
                AddJob({
                    picture,
                    code: movieInfo.code!,
                    source: this.SOURCE,
                    referer: movieInfo.sourceUrl!,
                    origin: movieInfo.sourceUrl!
                });
            }
        });
    }

    // 保存电影信息
    protected async saveMovieInfo(movieInfo: ISourceMovieInfoModel) {
        // 1. 已存在的 更新
        // 2. 不存在的 创建
    }


    abstract getNew(): Promise<void>;


    abstract getQuery(query: IBaseQuery): Promise<void>;

    abstract search(keyword: string): Promise<void>;

    abstract getDetailUrl(url: string): Promise<void>;

    abstract getDetailCode(code: string): Promise<void>;
}
