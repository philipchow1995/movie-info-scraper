import { MoviePictureType, generateSnowflakeId } from '@d680/shared';
import { init } from './init';
import { DmmDetailScrape } from './scrapes/dmm/dmm.detail';
import { DmmListScrape } from './scrapes/dmm/dmm.list';
import { DmmScraper } from './scrapes/dmm/dmm.scraper';
import { ProcessPicture } from './services/picture.service';
import { MovieInfoScrapeSource } from './types/movie.enum';
import { PictureRepository, IPictureModel, PictureStatus, getDefaultPictureModel, PictureTargetType } from './database/picture.model';
import { SourceMovieInfoRepository } from './database/source.movie.model';
import { getLocalStorageId } from './init';


const testDetail = async () => {
    try {
        await init();
        const dmmCode = 'natr00689';
        const dmmDetailScrape = await DmmDetailScrape.initByDmmCode(dmmCode);
        const result = await dmmDetailScrape.scrapeDetail();
        console.log(result);

    }
    catch (err) {
        console.error(err);
    }
}

const testList = async () => {
    try {
        await init();
        const dmmScraper = await DmmScraper.init();
        await dmmScraper.search('母と息子の密着交尾');
        console.log('ok');
    }
    catch (err) {
        console.error(err);
    }
}

const testDay = async () => {
    try {
        await init();
        const dmmScraper = new DmmScraper();
        const result = await dmmScraper.getDay(new Date());
        console.log(result);
    }
    catch (err) {
        console.error(err);
    }
}

const testPicture = async () => {
    try {
        await init();
        const tempData: IPictureModel = {
            ...getDefaultPictureModel(),
            targetId: BigInt(1),
            url: 'https://pics.dmm.co.jp/digital/video/h_086nuka00073/h_086nuka00073pl.jpg',
            pictureType: MoviePictureType.剧照,
            seq: 1,

            status: PictureStatus.WAITING,
        }


        const tempDownload = await ProcessPicture('natr00689', MovieInfoScrapeSource.DMM, tempData);
        const tempSave = await PictureRepository.create(tempDownload);
        tempSave.save();
        console.log(tempDownload);

    }
    catch (err) {
        console.error(err);
    }
}

testList();
// testPicture();


