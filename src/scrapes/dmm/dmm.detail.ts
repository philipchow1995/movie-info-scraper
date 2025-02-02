import { load } from 'cheerio';
import { generateSnowflakeId } from '@d680/shared';
import { getLogger } from '../../init/logger'
import { MovieInfoScrapeSource, MovieInfoScrapeStatus } from '../../types/movie.enum'
import { MovieInfoScrapeException } from '../../types/movie.exception'
import { ISourceMovieGeneralModel, ISourceMovieInfoModel, DEFAULT_SOURCE_MOVIE_INFO, ISourceMovieReviewModel, SourceMovieInfoRepository } from '../../database/source.movie.model'
import { IMovieInfoScrapeDetail } from '../../interface/scraper'
import { DMM_DETAIL_URL, getDmmCodeFromUrl, deDmmCode, getDmmCodeFormatter } from './utils'
import { BaseDetailScrape } from '../base.detail'
import { dmmAxiosBuilder, dmmDetailAxiosHeaders } from './dmm.axios'
import { getDmmCoverUrl, getDmmPostUrl, getDmmPictures, getDmmCoverPicture, getDmmPostPicture } from './picture.utils'

/**
 * 刮削DMM详情
 */
export class DmmDetailScrape extends BaseDetailScrape implements IMovieInfoScrapeDetail {

    // Dmm刮削页的详情页基本URL
    private static readonly BASE_URL = DMM_DETAIL_URL;
    // 刮削源为DMM
    protected readonly SOURCE = MovieInfoScrapeSource.DMM;

    // 模型
    // protected readonly model: ISourceMovieInfoModel;

    protected constructor(_model: ISourceMovieInfoModel) {
        super(_model);
    }


    public static async initByDmmCode(dmmCode: string): Promise<DmmDetailScrape> {
        const url = `${this.BASE_URL}${dmmCode}`;
        return this.initByUrl(url);
    }

    public static async initByUrl(url: string): Promise<DmmDetailScrape> {
        const dmmCode = getDmmCodeFromUrl(url);
        const _model: ISourceMovieInfoModel = {
            ...DEFAULT_SOURCE_MOVIE_INFO,
            source: MovieInfoScrapeSource.DMM,
            code: deDmmCode(dmmCode),                                                               // 将dmmCode转换为标准番号
            originalCode: dmmCode,                                                                  // 原始DMM番号
            sourceUrl: url,                                                                         // 刮削源URL
            status: MovieInfoScrapeStatus.WAITING,                                                  // 刮削状态            
        }
        return new DmmDetailScrape(_model);
    }

    public static async initByData(data: ISourceMovieInfoModel): Promise<DmmDetailScrape> {
        return new DmmDetailScrape(data);
    }

    /**
     * 刮削详情
     * @param _model 
     * @returns 
     */
    public async scrapeDetail(): Promise<ISourceMovieInfoModel | unknown> {
        try {
            // 检查数据
            this.checkData();

            // 检查是否已存在
            const existData = await SourceMovieInfoRepository.findOne({
                code: this.model.code,
                source: this.SOURCE
            });

            if (existData)
                return { ...existData.toObject(), isExist: true };

            // 请求Html
            this.model.html = await this.requestHtml();

            // 解析源代码
            this.resolve(this.model.html);

            // 设置状态为刮削完成
            this.model.status = MovieInfoScrapeStatus.SCRAPED;

            // 写日志
            const { messages, html, ...logData } = this.model;
            await this.logger.infoDetail(`刮削完成 等待图片下载压缩`, this.model.code || this.model.originalCode || 'unknown', { data: logData });

        }
        catch (error) {
            // 设置状态为失败
            this.model.status = MovieInfoScrapeStatus.FAILED;
            const errMsg = error instanceof Error ? error.message : error?.toString();
            // 设置消息
            const msg = `【${this.model.code || this.model.originalCode}】刮削失败: ${errMsg}`;
            this.model.messages?.push(msg);
            // 写日志

            const { messages, html, ...logData } = this.model;

            await this.logger.errorDetail(msg, this.model.code || this.model.originalCode || 'unknown', { ex: error, data: logData })
        }
        finally {
            return this.model;
        }
    }

