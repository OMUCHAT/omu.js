import type { ExtensionType } from 'src/extension/extension';
import type { Keyable, Model } from 'src/interface';

export interface TableInfoJson {
    extension: string;
    name: string;
    description?: string;
    useDatabase?: boolean;
}

export class TableInfo implements Keyable, Model<TableInfoJson> {
    constructor(
        public extension: string,
        public name: string,
        public description?: string,
        public useDatabase?: boolean,
    ) {}

    static fromJson(json: TableInfoJson): TableInfo {
        return new TableInfo(json.extension, json.name, json.description, json.useDatabase);
    }

    static create(extensionType: ExtensionType, name: string, description?: string, useDatabase?: boolean): TableInfo {
        return new TableInfo(extensionType.info.key(), name, description, useDatabase);
    }

    key(): string {
        return `${this.extension}:${this.name}`;
    }

    json(): TableInfoJson {
        return {
            extension: this.extension,
            name: this.name,
            description: this.description,
            useDatabase: this.useDatabase,
        };
    }
}
