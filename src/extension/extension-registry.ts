import type { Client } from '../client';

import type { Extension, ExtensionType } from './extension';

export interface ExtensionRegistry {
    register<T extends Extension>(type: ExtensionType<T>): T;
    registerAll(types: ExtensionType[]): void;
    get<T extends Extension>(type: ExtensionType<T>): T;
    has<T extends Extension>(type: ExtensionType<T>): boolean;
}

export function createExtensionRegistry(client: Client): ExtensionRegistry {
    const extensionMap: Map<string, Extension> = new Map();

    function register<T extends Extension>(type: ExtensionType<T>): T {
        if (has(type)) {
            throw new Error(`Extension type ${type.info.key()} already registered`);
        }
        type.dependencies?.().forEach((dependency) => {
            if (!has(dependency)) {
                throw new Error(`Extension type ${type.info.key()} depends on ${dependency.info.key()} which is not registered`);
            }
        });
        const extension = type.create(client);
        extensionMap.set(type.info.key(), extension);
        return extension;
    }

    function registerAll(types: ExtensionType[]): void {
        types.forEach((type) => register(type));
    }

    function get<Ext extends Extension>(extensionType: ExtensionType<Ext>): Ext {
        const extension = extensionMap.get(extensionType.info.key());
        if (!extension) {
            throw new Error(`Extension type ${extensionType.info.key()} not registered`);
        }
        return extension as Ext;
    }

    function has<T extends Extension>(extensionType: ExtensionType<T>): boolean {
        return extensionMap.has(extensionType.info.key());
    }

    return {
        register,
        registerAll: registerAll,
        get,
        has,
    };
}
