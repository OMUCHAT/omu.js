import { Keyable, Model } from "src/interface";

export interface ProviderJson {
    id: string;
    url: string;
    name: string;
    image_url?: string;
    description: string;
    regex: string;
}

export class Provider implements Keyable, Model<ProviderJson> {
    id: string;
    url: string;
    name: string;
    image_url?: string;
    description: string;
    regex: string;

    constructor(json: ProviderJson) {
        this.id = json.id;
        this.url = json.url;
        this.name = json.name;
        this.image_url = json.image_url;
        this.description = json.description;
        this.regex = json.regex;
    }

    key(): string {
        return this.id;
    }

    json(): ProviderJson {
        return {
            id: this.id,
            url: this.url,
            name: this.name,
            image_url: this.image_url,
            description: this.description,
            regex: this.regex,
        };
    }
}