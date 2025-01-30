import { generateSnowflakeId } from "@d680/shared";
import { getLocalStorageId } from "../../init";
import { dmmCode2dmmDvdCode } from "./utils";
import { ISourceMovieInfoModel, MoviePictureType, PictureScrapeStatus } from "../../model";
import { ISourceMoviePictureModel, ISourceMoviePictureCompressModel } from "../../model/picture";

// Dmm的亚马逊云图片基地址
export const DMM_AWS_PICTURE_BASE_URL = 'https://awsimgsrc.dmm.co.jp/pics_dig/digital/video/';



// Dmm的亚马逊云DVD图片基地址
const DMM_AWS_DVD_PICTURE_BASE_URL = 'https://awsimgsrc.dmm.co.jp/pics_dig/mono/movie/';



// 解析获得Dmm的封面原图
export const getDmmCoverUrl = (dmmCode: string) => {
    const url = `${DMM_AWS_PICTURE_BASE_URL}${dmmCode}/${dmmCode}pl.jpg`;
    return url;
}


// 解析获得Dmm的海报原图
export const getDmmPostUrl = (dmmCode: string) => {
    const url = `${DMM_AWS_PICTURE_BASE_URL}${dmmCode}/${dmmCode}pt.jpg`;
    return url;
}


// 解析获得Dmm的DVD封面原图
export const getDmmDvdCoverUrl = (dmmCode: string) => {
    const dvdCode = dmmCode2dmmDvdCode(dmmCode);
    const url = `${DMM_AWS_DVD_PICTURE_BASE_URL}${dvdCode}/${dvdCode}pl.jpg`;
    return url;
}


// 解析获得Dmm的DVD海报原图
export const getDmmDvdPostUrl = (dmmCode: string) => {
    const dvdCode = dmmCode2dmmDvdCode(dmmCode);
    const url = `${DMM_AWS_DVD_PICTURE_BASE_URL}${dvdCode}/${dvdCode}pt.jpg`;
    return url;
}


// 解析获得Dmm的剧照
export const getDmmPictures = (dmmCode: string, count: number, sourceUrl?: string): ISourceMoviePictureModel[] => {
    const pictures: ISourceMoviePictureModel[] = [];
    for (let i = 1; i <= count; i++) {
        const picture: ISourceMoviePictureModel = {
            id: generateSnowflakeId().toString(),
            storageId: getLocalStorageId(),
            seq: i,
            url: `${DMM_AWS_PICTURE_BASE_URL}${dmmCode}/${dmmCode}jp-${i}.jpg`,
            pictureType: MoviePictureType.剧照,
            status: PictureScrapeStatus.WAITING,
            sourceUrl: sourceUrl ?? '',
            md5: '',
            width: 0,
            height: 0,
            size: 0,
            directoryName: '',
            fileName: '',
            extName: '',
            compressList: []
        }
        pictures.push(picture);
    }
    return pictures;
}

export const getDmmCoverPicture = (dmmCode: string, sourceUrl?: string) => {
    const url = getDmmCoverUrl(dmmCode);
    const picture: ISourceMoviePictureModel = {
        id: generateSnowflakeId().toString(),
        storageId: getLocalStorageId(),
        seq: -2,
        url: url,
        pictureType: MoviePictureType.封面,
        status: PictureScrapeStatus.WAITING,
        sourceUrl: sourceUrl ?? '',
        md5: '',
        width: 0,
        height: 0,
        size: 0,
        directoryName: '',
        fileName: '',
        extName: '',
        compressList: []
    }
    return picture;
}

// 获取Dmm的海报图片
export const getDmmPostPicture = (dmmCode: string, sourceUrl?: string) => {
    const url = getDmmPostUrl(dmmCode);
    const picture: ISourceMoviePictureModel = {
        id: generateSnowflakeId().toString(),
        storageId: getLocalStorageId(),
        seq: -1,
        url: url,
        pictureType: MoviePictureType.海报,
        status: PictureScrapeStatus.WAITING,
        sourceUrl: sourceUrl ?? '',
        md5: '',
        width: 0,
        height: 0,
        size: 0,
        directoryName: '',
        fileName: '',
        extName: '',
        compressList: []
    }
    return picture;
}