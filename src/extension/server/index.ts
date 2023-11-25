import { type Client } from "../../client/client";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";
import { defineListTypeModel, ListExtensionType } from "../list";
import { type List } from "../list/list";

import { App, type AppJson } from "./model";
export * from "./model";


export const ServerExtensionType: ExtensionType<ServerExtension> = defineExtensionType("server", (client: Client) => new ServerExtension(client), () => [ListExtensionType]);

const AppsListKey = defineListTypeModel<App, AppJson>(ServerExtensionType, "apps", (message) => new App(message));

export class ServerExtension implements Extension {
    apps: List<App> | undefined;

    constructor(private readonly client: Client) {
        client.addListener(this);
    }

    onInitialized(): void {
        const listExtension = this.client.extensions.get(ListExtensionType);
        this.apps = listExtension.register(AppsListKey);
    }
}
