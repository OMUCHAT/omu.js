import { Keyable } from "src/interface/keyable";
import { Model } from "src/interface/model";

export interface ChannelJson {
    provider_id: string;
    id: string;
    url: string;
    name: string;
    description: string;
    active: boolean;
    icon_url: string;
    created_at: number;
}


export class Channel implements Keyable, Model<ChannelJson> {
    provider_id: string;
    id: string;
    url: string;
    name: string;
    description: string;
    active: boolean;
    icon_url: string;
    created_at: number;

    constructor(json: ChannelJson) {
        this.provider_id = json.provider_id;
        this.id = json.id;
        this.url = json.url;
        this.name = json.name;
        this.description = json.description;
        this.active = json.active;
        this.icon_url = json.icon_url;
        this.created_at = json.created_at;
    }

    key(): string {
        return this.url;
    }

    json(): ChannelJson {
        return {
            provider_id: this.provider_id,
            id: this.id,
            url: this.url,
            name: this.name,
            description: this.description,
            active: this.active,
            icon_url: this.icon_url,
            created_at: this.created_at,
        };
    }
}