import { Client, ClientListener } from "../../client";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";
import { ListExtensionType, defineListTypeModel, type List, type ListExtension } from "../list";
import {
    Author,
    Gift,
    Message,
    Paid,
    Role,
    type AuthorJson,
    type Content,
    type ContentComponent,
    type GiftJson,
    type ImageContent,
    type MessageJson,
    type PaidJson,
    type RoleJson,
    type TextContent,
} from "./model";
export { Author, AuthorJson, Content, ContentComponent, Gift, GiftJson, ImageContent, Message, MessageJson, Paid, PaidJson, Role, RoleJson, TextContent };


export const ChatExtensionType: ExtensionType<ChatExtension> = defineExtensionType("chat", (client: Client) => new ChatExtension(client), () => [ListExtensionType]);
const MessagesListKey = defineListTypeModel<Message, MessageJson>(ChatExtensionType, "messages", (message) => new Message(message));


export class ChatExtension implements Extension, ClientListener {
    listExtension: ListExtension | undefined;
    messages: List<Message> | undefined;

    constructor(private readonly client: Client) {
        client.on(this);
    }

    onInitialized(): void {
        this.listExtension = this.client.extensions.get(ListExtensionType);
        this.messages = this.listExtension!.register(MessagesListKey);
    }
}