    /**
     * 检查数据
     */
    protected checkData() {
        if (!this.model.code) {
            throw new MovieInfoScrapeException('番号为空', this.SOURCE, this.model);
        }

        if (!this.model.originalCode) {
            throw new MovieInfoScrapeException('原始番号为空', this.SOURCE, this.model);
        }

        if (!this.model.sourceUrl) {
            throw new MovieInfoScrapeException('刮削源URL为空', this.SOURCE, this.model);
        }
    }

    // 请求Html
    protected async requestHtml(): Promise<string> {
        try {
            const axios = await dmmAxiosBuilder();
            const response = await axios.get(this.model.sourceUrl!, {


                headers: dmmDetailAxiosHeaders
            })

            const html: string = response.data;
            if (!html)
                throw new MovieInfoScrapeException('刮削Html的返回结果为空', this.SOURCE, this.model);

            return html;

        }
        catch (err) {
            const msg = err instanceof MovieInfoScrapeException ? err.message : err instanceof Error ? err.message : err?.toString();
            const error = new MovieInfoScrapeException(`请求失败 ${msg}`, this.SOURCE, this.model);
            throw error;
        }
    }

    // 解析源代码
    protected async resolve(html: string) {
        try {
            const $ = load(html);

            // 提取厂牌,狗牌和编号
            const codeFormatter = getDmmCodeFormatter(this.model.originalCode!);
            this.model.codeGroup = codeFormatter.group;
            this.model.groupNumber = codeFormatter.serialNumber;
            if (!this.model.codeGroup || !this.model.groupNumber)
                throw new MovieInfoScrapeException('番号解析失败', this.SOURCE, this.model);


            // 解析标题
            this.model.title = this.model.title || $('h1#title').text().trim();
            if (!this.model.title)
                throw new MovieInfoScrapeException('获取影片名失败', this.SOURCE, this.model);

            this.model.description = await this.getDescription(html);

            // 获取预约数量
            this.model.books = parseInt($('span.tx-count span').text().trim()) || 0;

            // 获取配信开始日期
            const releaseDateStr = this.getDetailRowContent('配信開始日', html).replace('～', '');
            if (releaseDateStr) {
                const date = new Date(releaseDateStr);
                this.model.releaseAt = isNaN(date.getTime()) ? new Date(0) : date;
            } else {
                this.model.releaseAt = new Date(0);
            }

            // 获取商品发壳日期
            const publishDateStr = this.getDetailRowContent('商品発売日', html).replace('～', '');
            if (publishDateStr) {
                const date = new Date(publishDateStr);
                this.model.publishAt = isNaN(date.getTime()) ? new Date(0) : date;
            } else {
                this.model.publishAt = new Date(0);
            }

            // 解析收录时间 Draution
            const durationStr = this.getDetailRowContent('収録時間', html).replace('分', '');
            if (durationStr) {
                const durationSeconds = parseInt(durationStr) * 60;
                this.model.duration = durationSeconds;
            }

            // 解析女优信息
            const actresses = this.model.actress || await this.getActress(html);
            this.model.actress = actresses;

            // 解析监督信息 | 导演
            const directors = this.model.director || await this.getDirectors(html);
            this.model.director = directors;

            // 解析制作商 | Studio メーカー
            const makers = this.model.marker || await this.getMakers(html);
            this.model.marker = makers;

            // 解析发行商(品牌) | レーベル
            const publishers = this.model.publisher || await this.getPublishers(html);
            this.model.publisher = publishers;

            // 解析系列 | シリーズ
            const series = this.model.series || await this.getSeries(html);
            this.model.series = series;

            // 解析封面图片
            const picturesCount = $('img.mg-b6').length;
            this.model.coverUrl = this.model.coverUrl || getDmmCoverUrl(this.model.originalCode!);
            this.model.posterUrl = this.model.posterUrl || getDmmPostUrl(this.model.originalCode!);
            // 没有图片才去添加图片 | 列表页来的图片应该有了
            if (!this.model.pictures || this.model.pictures.length === 0) {
                this.model.pictures = this.model.pictures || getDmmPictures(this.model.id, this.model.originalCode!, picturesCount);

                const coverPicture = getDmmCoverPicture(this.model.id, this.model.originalCode!, this.model.coverUrl);
                const postPicture = getDmmPostPicture(this.model.id, this.model.originalCode!, this.model.posterUrl);

                if (this.model.posterUrl)
                    this.model.pictures.unshift(postPicture);

                if (this.model.coverUrl)
                    this.model.pictures.unshift(coverPicture);
            }


            // 解析标签信息            
            this.model.genres = await this.getGenres(html);

            // 解析其他标签 | 如Dmm的AI关联标签
            this.model.otherGenres = await this.getOtherGenres(html);

            // 解析评论信息            
            this.model.reviewData = await this.getReview(html);


        }
        catch (err) {
            const msg = err instanceof MovieInfoScrapeException ? err.message : err instanceof Error ? err.message : err?.toString();
            const error = new MovieInfoScrapeException(`解析失败 ${msg}`, this.SOURCE, this.model);
            throw error;

        }
    }


