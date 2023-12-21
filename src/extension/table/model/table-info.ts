import type { Keyable, Model } from '../../../interface';
import type { ExtensionType } from '../../extension';

export interface TableInfoJson {
    owner: string;
    name: string;
    description?: string;
}

export class TableInfo implements Keyable, Model<TableInfoJson> {
    public owner: string;
    public name: string;
    public description?: string;
    constructor({
        owner,
        name,
        description,
    }: {
        owner: string;
        name: string;
        description?: string;
        useDatabase?: boolean;
        cache?: boolean;
        cacheSize?: number;
    }) {
        this.owner = owner;
        this.name = name;
        this.description = description;
    }

    static fromJson(json: TableInfoJson): TableInfo {
        return new TableInfo(json);
    }

    static ofExtension(extensionType: ExtensionType, name: string, description?: string): TableInfo {
        return new TableInfo({
            owner: extensionType.info.key(),
            name,
            description,
        });
    }

    key(): string {
        return `${this.owner}:${this.name}`;
    }

    json(): TableInfoJson {
        return {
            owner: this.owner,
            name: this.name,
            description: this.description,
        };
    }
}
