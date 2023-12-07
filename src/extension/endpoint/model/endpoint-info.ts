import type { Keyable, Model } from '../../../interface';
import type { ExtensionType } from '../../extension';

export interface EndpointInfoJson {
    extension: string;
    name: string;
    description?: string;
    cache?: boolean;
    cache_size?: number;
}

export class EndpointInfo implements Keyable, Model<EndpointInfoJson> {
    constructor(
        public extension: string,
        public name: string,
        public description?: string,
        public cache?: boolean,
        public cacheSize?: number,
    ) {}

    static fromJson(json: EndpointInfoJson): EndpointInfo {
        return new EndpointInfo(json.extension, json.name, json.description, json.cache, json.cache_size);
    }

    static create(extensionType: ExtensionType, name: string, description?: string, cache?: boolean, cacheSize?: number): EndpointInfo {
        return new EndpointInfo(extensionType.info.key(), name, description, cache, cacheSize);
    }

    key(): string {
        return `${this.extension}:${this.name}`;
    }

    json(): EndpointInfoJson {
        return {
            extension: this.extension,
            name: this.name,
            description: this.description,
            cache: this.cache,
            cache_size: this.cacheSize,
        };
    }
}
