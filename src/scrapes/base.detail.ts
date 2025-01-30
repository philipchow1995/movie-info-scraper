import { getLogger, Logger } from '../init/logger';
import { ISourceMovieInfoModel, MovieInfoScrapeSource } from '../model';

export abstract class BaseDetailScrape {
    protected readonly model: ISourceMovieInfoModel;
    protected abstract readonly SOURCE: MovieInfoScrapeSource;
    protected readonly logger: Logger;


    protected constructor(_model: ISourceMovieInfoModel) {
        this.logger = getLogger();
        this.model = _model;
    }

    // 检查数据
    protected abstract checkData(): void;

    // 请求数据
    protected abstract requestHtml(): Promise<string>;

    // 解析源代码
    protected abstract resolve(code: string, html: string): void;

}
