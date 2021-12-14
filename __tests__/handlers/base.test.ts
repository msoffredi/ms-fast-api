import {
    addEntity,
    constructAuthenticatedAPIGwEvent,
    testUserEmail,
} from '../utils/helpers';
import { APIHandler } from '../../src/handlers/base';
import { API } from '../../src/handlers/types';
import { EventBusTypes } from '@jmsoffredi/ms-common';

const api: API = {
    entities: {
        schema: {
            id: {
                type: String,
                hashKey: true,
            },
            testField: String,
        },
        api: {
            get: {
                entity: true,
                collection: true,
                auth: {
                    moduleId: 'test-module',
                    operationId: 'test-operation',
                },
                authSelf: true,
            },
        },
        timestamps: true,
        dbName: 'test',
        path: '/entities',
        softDelete: true,
        eventSource: 'test-source',
        eventBusType: EventBusTypes.AWSEventBridge,
    },
};

it('returns a list of entities on GET with proper API config', async () => {
    await addEntity();

    const event = constructAuthenticatedAPIGwEvent(
        {},
        {
            method: 'GET',
            resource: '/entities',
        },
    );

    const result = await APIHandler(api, event);
    expect(result.statusCode).toEqual(200);
});

it('throws a 401 error if an endpoint is hit without enough permissions', async () => {
    await addEntity();

    const event = constructAuthenticatedAPIGwEvent(
        {},
        {
            method: 'GET',
            resource: '/entities',
        },
        testUserEmail,
        [['wrong-module', 'wrong-operation']],
    );
    const result = await APIHandler(api, event);
    expect(result.statusCode).toEqual(401);
});

it('gets a 200 and data an endpoint is hit with enough permissions', async () => {
    await addEntity();

    const event = constructAuthenticatedAPIGwEvent(
        {},
        {
            method: 'GET',
            resource: '/entities',
        },
        testUserEmail,
        [['test-module', 'test-operation']],
    );
    const result = await APIHandler(api, event);
    expect(result.statusCode).toEqual(200);
});

it('returns user when getting own entity with API confirgured accordingly', async () => {
    const entity = await addEntity();

    const event = constructAuthenticatedAPIGwEvent(
        {},
        {
            method: 'GET',
            resource: '/entities/{id}',
            pathParameters: { id: entity.id },
        },
        testUserEmail,
        [['wrong-module', 'wrong-operation']],
        entity.id,
    );
    const result = await APIHandler(api, event);
    expect(result.statusCode).toEqual(200);
});
