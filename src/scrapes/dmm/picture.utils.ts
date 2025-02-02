import { generateSnowflakeId } from "@d680/shared";
import { getLocalStorageId } from "../../init";
import { dmmCode2dmmDvdCode } from "./utils";
import { IPictureModel, IPictureCompressModel, PictureTargetType, PictureStatus, MoviePictureType } from "../../database/picture.model";


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
export const getDmmPictures = (targetId: bigint, dmmCode: string, count: number, sourceUrl?: string): IPictureModel[] => {
    const pictures: IPictureModel[] = [];

    for (let i = 1; i <= count; i++) {
        const picture: IPictureModel = {
            id: generateSnowflakeId(),
            storageId: getLocalStorageId(),
            seq: i,
            url: `${DMM_AWS_PICTURE_BASE_URL}${dmmCode}/${dmmCode}jp-${i}.jpg`,
            pictureType: MoviePictureType.剧照,
            status: PictureStatus.WAITING,
            sourceUrl: sourceUrl ?? '',
            md5: '',
            width: 0,
            height: 0,
            size: 0,

            directoryName: '',
            fileName: '',
            extName: '',
            compressList: [],
            targetType: PictureTargetType.MOVIE,
            targetId: targetId
        }
        pictures.push(picture);
    }


    return pictures;
}

export const getDmmCoverPicture = (targetId: bigint, dmmCode: string, sourceUrl?: string) => {
    const url = getDmmCoverUrl(dmmCode);
    const picture: IPictureModel = {
        id: generateSnowflakeId(),
        storageId: getLocalStorageId(),
        seq: -2,
        url: url,
        pictureType: MoviePictureType.封面,
        status: PictureStatus.WAITING,

        sourceUrl: sourceUrl ?? '',
        md5: '',
        width: 0,
        height: 0,
        size: 0,
        directoryName: '',
        fileName: '',
        extName: '',
        compressList: [],
        targetType: PictureTargetType.MOVIE,
        targetId: targetId
    }
    return picture;
}



// 获取Dmm的海报图片
export const getDmmPostPicture = (targetId: bigint, dmmCode: string, sourceUrl?: string) => {
    const url = getDmmPostUrl(dmmCode);
    const picture: IPictureModel = {
        id: generateSnowflakeId(),
        storageId: getLocalStorageId(),
        seq: -1,
        url: url,
        pictureType: MoviePictureType.海报,
        status: PictureStatus.WAITING,
        sourceUrl: sourceUrl ?? '',
        md5: '',
        width: 0,
        height: 0,

        size: 0,
        directoryName: '',
        fileName: '',
        extName: '',
        compressList: [],
        targetType: PictureTargetType.MOVIE,
        targetId: targetId
    }
    return picture;
}