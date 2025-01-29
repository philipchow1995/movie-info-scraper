import { IBasePageQuery } from "@d680/shared";
import { gql } from 'graphql-tag';

/*
    Dmm 刮削查询条件构造
*/

/**
 * 影片形式
 */
export enum DmmContentType {
  // 全部
  ALL = 'ALL',
  // 2D
  TWO_DIMENSION = 'TWO_DIMENSION',
  // VR
  VR = 'VR',
}

/**
* 发行类型 (配信开始日)
* 对应graphql
*  filter: {
*      legacyReleaseStatus
*  }
*/
export enum DmmReleaseType {
  // 全部
  ALL = 'ALL',
  // 准新作
  SEMI_NEW_RELEASE = 'SEMI_NEW_RELEASE',
  // 最新作
  LATEST_RELEASE = 'LATEST_RELEASE',
  // 预购作
  PRE_ORDER = 'PRE_ORDER',
}

/**
* 排序类型
*/
export enum DmmSortType {
  // 人气顺
  SALES_RANK_SCORE = 'SALES_RANK_SCORE',
  // 壳上本顺 | 销量
  SALES_COUNT = 'SALES_COUNT',
  // 配信日顺
  DELIVERY_START_DATE = 'DELIVERY_START_DATE',
  // 发壳日顺
  RELEASE_DATE = 'RELEASE_DATE',
  // 评论顺
  REVIEW_RANK_SCORE = 'REVIEW_RANK_SCORE',
  // 收藏顺
  BOOKMARK_COUNT = 'BOOKMARK_COUNT',
  // 价格顺 | 低到高
  LOWEST_PRICE = 'LOWEST_PRICE'
}

/*
  Dmm 列表查询条件接口
*/
export interface IDmmQuery extends IBasePageQuery {
  // 最大页数 | 0 不限制
  maxPage: number;
  // 内容类型 2D| VR
  contentType?: DmmContentType;
  // 排序类型
  sort?: DmmSortType;
  // 发行类型
  releaseType?: DmmReleaseType;
  // 指定日
  deliveryStartDate?: Date;
  // 搜索词
  searchStr?: string;
  // 发行商 | publisher レーベル
  labelId?: number;
  // 制作商 | maker メーカー
  makerId?: number;
  // 监督 | director 导演 
  directorId?: number;
  // 女优 | actress 女优
  actressId?: number;
  // 系列 | series 系列 シリーズ
  seriesId?: number;
  // 标签 | genre ジャンル
  genreId?: number;

}

// 默认Dmm列表查询条件
export const DEFAULT_DMM_QUERY: IDmmQuery = {
  maxPage: 0,
  contentType: DmmContentType.TWO_DIMENSION,
  sort: DmmSortType.REVIEW_RANK_SCORE,
  releaseType: DmmReleaseType.ALL,
  searchStr: '',
  labelId: 0,
  makerId: 0,
  directorId: 0,
  actressId: 0,
  seriesId: 0,
  genreId: 0,
  page: 1,
  perPage: 120
}

/**
 * Dmm的Graphql的筛选条件Ids组合格式
 */
export interface IGraphqlIdGroup {
  ids: IGraphqlId[],
  op: 'AND'
}

/**
 * Dmm的Graphql的筛选条件Id格式
 */
export interface IGraphqlId {
  id: string;
}

/**
 * Dmm的Graphql的影片信息
 */
export interface IGraphqlMovie {
  // 番号 | dmm番号 1namh00027 h_237nacr00905 这样的
  id: string,
  // 标题
  title: string,
  // 发行状态
  releaseStatus: DmmReleaseType,
  // 女优
  actresses: IGraphqlActress[],
  // 收藏数
  bookmarkCount: number,
  // 配信开始时间
  deliveryStartAt: Date,
  // 是否独占配信
  isExclusiveDelivery: boolean,
  // 是否在售
  isOnSale: boolean,
  // 封面及海报图
  packageImage: IGraphqlMoviePackageImage,
  // 剧照
  sampleImages: IGraphqlMovieImage[],
  // 样片
  sampleMovie: IGraphqlMovieSample,
  // 评论分数
  review: IGraphqlMovieReview,
  // 制作组
  maker: IGraphqlMaker,
}

