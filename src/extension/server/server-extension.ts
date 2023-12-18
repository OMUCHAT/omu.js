import type { Client, ClientListener } from '../../client';
import { Serializer } from '../../interface/serializable';
import { defineExtensionType, type Extension, type ExtensionType } from '../extension';
import { ModelTableType, TableExtensionType, type Table } from '../table';
import { TableInfo } from '../table/model/table-info';

import { App, type AppJson } from './model';
import type { ExtensionInfoJson } from './model/extension-info';
import { ExtensionInfo } from './model/extension-info';

export const ServerExtensionType: ExtensionType<ServerExtension> = defineExtensionType(ExtensionInfo.create('server'), (client: Client) => new ServerExtension(client), () => [TableExtensionType]);

const AppsTableKey = new ModelTableType<App, AppJson>(TableInfo.create(ServerExtensionType, 'apps'), Serializer.model(App.fromJson));
const ExtensionsTableType = new ModelTableType<ExtensionInfo, ExtensionInfoJson>(TableInfo.create(ServerExtensionType, 'extensions'), Serializer.model(ExtensionInfo.fromJson));

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
