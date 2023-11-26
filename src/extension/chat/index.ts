import { Client, ClientListener } from "../../client";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";
import { TableExtensionType, defineListTypeModel, type Table, type TableExtension } from "../table";

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
export * from "./model";


export const ChatExtensionType: ExtensionType<ChatExtension> = defineExtensionType("chat", (client: Client) => new ChatExtension(client), () => [TableExtensionType]);
const MessagesListKey = defineListTypeModel<Message, MessageJson>(ChatExtensionType, "messages", (json) => Message.fromJson(json));
const ChannelsListKey = defineListTypeModel<Channel, ChannelJson>(ChatExtensionType, "channels", (json) => new Channel(json));
const ProvidersListKey = defineListTypeModel<Provider, ProviderJson>(ChatExtensionType, "providers", (json) => new Provider(json));
const RoomsListKey = defineListTypeModel<Room, RoomJson>(ChatExtensionType, "rooms", (json) => new Room(json));

export class ChatExtension implements Extension, ClientListener {
    listExtension: TableExtension | undefined;
    messages: Table<Message> | undefined;
    channels: Table<Channel> | undefined;
    providers: Table<Provider> | undefined;
    rooms: Table<Room> | undefined;

    constructor(private readonly client: Client) {
        client.addListener(this);
    }

    onInitialized(): void {
        this.listExtension = this.client.extensions.get(TableExtensionType);
        this.messages = this.listExtension!.register(MessagesListKey);
        this.channels = this.listExtension!.register(ChannelsListKey);
        this.providers = this.listExtension!.register(ProvidersListKey);
        this.rooms = this.listExtension!.register(RoomsListKey);
    }
}
