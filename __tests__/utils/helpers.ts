import { APIGatewayProxyEvent } from 'aws-lambda';
import dynamoose from 'dynamoose';
import { AnyDocument } from 'dynamoose/dist/Document';
import jwt from 'jsonwebtoken';

export const testUserEmail = 'test@test.com';
export const testUserId = 'user123';

const defaultEntity = {
    id: 'id123',
    testField: 'testValue',
};

export const addEntity = async (
    entity = defaultEntity,
): Promise<AnyDocument> => {
    const model = dynamoose.model(
        'test',
        new dynamoose.Schema(
            {
                id: {
                    type: String,
                    hashKey: true,
                },
                testField: String,
                deletedAt: Date,
            },
            {
                timestamps: true,
            },
        ),
    );

    return await model.create(entity);
};

export function constructAPIGwEvent(
    message: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: Record<string, any> = {},
): APIGatewayProxyEvent {
    return {
        httpMethod: options.method || 'GET',
        path: options.path || '/',
        queryStringParameters: options.query || {},
        headers: options.headers || {},
        body: options.rawBody || JSON.stringify(message),
        multiValueHeaders: {},
        multiValueQueryStringParameters: {},
        isBase64Encoded: false,
        pathParameters: options.pathParameters || {},
        stageVariables: options.stageVariables || {},
        requestContext: options.requestContext || {},
        resource: options.resource || '',
    };
}

export const constructAuthenticatedAPIGwEvent = (
    message: unknown,
    options: Record<string, unknown>,
    userEmail = testUserEmail,
    userPermissions = [['*', '*']],
    userId = testUserId,
): APIGatewayProxyEvent => {
    const token = jwt.sign(
        {
            email: userEmail,
            userPermissions: JSON.stringify(userPermissions),
            'custom:userId': userId,
        },
        'test',
    );

    const event = constructAPIGwEvent(message, options);

    event.headers = {
        ...event.headers,
        Authorization: `Bearer ${token}`,
    };

    return event;
};
