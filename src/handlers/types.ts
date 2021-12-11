import {
    AuthPermission,
    EventBusTypes,
    ResponseBody,
    Serializers,
} from '@jmsoffredi/ms-common';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { SchemaDefinition, TimestampObject } from 'dynamoose/dist/Schema';

export interface SchemaSettings {
    timestamps?: boolean | TimestampObject;
    saveUnknown?: boolean | string[];
}

export interface Endpoint {
    resource: string;
    method: string;
    apiEntityName: string;
    collection?: true;
    healthcheck?: true;
    pkName: string;
}

export interface EventDefinition {
    type: string;
    dataProperties: string[];
}

interface OperationDefinition {
    events?: EventDefinition[];
}

export interface APIDefinition {
    get?: {
        collection?: boolean;
        entity?: boolean;
        auth?: AuthPermission | AuthPermission[];
    };
    delete?: {
        entity: OperationDefinition;
    };
    post?: {
        collection: OperationDefinition;
    };
}

export enum ValidationType {
    Unique = 'unique',
}

export interface APIEntity {
    schema: SchemaDefinition;
    api: APIDefinition;
    validations?: {
        [key: string]: ValidationType[] | ValidationType;
    };
    timestamps?: boolean | TimestampObject;
    saveUnknown?: boolean | string[];
    dbName?: string;
    serializers?: Serializers[];
    path?: string;
    softDelete?: boolean;
    eventSource?: string;
    eventBusType: EventBusTypes;
    healthcheck?: boolean;
}

export interface API {
    [apiName: string]: APIEntity;
}

export type OperationHandler = (
    apiConfig: API,
    event: APIGatewayProxyEvent,
    endpoint: Endpoint,
) => Promise<ResponseBody>;