    // 获取描述
    private async getDescription(html: string): Promise<string> {
        const logger = getLogger();
        try {
            const $ = load(html);

            // 解析描述
            const descriptionDiv = $('.mg-b20.lh4');
            let result = $('meta[name="description"]').attr('content') || '';
            descriptionDiv.contents().filter(function () {
                return this.nodeType === 3; // 3 是文本节点的类型
            }).first().text().trim() || '';
            result = result.replace('【FANZA(ファンザ)】', '');
            return result;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削描述失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return '';
        }
    }

    // 女优信息
    private async getActress(html: string): Promise<ISourceMovieGeneralModel[]> {
        const logger = getLogger();
        try {
            const results: ISourceMovieGeneralModel[] = [];

            const $ = load(html);
            const actressElements = $('span[id="performer"] a');

            actressElements.each((_, elem) => {
                const href = $(elem).attr('href') || '';
                const actressId = href.match(/actress=(\d+)/)?.[1] || '';
                const name = $(elem).text().trim();

                results.push({
                    id: generateSnowflakeId(),
                    sourceId: actressId,
                    source: MovieInfoScrapeSource.DMM,
                    name: name
                });

            });

            return results;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削女优失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return [];
        }
    }


    // 导演
    private async getDirectors(html: string): Promise<ISourceMovieGeneralModel[]> {
        const logger = getLogger();
        try {
            const results: ISourceMovieGeneralModel[] = [];


            const $ = load(html);
            const directorElements = $('a[data-i3pst="info_director"]');
            directorElements.each((_, elem) => {
                const href = $(elem).attr('href') || '';
                const directorId = href.match(/director=(\d+)/)?.[1] || '';
                const name = $(elem).text().trim();
                if (directorId && name) {
                    results.push({
                        id: generateSnowflakeId(),
                        sourceId: directorId,
                        source: MovieInfoScrapeSource.DMM,
                        name: name
                    });
                }
            });
            return results;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削导演失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return [];

        }
    }

    // 制作商 | Studio メーカー
    private async getMakers(html: string): Promise<ISourceMovieGeneralModel[]> {
        const logger = getLogger();
        try {
            const results: ISourceMovieGeneralModel[] = [];


            const $ = load(html);
            const makerElements = $('a[data-i3pst="info_maker"]');
            makerElements.each((_, elem) => {
                const href = $(elem).attr('href') || '';
                const makerId = href.match(/maker=(\d+)/)?.[1] || '';
                const name = $(elem).text().trim();
                if (makerId && name) {
                    results.push({
                        id: generateSnowflakeId(),
                        sourceId: makerId,
                        source: MovieInfoScrapeSource.DMM,
                        name: name
                    });
                }

            });
            return results;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削制作商失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return [];

        }
    }

    // 发行商(品牌) | レーベル
    private async getPublishers(html: string): Promise<ISourceMovieGeneralModel[]> {
        const logger = getLogger();
        try {

            const results: ISourceMovieGeneralModel[] = [];

            const $ = load(html);
            const makerElements = $('a[data-i3pst="info_label"]');
            makerElements.each((_, elem) => {
                const href = $(elem).attr('href') || '';
                const publisherId = href.match(/label=(\d+)/)?.[1] || '';
                const name = $(elem).text().trim();
                if (publisherId && name) {
                    results.push({
                        id: generateSnowflakeId(),
                        sourceId: publisherId,
                        source: MovieInfoScrapeSource.DMM,
                        name: name
                    });
                }
            });
            return results;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削发行商失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return [];

        }
    }

