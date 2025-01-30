import { ISourceMoviePictureModel } from "../model/picture";
import { MovieInfoScrapeSource } from "../types/movie.enum";

// 刮削图片队列任务
export interface IScrapePictureQueueJob {
    picture: ISourceMoviePictureModel;
    code: string;
    source: MovieInfoScrapeSource;
    referer: string;
    origin: string;
}