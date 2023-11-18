import { Client } from "../../client";
import type { Extension, ExtensionType } from "../extension";
import { defineExtensionType } from "../extension";
import { List, ListExtensionType, defineListTypeModel } from "../list";
import { App, AppJson } from "./model/app";

export const ServerExtensionType: ExtensionType<ServerExtension> = defineExtensionType("server", (client: Client) => new ServerExtension(client), () => [ListExtensionType]);

const AppsListKey = defineListTypeModel<App, AppJson>(ServerExtensionType, "apps", (message) => new App(message));

export class ServerExtension implements Extension {
    apps: List<App> | undefined;

    constructor(private readonly client: Client) {
        client.on(this);
    }

    onInitialized(): void {
        const listExtension = this.client.extensions.get(ListExtensionType);
        this.apps = listExtension.register(AppsListKey);
        this.apps.on({
            onItemSet(items) {
                console.log("onItemSet", items);
            },
        })
    }
}
