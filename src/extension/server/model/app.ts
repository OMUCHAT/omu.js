import { Model } from "src/interface/model";

import { Keyable } from "../../../interface/keyable";

export interface AppJson {
    name: string;
    group: string;
    version: string;
    description?: string;
    authors?: string[];
    site_url?: string;
    repository_url?: string;
    image_url?: string;
}

export class App implements Keyable, Model<AppJson> {
    name: string;
    group: string;
    version: string;
    description?: string;
    authors?: string[];
    site_url?: string;
    repository_url?: string;
    image_url?: string;

    constructor(info: AppJson) {
        this.name = info.name;
        this.group = info.group;
        this.version = info.version;
        this.description = info.description;
        this.authors = info.authors;
        this.site_url = info.site_url;
        this.repository_url = info.repository_url;
        this.image_url = info.image_url;
    }

    key(): string {
        return `${this.group}/${this.name}`;
    }

    json(): AppJson {
        return {
            name: this.name,
            group: this.group,
            version: this.version,
            description: this.description,
            authors: this.authors,
            site_url: this.site_url,
            repository_url: this.repository_url,
            image_url: this.image_url,
        }
    }

    toString(): string {
        return `${this.group}/${this.name} v${this.version}`;
    }
}