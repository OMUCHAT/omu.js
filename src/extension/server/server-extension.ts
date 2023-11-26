import { ClientListener, type Client } from "../../client";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";
import { TableExtensionType, defineTableTypeModel, type Table } from "../table";

import { App, type AppJson } from "./model";


export const ServerExtensionType: ExtensionType<ServerExtension> = defineExtensionType("server", (client: Client) => new ServerExtension(client), () => [TableExtensionType]);

const AppsTableKey = defineTableTypeModel<App, AppJson>(ServerExtensionType, "apps", (data) => new App(data));

export class ServerExtension implements Extension, ClientListener {
    apps: Table<App>;

    constructor(client: Client) {
        client.addListener(this);
        const listExtension = client.extensions.get(TableExtensionType);
        this.apps = listExtension.register(AppsTableKey);
    }

    onInitialized(): void {
    }
}
