import type { Client } from '../../client';
import { JsonEndpointType } from '../endpoint/endpoint';
import { defineExtensionType, type Extension, type ExtensionType } from '../extension';
import { ModelTableType, TableExtensionType, type Table } from '../table';

import { App } from './model';
import { ExtensionInfo } from './model/extension-info';

export const ServerExtensionType: ExtensionType<ServerExtension> = defineExtensionType({
    info: ExtensionInfo.create('server'),
    create: (client: Client) => new ServerExtension(client),
    dependencies: () => [TableExtensionType],
});

const AppsTableKey = ModelTableType.ofExtension(ServerExtensionType, {
    name: 'apps',
    model: App,
});
const ExtensionsTableType = ModelTableType.ofExtension(ServerExtensionType, {
    name: 'extensions',
    model: ExtensionInfo,
});
const ShutdownEndpointType = JsonEndpointType.ofExtension<boolean, boolean>(ServerExtensionType, {
    name: 'shutdown',
});

export class ServerExtension implements Extension {
    apps: Table<App>;
    extensions: Table<ExtensionInfo>;

    constructor(private readonly client: Client) {
        const listExtension = client.extensions.get(TableExtensionType);
        this.apps = listExtension.get(AppsTableKey);
        this.extensions = listExtension.get(ExtensionsTableType);
    }

    shutdown(restart?: boolean): Promise<boolean> {
        return this.client.endpoints.invoke(ShutdownEndpointType, restart ?? false);
    }
}