/**
 * Dmm的Graphql的女优信息
 */
export interface IGraphqlActress {
  id: string,
  imageUrl: string,
  name: string,
  nameRuby: string,
  contentsCount: number
}

/**
 * Dmm的Graphql的影片标签信息
 */
export interface IGraphqlGrene {
  id: number,
  name: string
}

/**
 * Dmm的Graphql的系列Series信息
 */
export interface IGraphqlSeries {
  id: number,
  name: string,
  description: string
}

/**
 * Dmm的Graphql的导演Director信息
 */
export interface IGraphqlDirector {
  id: number,
  name: string,
}

/**
 * Dmm的Graphql的制作组Maker信息 | Studio メーカー
 */
export interface IGraphqlMaker {
  id: number,
  name: string,
  isExclusive: boolean,
  description: string,
  imageUrl: string,
}

/**
 * Dmm的Graphql的发行商Label信息
 */
export interface IGraphqlLabel {
  id: number,
  name: string,
  brandId: string,
}

/**
 * Dmm的Graphql的发行商Brand信息
 */
export interface IGraphqlBrand {
  id: string,
  name: string,
  comment?: string,
  siteDescription: string,
  siteTitle: string,
  makerLogoUrl?: string,
  monoSectionUrl: string,
}

/**
 * Dmm的Graphql的影片封面图片信息 | 封面 海取
 */
export interface IGraphqlMoviePackageImage {
  largeUrl: string,
  mediumUrl: string
}

/**
 * Dmm的Graphql的影片图片 | 影图
 */
export interface IGraphqlMovieImage {
  number: number,
  largeUrl: string,
}

/**
 * Dmm的Graphql的影片样片信息 | サンプル
 */
export interface IGraphqlMovieSample {
  hlsUrl: string,
  mp4Url: string,
  vrUrl: string
}

/**
 * Dmm的Graphql的影片评论分数
 */
export interface IGraphqlMovieReview {
  // 平均分
  average: number,
  // 评论数量
  count: number
}

export interface IGraphqlMovieSalesInfo {

}


/**
 * Dmm Graphql 查询 构造
 */