    private async getSeries(html: string): Promise<ISourceMovieGeneralModel[]> {
        const logger = getLogger();
        try {
            const results: ISourceMovieGeneralModel[] = [];

            const $ = load(html);
            const makerElements = $('a[data-i3pst="info_series"]');
            makerElements.each((_, elem) => {
                const href = $(elem).attr('href') || '';
                const publisherId = href.match(/label=(\d+)/)?.[1] || '';
                const name = $(elem).text().trim();
                if (publisherId && name) {
                    results.push({
                        id: generateSnowflakeId(),
                        sourceId: publisherId,
                        source: MovieInfoScrapeSource.DMM,
                        name: name
                    });
                }
            });
            return results;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削系列失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return [];
        }
    }


    // 标签 

    private async getGenres(html: string): Promise<ISourceMovieGeneralModel[]> {
        const logger = getLogger();
        try {

            const genresHtml = this.getDetailRowHtml('ジャンル', html);

            const $ = load(genresHtml);
            const genres: ISourceMovieGeneralModel[] = [];



            $('a').each((_, elem) => {
                const href = $(elem).attr('href') || '';
                // 从href中提取keyword参数作为ID
                const genreId = href.match(/keyword=(\d+)/)?.[1] || '';
                const name = $(elem).text().trim();

                if (genreId && name) {
                    genres.push({
                        id: generateSnowflakeId(),
                        sourceId: genreId,
                        source: MovieInfoScrapeSource.DMM,
                        name: name
                    });
                }
            });

            return genres;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削标签失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return [];
        }
    }


    // 其他标签 | 如Dmm的AI关联标签
    private async getOtherGenres(html: string): Promise<ISourceMovieGeneralModel[]> {
        const logger = getLogger();
        try {

            const $ = load(html);
            const otherGenres: ISourceMovieGeneralModel[] = [];

            $('ul.related-tags-list li a').each((_, elem) => {
                const name = $(elem).text().trim();
                if (name) {
                    otherGenres.push({
                        id: generateSnowflakeId(),
                        sourceId: '',
                        source: MovieInfoScrapeSource.DMM,
                        name: name
                    });
                }
            });

            return otherGenres;
        }
        catch (err) {
            const message = err instanceof Error ? `刮削其他标签失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return [];
        }
    }




    // 评论
    private async getReview(html: string): Promise<ISourceMovieReviewModel> {
        const logger = getLogger();
        try {

            const $ = load(html);

            // 使用更精确的选择器
            const average = parseFloat($('.d-review__points .d-review__average strong').text().replace('点', '').trim()) || 0;
            const count = parseInt($('.d-review__points .d-review__evaluates strong').text().trim()) || 0;

            return {
                rate: average,
                count: count
            };
        }
        catch (err) {
            const message = err instanceof Error ? `刮削评论失败:${err.message}` : "未知错误";
            await logger.errorDetail(message, this.model.code || this.model.originalCode || 'unknown', {});
            return { rate: 0, count: 0 };
        }
    }


    // 详情页表格内容获取
    // label是Td1的值 如 配信開始日
    // 返回值 是该行的对应值 如 2019/03/3
    private getDetailRowContent(label: string, html: string): string {
        try {
            const $ = load(html);
            const table = $('table.mg-b20');
            const rows = table.find('tr');


            for (const row of rows) {
                const firstTd = $(row).find('td').first();
                const labelText = firstTd.text().trim().replace('：', '');

                if (labelText === label) {
                    const secondTd = $(row).find('td').eq(1);
                    return secondTd.text().trim();
                }
            }
            return '';
        }
        catch (err) {
            return '';
        }
    }

    private getDetailRowHtml(label: string, html: string): string {
        try {
            const $ = load(html);
            const table = $('table.mg-b20');
            const rows = table.find('tr');


            for (const row of rows) {
                const firstTd = $(row).find('td').first();
                const labelText = firstTd.text().trim().replace('：', '');

                if (labelText === label) {
                    const secondTd = $(row).find('td').eq(1);
                    return secondTd.html() || '';
                }
            }
            return '';
        }
        catch (err) {
            return '';
        }
    }


}
