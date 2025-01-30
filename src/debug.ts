import { init } from './init';
import { DmmDetailScrape } from './scrapes/dmm/dmm.detail';
import { DmmListScrape } from './scrapes/dmm/dmm.list';
import { DmmScraper } from './scrapes/dmm/dmm.scraper';
import { ProcessPicture } from './services/picture.service';
import { MovieInfoScrapeSource } from './types/movie.enum';

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

        // const item = result[0];
        // if (item && item.pictures)
        //     ProcessPicture(item.code!, item.source, item.pictures![0]);
        // result.map(item => {

        // });
        //console.log(result);
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

testList();