export const AV_SEARCH_QUERY = gql`
query AvSearch($limit: Int!, $offset: Int, $floor: PPVFloor, $sort: ContentSearchPPVSort!, $query: SearchQueryInput, $filter: ContentSearchPPVFilterInput, $facetLimit: Int!, $hasFacet: Boolean!, $hasGenreDescription: Boolean!, $genreId: ID!, $legacyProductType: LegacyProductType = DOWNLOAD, $hasLegacyProductType: Boolean!, $isLoggedIn: Boolean!, $excludeUndelivered: Boolean!, $shouldFetchGenreRelatedWords: Boolean!, $shouldFetchDirectorRelatedWords: Boolean!, $shouldFetchLabelRelatedWords: Boolean!, $shouldFetchSeriesRelatedWords: Boolean!, $shouldFetchActressRelatedWords: Boolean!, $shouldFetchMakerRelatedWords: Boolean!, $shouldFetchHistrionRelatedWords: Boolean!) {
  legacySearchPPV(
    limit: $limit
    offset: $offset
    floor: $floor
    sort: $sort
    query: $query
    filter: $filter
    facetLimit: $facetLimit
    includeExplicit: true
    excludeUndelivered: $excludeUndelivered
  ) {
    result {
      contents {
        ...searchContent
        contentType
        actresses {
          id
          name
          __typename
        }
        maker {
          id
          name
          __typename
        }
        __typename
      }
      facet @include(if: $hasFacet) {
        ...contentSearchFacet
        __typename
      }
      pageInfo {
        ...paginationFragment
        __typename
      }
      isNoIndex
      __typename
    }
    searchCriteria {
      ...contentSearchCriteria
      __typename
    }
    __typename
  }
  genre(floor: AV, id: $genreId) @include(if: $hasGenreDescription) {
    name
    description
    __typename
  }
}

fragment searchContent on PPVContentSearchContent {
  id
  title
  packageImage {
    mediumUrl
    largeUrl
    __typename
  }
  sampleImages {
    number
    largeUrl
    __typename
  }
  sampleMovie {
    hlsUrl
    mp4Url
    vrUrl
    __typename
  }
  releaseStatus
  review {
    average
    count
    __typename
  }
  isExclusiveDelivery
  bookmarkCount
  salesInfo {
    lowestPrice {
      productId
      price
      discountPrice
      legacyProductType
      __typename
    }
    priceByLegacyProductType(legacyProductType: $legacyProductType) @include(if: $hasLegacyProductType) {
      discountPrice
      price
      legacyProductType
      __typename
    }
    campaign {
      name
      endAt
      __typename
    }
    hasMultiplePrices
    __typename
  }
  isOnSale
  deliveryStartAt
  utilization @include(if: $isLoggedIn) {
    status
    isTVODRentalPlayable
    __typename
  }
  __typename
}

fragment contentSearchFacet on PPVContentSearchFacet {
  floor {
    items {
      floor
      count
      __typename
    }
    __typename
  }
  actress {
    items {
      id
      name
      count
      __typename
    }
    __typename
  }
  maker {
    items {
      id
      name
      count
      __typename
    }
    __typename
  }
  label {
    items {
      id
      name
      count
      __typename
    }
    __typename
  }
  series {
    items {
      id
      name
      count
      __typename
    }
    __typename
  }
  genreAndCampaignCombined {
    items {
      ... on GenreFacetItem {
        count
        id
        name
        __typename
      }
      ... on CampaignFacetItem {
        count
        id
        name
        __typename
      }
      __typename
    }
    __typename
  }
  __typename
}

fragment paginationFragment on OffsetPageInfoWithTotal {
  offset
  limit
  hasNext
  totalCount
  __typename
}

fragment contentSearchCriteria on PPVContentSearchCriteria {
  filter {
    actressIds {
      ids {
        id
        name
        nameRuby
        relatedWords @include(if: $shouldFetchActressRelatedWords)
        __typename
      }
      op
      __typename
    }
    authorIds {
      ids {
        id
        name
        nameRuby
        __typename
      }
      op
      __typename
    }
    directorIds {
      ids {
        id
        name
        nameRuby
        relatedWords @include(if: $shouldFetchDirectorRelatedWords)
        __typename
      }
      op
      __typename
    }
    genreIds {
      ids {
        id
        name
        relatedWords @include(if: $shouldFetchGenreRelatedWords)
        __typename
      }
      op
      __typename
    }
    histrionIds {
      ids {
        id
        name
        nameRuby
        relatedWords @include(if: $shouldFetchHistrionRelatedWords)
        __typename
      }
      op
      __typename
    }
    labelIds {
      ids {
        id
        name
        relatedWords @include(if: $shouldFetchLabelRelatedWords)
        __typename
      }
      op
      __typename
    }
    makerIds {
      ids {
        id
        name
        relatedWords @include(if: $shouldFetchMakerRelatedWords)
        __typename
      }
      op
      __typename
    }
    seriesIds {
      ids {
        id
        name
        relatedWords @include(if: $shouldFetchSeriesRelatedWords)
        __typename
      }
      op
      __typename
    }
    campaignIds {
      ids {
        id
        name
        __typename
      }
      op
      __typename
    }
    __typename
  }
  __typename
}`;

export const DEFAULT_VARIABLES = {
  excludeUndelivered: false,
  facetLimit: 100,
  filter: {
    contentType: "TWO_DIMENSION"
  },
  floor: "AV",
  genreId: "",
  hasFacet: false,
  hasGenreDescription: false,
  hasLegacyProductType: false,
  isLoggedIn: false,
  limit: 120,
  offset: 0,
  shouldFetchActressRelatedWords: false,
  shouldFetchDirectorRelatedWords: false,
  shouldFetchGenreRelatedWords: false,
  shouldFetchHistrionRelatedWords: false,
  shouldFetchLabelRelatedWords: false,
  shouldFetchMakerRelatedWords: false,
  shouldFetchSeriesRelatedWords: false,
  sort: "RELEASE_DATE"
} as const;
