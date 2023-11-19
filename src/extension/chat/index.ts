import { Client, ClientListener } from "../../client";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";
import { ListExtensionType, defineListTypeModel, type List, type ListExtension } from "../list";

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


export const ChatExtensionType: ExtensionType<ChatExtension> = defineExtensionType("chat", (client: Client) => new ChatExtension(client), () => [ListExtensionType]);
const MessagesListKey = defineListTypeModel<Message, MessageJson>(ChatExtensionType, "messages", (json) => Message.fromJson(json));
const ChannelsListKey = defineListTypeModel<Channel, ChannelJson>(ChatExtensionType, "channels", (json) => new Channel(json));
const ProvidersListKey = defineListTypeModel<Provider, ProviderJson>(ChatExtensionType, "providers", (json) => new Provider(json));
const RoomsListKey = defineListTypeModel<Room, RoomJson>(ChatExtensionType, "rooms", (json) => new Room(json));

export class ChatExtension implements Extension, ClientListener {
    listExtension: ListExtension | undefined;
    messages: List<Message> | undefined;
    channels: List<Channel> | undefined;
    providers: List<Provider> | undefined;
    rooms: List<Room> | undefined;

    constructor(private readonly client: Client) {
        client.on(this);
    }

    onInitialized(): void {
        this.listExtension = this.client.extensions.get(ListExtensionType);
        this.messages = this.listExtension!.register(MessagesListKey);
        this.channels = this.listExtension!.register(ChannelsListKey);
        this.providers = this.listExtension!.register(ProvidersListKey);
        this.rooms = this.listExtension!.register(RoomsListKey);
    }
}
