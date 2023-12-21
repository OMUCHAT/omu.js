import type { Keyable, Model } from '../../../interface';

export interface ExtensionInfoJson {
    name: string;
    description?: string;
}

export class ExtensionInfo implements Keyable, Model<ExtensionInfoJson> {
    constructor(
        public name: string,
        public description?: string,
    ) {}

    static fromJson(json: ExtensionInfoJson): ExtensionInfo {
        return new ExtensionInfo(json.name, json.description);
    }

    static create(name: string, description?: string): ExtensionInfo {
        return new ExtensionInfo(name, description);
    }

    key(): string {
        return this.name;
    }

    json(): ExtensionInfoJson {
        return {
            name: this.name,
            description: this.description,
        };
    }
}
