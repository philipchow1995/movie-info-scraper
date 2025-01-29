import { MovieInfoScrapeSource } from "../model";

export class MovieInfoScrapeException extends Error {
    public source: MovieInfoScrapeSource;
    public data: any;
    constructor(message: string, source: MovieInfoScrapeSource, data: any) {
        super(message);
        this.name = source;
        this.source = source;
        this.data = data;
    }
}
