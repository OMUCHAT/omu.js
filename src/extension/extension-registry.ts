import { ConnectionListener } from "../connection/connection";

import { Extension, ExtensionType } from "./extension";

export interface ExtensionRegistry extends ConnectionListener {
    register(...extensionType: ExtensionType[]): void;
    get<T extends Extension>(type: ExtensionType<T>): T;
}
