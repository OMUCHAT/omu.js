import type { ExtensionType } from 'src/extension/extension';
import type { Keyable, Model } from 'src/interface';

export interface TableInfoJson {
    extension: string;
    name: string;
    description?: string;
    use_database?: boolean;
    cache?: boolean;
    cache_size?: number;
}

export class TableInfo implements Keyable, Model<TableInfoJson> {
    public extension: string;
    public name: string;
    public description?: string;
    public useDatabase?: boolean;
    public cache?: boolean;
    public cacheSize?: number;
    constructor({
        extension,
        name,
        description,
        useDatabase,
        cache,
        cacheSize,
    }: {
        extension: string;
        name: string;
        description?: string;
        useDatabase?: boolean;
        cache?: boolean;
        cacheSize?: number;
    }) {
        this.extension = extension;
        this.name = name;
        this.description = description;
        this.useDatabase = useDatabase;
        this.cache = cache;
        this.cacheSize = cacheSize;
    }

    static fromJson(json: TableInfoJson): TableInfo {
        return new TableInfo(json);
    }

    static create(extensionType: ExtensionType, name: string, description?: string, useDatabase?: boolean, cache?: boolean, cacheSize?: number): TableInfo {
        return new TableInfo({
            extension: extensionType.info.key(),
            name,
            description,
            useDatabase,
            cache,
            cacheSize,
        });
    }

    setCache(cacheSize?: number): TableInfo {
        return new TableInfo({
            extension: this.extension,
            name: this.name,
            description: this.description,
            useDatabase: this.useDatabase,
            cache: true,
            cacheSize,
        });
    }

    setUseDatabase(useDatabase: boolean): TableInfo {
        return new TableInfo({
            extension: this.extension,
            name: this.name,
            description: this.description,
            useDatabase,
            cache: this.cache,
            cacheSize: this.cacheSize,
        });
    }

    key(): string {
        return `${this.extension}:${this.name}`;
    }

    json(): TableInfoJson {
        return {
            extension: this.extension,
            name: this.name,
            description: this.description,
            use_database: this.useDatabase,
            cache: this.cache,
            cache_size: this.cacheSize,
        };
    }
}
