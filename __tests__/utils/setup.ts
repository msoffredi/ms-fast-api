import dynamoose from 'dynamoose';
import { clearAllTables } from './dynamodb-utils';

beforeAll(async () => {
    dynamoose.aws.sdk.config.update({
        accessKeyId: 'fakeMyKeyId',
        secretAccessKey: 'fakeSecretAccessKey',
        region: 'local-env',
        sslEnabled: false,
    });

    dynamoose.aws.ddb.local('http://localhost:8001');

    if (!process.env.DEBUG) {
        global.console.log = jest.fn();
        global.console.error = jest.fn();
    }
});

beforeEach(async () => {
    await clearAllTables(dynamoose.aws.ddb());
});
