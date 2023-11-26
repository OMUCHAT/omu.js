import { Model } from "src/interface";


export type ContentJson = TextContentJson | ImageContentJson;
export type Content = TextContent | ImageContent;


export interface ContentComponentJson<T extends string = string> {
    type: T;
    siblings?: ContentJson[];
}

export class ContentComponent implements Model<ContentComponentJson> {
    protected constructor(
        public type: string,
        public siblings?: Content[]
    ) {}

    static fromJson(info: ContentJson): Content {
        switch (info.type) {
        case "text":
            return new TextContent(info.text, info.siblings?.map(s => ContentComponent.fromJson(s)));
        case "image":
            return new ImageContent(info.url, info.id, info.siblings?.map(s => ContentComponent.fromJson(s)));
        default:
            throw new Error(`Unknown content json: ${info}`);
        }
    }

    json(): ContentComponentJson {
        return {
            type: this.type,
            siblings: this.siblings?.map(s => s.json())
        };
    }
}

export interface TextContentJson extends ContentComponentJson<"text"> {
    text: string;
}

export class TextContent extends ContentComponent implements Model<TextContentJson> {
    constructor(
        public text: string,
        siblings?: Content[]
    ) {
        super("text", siblings);
    }

    static fromJson(info: TextContentJson): TextContent {
        return new TextContent(info.text, info.siblings?.map(s => ContentComponent.fromJson(s)));
    }

    static of(text: string): TextContent {
        return new TextContent(text);
    }

    json(): TextContentJson {
        return {
            type: "text",
            text: this.text,
            siblings: this.siblings?.map(s => s.json())
        };
    }
}

export interface ImageContentJson extends ContentComponentJson<"image"> {
    url: string;
    id: string;
}

export class ImageContent extends ContentComponent implements Model<ImageContentJson> {
    constructor(
        public url: string,
        public id: string,
        siblings?: Content[]
    ) {
        super("image", siblings);
    }

    static fromJson(info: ImageContentJson): ImageContent {
        return new ImageContent(info.url, info.id, info.siblings?.map(s => ContentComponent.fromJson(s)));
    }

    static of(url: string, id: string): ImageContent {
        return new ImageContent(url, id);
    }

    json(): ImageContentJson {
        return {
            type: "image",
            url: this.url,
            id: this.id,
            siblings: this.siblings?.map(s => s.json())
        };
    }
}