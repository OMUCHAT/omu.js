import type { Client, ClientListener } from '../../client';
import { defineExtensionType, type Extension, type ExtensionType } from '../extension';
import { ModelTableType, TableExtensionType, type Table } from '../table';

import { App } from './model';
import { ExtensionInfo } from './model/extension-info';

export const ServerExtensionType: ExtensionType<ServerExtension> = defineExtensionType({
    info: ExtensionInfo.create('server'),
    create: (client: Client) => new ServerExtension(client),
    dependencies: () => [TableExtensionType],
});

const AppsTableKey = ModelTableType.ofExtension({
    extension: ServerExtensionType,
    name: 'apps',
    model: App,
});
const ExtensionsTableType = ModelTableType.ofExtension({
    extension: ServerExtensionType,
    name: 'extensions',
    model: ExtensionInfo,
});

export class ServerExtension implements Extension, ClientListener {
    apps: Table<App>;
    extensions: Table<ExtensionInfo>;

    constructor(client: Client) {
        client.addListener(this);
        const listExtension = client.extensions.get(TableExtensionType);
        this.apps = listExtension.get(AppsTableKey);
        this.extensions = listExtension.get(ExtensionsTableType);
    }

    onInitialized(): void {
    }
}
