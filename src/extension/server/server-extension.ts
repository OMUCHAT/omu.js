import { ClientListener, type Client } from "../../client";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";
import { TableExtensionType, defineListTypeModel, type Table } from "../table";

import { App, type AppJson } from "./model";


export const ServerExtensionType: ExtensionType<ServerExtension> = defineExtensionType("server", (client: Client) => new ServerExtension(client), () => [TableExtensionType]);

const AppsListKey = defineListTypeModel<App, AppJson>(ServerExtensionType, "apps", (message) => new App(message));

export class ServerExtension implements Extension, ClientListener {
    apps: Table<App> | undefined;

    constructor(private readonly client: Client) {
        client.addListener(this);
    }

    onInitialized(): void {
        const listExtension = this.client.extensions.get(TableExtensionType);
        this.apps = listExtension.register(AppsListKey);
    }
}
