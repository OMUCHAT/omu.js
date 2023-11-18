export interface ContentComponent {
    type: string;
    siblings: Content[];
}

export interface TextContent extends ContentComponent {
    type: "text";
    text: string;
}

export interface ImageContent extends ContentComponent {
    type: "image";
    url: string;
}

export type Content = TextContent | ImageContent;