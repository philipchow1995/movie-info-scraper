/**
 * 影片信息刮削源
 */
export enum MovieInfoScrapeSource {
    人工输入 = "INPUT",
    DMM = "DMM",
    DMM_DVD = "DMM_DVD",
    JAV_DB = "JAV_DB",
    JAV_BUS = "JAV_BUS",
    FALENO = "FALENO",
    DAHLIA = "DAHLIA",
    蚊香社 = "PRESTING",
    妄想族 = "MOUSOUZOKU",
    S1 = "S1",
    MOODYZ = "MOODYZ",
    IDEAPOCKET = "IDEAPOCKET",
    MADONNA = "MADONNA",
    OTHER = "OTHER",
    UNKNOWN = "UNKNOWN"
}

/**
 * 刮削状态
 */
export enum MovieInfoScrapeStatus {
    // 等待刮削
    WAITING = "WAITING",
    // 进行中
    PROCESSING = "PROCESSING",
    // 刮削完成 | 等待图片下载
    SCRAPED = "SCRAPED",
    // 图片下载中
    PICTURES_DOWNLOADING = "PICTURES_DOWNLOADING",
    // 部分完成
    PARTIAL_DONE = "PARTIAL_DONE",
    // 全部完成
    COMPLETED = "COMPLETED",
    // 错误
    ERROR = "ERROR",
    // 失败
    FAILED = "FAILED",
    // 未知
    UNKNOWN = "UNKNOWN"
}

