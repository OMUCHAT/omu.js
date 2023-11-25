import { Client } from "../client";
import { ConnectionListener } from "../connection";

import { Extension, ExtensionType } from "./extension";

export interface ExtensionRegistry extends ConnectionListener {
    register(...extensionType: ExtensionType[]): void;
    get<T extends Extension>(type: ExtensionType<T>): T;
    has<T extends Extension>(type: ExtensionType<T>): boolean;
}

export function createExtensionRegistry(client: Client): ExtensionRegistry {
    const extensionMap: Record<string, Extension> = {};

    function register(...extensionType: ExtensionType<Extension>[]): void {
        extensionType.forEach((type) => {
            if (has(type)) {
                throw new Error(`Extension type ${type.key} already registered`);
            }
            type.dependencies().forEach((dependency) => {
                if (!has(dependency)) {
                    throw new Error(`Extension type ${type.key} depends on ${dependency.key} which is not registered`);
                }
            });
            extensionMap[type.key] = type.create(client);
        });
    }

    function has<T extends Extension>(extensionType: ExtensionType<T>): boolean {
        return !!extensionMap[extensionType.key];
    }

    function get<T extends Extension>(extensionType: ExtensionType<T>): T {
        const extension = extensionMap[extensionType.key];
        if (!extension) {
            throw new Error(`No extension for type ${extensionType.key}`);
        }
        return extension as T;
    }

    return {
        register,
        get,
        has,
    };
}