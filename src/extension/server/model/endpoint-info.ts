import type { ExtensionType } from 'src/extension/extension';
import type { Keyable, Model } from 'src/interface';

export interface EndpointInfoJson {
    extension: string;
    name: string;
    description?: string;
}

export class EndpointInfo implements Keyable, Model<EndpointInfoJson> {
    constructor(
        public extension: string,
        public name: string,
        public description?: string,
    ) {}

    static fromJson(json: EndpointInfoJson): EndpointInfo {
        return new EndpointInfo(json.extension, json.name, json.description);
    }

    static create(extensionType: ExtensionType, name: string, description?: string): EndpointInfo {
        return new EndpointInfo(extensionType.info.key(), name, description);
    }

    key(): string {
        return `${this.extension}:${this.name}`;
    }

    json(): EndpointInfoJson {
        return {
            extension: this.extension,
            name: this.name,
            description: this.description,
        };
    }
}
