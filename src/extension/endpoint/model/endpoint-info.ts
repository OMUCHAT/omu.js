import type { Keyable, Model } from '../../../interface';
import type { ExtensionType } from '../../extension';

export interface EndpointInfoJson {
    app: string;
    name: string;
    description?: string;
}

export class EndpointInfo implements Keyable, Model<EndpointInfoJson> {
    constructor(
        public app: string,
        public name: string,
        public description?: string,
    ) {}

    static fromJson(json: EndpointInfoJson): EndpointInfo {
        return new EndpointInfo(json.app, json.name, json.description);
    }

    static create(extensionType: ExtensionType, name: string, description?: string): EndpointInfo {
        return new EndpointInfo(extensionType.info.key(), name, description);
    }

    key(): string {
        return `${this.app}:${this.name}`;
    }

    json(): EndpointInfoJson {
        return {
            app: this.app,
            name: this.name,
            description: this.description,
        };
    }
}
