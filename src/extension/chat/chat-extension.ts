import type { Client, ClientListener } from '../../client';
import { Serializer } from '../../interface/serializable';
import { defineExtensionType, type Extension, type ExtensionType } from '../extension';
import { ExtensionInfo } from '../server/model/extension-info';
import { ModelTableType, TableExtensionType, type Table } from '../table';
import { TableInfo } from '../table/model/table-info';

import type {
    ChannelJson,
    MessageJson,
    ProviderJson,
    RoomJson,
} from './model';
import {
    Channel,
    Message,
    Provider,
    Room,
} from './model';

export const ChatExtensionType: ExtensionType<ChatExtension> = defineExtensionType(ExtensionInfo.create('chat'), (client: Client) => new ChatExtension(client), () => [TableExtensionType]);
const MessagesTableKey = new ModelTableType<Message, MessageJson>(TableInfo.create(ChatExtensionType, 'messages'), Serializer.model(Message.fromJson));
const ChannelsTableKey = new ModelTableType<Channel, ChannelJson>(TableInfo.create(ChatExtensionType, 'channels'), Serializer.model(Channel.fromJson));
const ProvidersTableKey = new ModelTableType<Provider, ProviderJson>(TableInfo.create(ChatExtensionType, 'providers'), Serializer.model(Provider.fromJson));
const RoomsTableKey = new ModelTableType<Room, RoomJson>(TableInfo.create(ChatExtensionType, 'rooms'), Serializer.model(Room.fromJson));

export class ChatExtension implements Extension, ClientListener {
    messages: Table<Message>;
    channels: Table<Channel>;
    providers: Table<Provider>;
    rooms: Table<Room>;

    constructor(client: Client) {
        client.addListener(this);
        const tables = client.extensions.get(TableExtensionType);
        this.messages = tables.register(MessagesTableKey);
        this.channels = tables.register(ChannelsTableKey);
        this.providers = tables.register(ProvidersTableKey);
        this.rooms = tables.register(RoomsTableKey);
    }

    onInitialized(): void {
    }
}
