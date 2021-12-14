import {
    AuthPermission,
    BadRequestError,
    CustomError,
    ResponseBody,
    routeAuthorizer,
} from '@jmsoffredi/ms-common';
import {
    APIGatewayEvent,
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from 'aws-lambda';
import { createEntity } from './operations/add-one';
import { deleteEntity } from './operations/delete-one';
import { getCollection } from './operations/get-collection';
import { getEntity } from './operations/get-one';
import { healthcheck } from './operations/healthcheck';
import {
    API,
    APIDefinition,
    APIEntity,
    Endpoint,
    OperationHandler,
} from './types';

export const APIHandler = async (
    apiConfig: API,
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    let status = 200;
    let body: ResponseBody = null;
    const { resource, httpMethod } = event;

    try {
        const endpoints = allowedEndpoints(apiConfig).filter((endpoint) => {
            return (
                resource === endpoint.resource &&
                httpMethod.toLowerCase() === endpoint.method
            );
        });

        if (endpoints.length === 1) {
            switch (httpMethod) {
                case 'GET':
                    if (endpoints[0].collection) {
                        body = await authorizedEndpoint(
                            apiConfig,
                            endpoints[0],
                            event,
                            getCollection,
                        );
                    } else if (!endpoints[0].healthcheck) {
                        body = await authorizedEndpoint(
                            apiConfig,
                            endpoints[0],
                            event,
                            getEntity,
                        );
                    } else {
                        body = await healthcheck();
                    }

                    break;

                case 'DELETE':
                    body = await authorizedEndpoint(
                        apiConfig,
                        endpoints[0],
                        event,
                        deleteEntity,
                    );
                    break;

                case 'POST':
                    body = await authorizedEndpoint(
                        apiConfig,
                        endpoints[0],
                        event,
                        createEntity,
                    );
                    break;
            }
        } else {
            throw new BadRequestError();
        }
    } catch (err) {
        console.error(err);

        if (err instanceof CustomError) {
            status = err.statusCode;
            body = err.serializeErrors();
        }
    }

    return {
        statusCode: status,
        body: JSON.stringify(body),
    };
};

const allowedEndpoints = (apiConfig: API): Endpoint[] => {
    const endpoints: Endpoint[] = [];

    for (const apiName in apiConfig) {
        let path = `/${apiName}`;

        if (apiConfig[apiName].healthcheck) {
            endpoints.push({
                apiEntityName: apiName,
                pkName: '',
                method: 'get',
                resource: `/${apiName}`,
                healthcheck: true,
            });
        } else {
            const pkName = getAPIPkName(apiConfig[apiName]);

            if ('path' in apiConfig[apiName]) {
                path = String(apiConfig[apiName].path);
            }

            for (const methodName in apiConfig[apiName].api) {
                const endpointTemplate = {
                    method: methodName,
                    apiEntityName: apiName,
                    pkName: pkName,
                };

                const method = JSON.parse(
                    JSON.stringify(
                        apiConfig[apiName].api[
                            methodName as keyof APIDefinition
                        ],
                    ),
                );

                if (method.collection) {
                    endpoints.push({
                        ...endpointTemplate,
                        resource: path,
                        collection: true,
                    });
                }

                if (method.entity) {
                    endpoints.push({
                        ...endpointTemplate,
                        resource: `${path}/{${pkName}}`,
                    });
                }
            }
        }
    }

    return endpoints;
};

const getAPIPkName = (api: APIEntity): string => {
    for (const propName in api.schema) {
        const prop = JSON.parse(JSON.stringify(api.schema[propName]));

        if (prop.hashKey === true) {
            return propName;
        }
    }

    throw new Error(`No hashKey available in the API entity`);
};

const authorizedEndpoint = async (
    apiConfig: API,
    endpoint: Endpoint,
    event: APIGatewayEvent,
    callback: OperationHandler,
) => {
    const methodDefinition =
        apiConfig[endpoint.apiEntityName].api[
            endpoint.method as keyof APIDefinition
        ];

    let auth: AuthPermission[] = [];

    if (
        methodDefinition &&
        'auth' in methodDefinition &&
        methodDefinition.auth !== undefined
    ) {
        if (Array.isArray(methodDefinition['auth'])) {
            auth = methodDefinition['auth'];
        } else {
            auth.push(methodDefinition['auth']);
        }
    }

    const authSelf =
        methodDefinition &&
        'authSelf' in methodDefinition &&
        methodDefinition.authSelf !== undefined
            ? methodDefinition.authSelf
            : false;

    return methodDefinition &&
        'auth' in methodDefinition &&
        methodDefinition.auth !== undefined
        ? await routeAuthorizer(
              event,
              async (event: APIGatewayProxyEvent): Promise<ResponseBody> => {
                  return await callback(apiConfig, event, endpoint);
              },
              auth,
              authSelf,
          )
        : await callback(apiConfig, event, endpoint);
};
