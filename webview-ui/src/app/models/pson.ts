export interface PsonProperty {
    name: string;
    type: string;
    comment: string;
    value: string;
}

export interface PsonRelation {
    name: string;
    id: string;
    source: string;
    target: string;
}

export interface PsonFile {
    name: string;
    id: string;
    class: string;
    properties: PsonProperty[];
    relations: PsonRelation[] | null;
}