import type { Keyable, Model } from 'src/interface';

export interface RoomJson {
    id: string;
    provider_id: string;
    channel_id?: string;
    name?: string;
    description?: string;
    online: boolean;
    url: string;
    image_url?: string;
    viewers?: number;
}

export class Room implements Keyable, Model<RoomJson> {
    id: string;
    provider_id: string;
    channel_id?: string;
    name?: string;
    description?: string;
    online: boolean;
    url: string;
    image_url?: string;
    viewers?: number;

    constructor(json: RoomJson) {
        this.id = json.id;
        this.provider_id = json.provider_id;
        this.channel_id = json.channel_id;
        this.name = json.name;
        this.description = json.description;
        this.online = json.online;
        this.url = json.url;
        this.image_url = json.image_url;
        this.viewers = json.viewers;
    }

    static fromJson(json: RoomJson): Room {
        return new Room(json);
    }

    key(): string {
        return `${this.id}@${this.provider_id}`;
    }

    json(): RoomJson {
        return {
            id: this.id,
            provider_id: this.provider_id,
            channel_id: this.channel_id,
            name: this.name,
            description: this.description,
            online: this.online,
            url: this.url,
            image_url: this.image_url,
            viewers: this.viewers,
        };
    }
}
