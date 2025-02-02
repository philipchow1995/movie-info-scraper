import { IPictureModel } from "../database/picture.model";
import { MovieInfoScrapeSource } from "../types/movie.enum";


// 刮削图片队列任务
export interface IScrapePictureQueueJob {
    picture: IPictureModel;
    code: string;
    source: MovieInfoScrapeSource;
    referer: string;
    origin: string;
}