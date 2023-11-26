import { Client, ClientListener } from "../../client";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";
import { TableExtensionType, defineTableTypeModel, type Table } from "../table";

import {
    Channel,
    Message,
    Provider,
    ProviderJson,
    Room,
    RoomJson,
    type ChannelJson,
    type MessageJson
} from "./model";


export const ChatExtensionType: ExtensionType<ChatExtension> = defineExtensionType("chat", (client: Client) => new ChatExtension(client), () => [TableExtensionType]);
const MessagesTableKey = defineTableTypeModel<Message, MessageJson>(ChatExtensionType, "messages", (json) => Message.fromJson(json));
const ChannelsTableKey = defineTableTypeModel<Channel, ChannelJson>(ChatExtensionType, "channels", (json) => new Channel(json));
const ProvidersTableKey = defineTableTypeModel<Provider, ProviderJson>(ChatExtensionType, "providers", (json) => new Provider(json));
const RoomsTableKey = defineTableTypeModel<Room, RoomJson>(ChatExtensionType, "rooms", (json) => new Room(json));

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
