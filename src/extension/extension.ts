import { type Client } from '../client/index.js';

import type { ExtensionInfo } from './server/model/extension-info.js';

export interface Extension {
}

export interface ExtensionType<T extends Extension = Extension> {
    readonly key: string;
    readonly info: ExtensionInfo;
    create: (client: Client) => T;
    dependencies?: () => ExtensionType[];
}

export function defineExtensionType<T extends Extension>({
    info,
    create,
    dependencies,
}: {
    info: ExtensionInfo;
    create: (client: Client) => T;
    dependencies?: () => ExtensionType[];
}): ExtensionType<T> {
    return {
        key: info.key(),
        info,
        create,
        dependencies,
    };
}
