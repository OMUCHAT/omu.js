import type { Client } from '../../client';
import type { ConnectionListener } from '../../connection';
import { JsonEventType } from '../../event';
import { JsonEndpointType } from '../endpoint/endpoint';
import type { Extension } from '../extension';
import { defineExtensionType } from '../extension';
import { ExtensionInfo } from '../server/model/extension-info';

export const RegistryExtensionType = defineExtensionType({
    info: ExtensionInfo.create('registry'),
    create: (client: Client) => new RegistryExtension(client),
});
export const RegistryUpdateEvent = JsonEventType.ofExtension<{ key: string, value: any }>({
    extension: RegistryExtensionType,
    name: 'update',
});
export const RegistryListenEvent = JsonEventType.ofExtension<string>({
    extension: RegistryExtensionType,
    name: 'listen',
});
export const RegistryGetEndpoint = JsonEndpointType.ofExtension<string, any>({
    extension: RegistryExtensionType,
    name: 'get',
});

type Key = { name: string, app?: string };

export class RegistryExtension implements Extension, ConnectionListener {
    private readonly listenKeys: Set<string> = new Set();

    constructor(private readonly client: Client) {
        client.events.register(RegistryUpdateEvent);
        client.connection.addListener(this);
    }

    async get<T>(key: Key): Promise<T> {
        return await this.client.endpoints.invoke(
            RegistryGetEndpoint,
            `${key.app ?? this.client.app.key()}:${key.name}`,
        ) as T;
    }

    set<T>(key: Key, value: T): void {
        this.client.send(RegistryUpdateEvent, {
            key: `${key.app ?? this.client.app.key()}:${key.name}`,
            value,
        });
    }

    listen<T>(key: Key, handler: (value: T) => void): () => void {
        const keyString = `${key.app ?? this.client.app.key()}:${key.name}`;
        this.listenKeys.add(keyString);
        const listener = (event: { key: string; value: any; }): void => {
            if (event.key === keyString) {
                handler(event.value);
            }
        };
        this.client.events.addListener(RegistryUpdateEvent, listener);
        return () => {
            this.client.events.removeListener(RegistryUpdateEvent, listener);
        };
    }

    onConnect(): void {
        this.listenKeys.forEach((key) => {
            this.client.send(RegistryListenEvent, key);
        });
    }
}
