import { Client } from "../client";

import { Extension, ExtensionType } from "./extension";

export interface ExtensionRegistry {
    register(...types: ExtensionType[]): void;
    get<T extends Extension>(type: ExtensionType<T>): T;
    has<T extends Extension>(type: ExtensionType<T>): boolean;
}

export function createExtensionRegistry(client: Client): ExtensionRegistry {
    const extensionMap: Map<string, Extension> = new Map();

    function register(...types: ExtensionType<Extension>[]): void {
        types.forEach((type) => {
            if (has(type)) {
                throw new Error(`Extension type ${type.key} already registered`);
            }
            type.dependencies().forEach((dependency) => {
                if (!has(dependency)) {
                    throw new Error(`Extension type ${type.key} depends on ${dependency.key} which is not registered`);
                }
            });
            extensionMap.set(type.key, type.create(client));
        });
    }

    function get<Ext extends Extension>(extensionType: ExtensionType<Ext>): Ext {
        const extension = extensionMap.get(extensionType.key);
        if (!extension) {
            throw new Error(`Extension type ${extensionType.key} not registered`);
        }
        return extension as Ext;
    }

    function has<T extends Extension>(extensionType: ExtensionType<T>): boolean {
        return extensionMap.has(extensionType.key);
    }

    return {
        register,
        get,
        has,
    };
}