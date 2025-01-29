import { getLogger } from '../../init/logger'
import { ISourceMovieInfoDocument, IScrapeMovieInfoModel, ISourceMovieGeneralModel, ISourceMovieInfoModel } from '../../model'
import { IMovieInfoScrapeDetail } from '../../interface/scraper'

/**
 * 刮削DMM详情
 */
export class DmmDetailScrape implements IMovieInfoScrapeDetail {

    // 日志
    private readonly logger = getLogger();
    // 模型
    private readonly model: ISourceMovieInfoModel;

    public constructor(_model: ISourceMovieInfoModel) {
        this.model = _model;
    }


    public static async initByUrl(url: string): Promise<DmmDetailScrape> {
        // const model = await IScrapeMovieInfoModel.findOne({ sourceUrl: url });
        // return new DmmDetailScrape(model    );
    }

    public static async initByData(data: ISourceMovieGeneralModel): Promise<DmmDetailScrape> {
        // const model = await IScrapeMovieInfoModel.findOne({ sourceUrl: url });
        // return new DmmDetailScrape(model    );
    }

    /**
     * 刮削详情
     * @param _model 
     * @returns 
     */
    public async scrape(_model: ISourceMovieInfoModel): Promise<ISourceMovieInfoModel | unknown> {
        try {


        }
        catch (error) {

            const message = `【${this.model.code || this.model.originalCode}】刮削失败: ${error.message}`;
            this.logger.errorDetail(message, this.model.code || this.model.originalCode, { ex: error, data: this.model })
        }
        finally {
            // 数据保存
        }
    }
}
