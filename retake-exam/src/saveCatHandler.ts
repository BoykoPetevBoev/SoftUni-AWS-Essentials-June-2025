import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import * as uuid from 'uuid';

const snsClient = new SNSClient();
const ddbClient = new DynamoDBClient();

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Credentials': 'true',
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log(JSON.stringify(event));

        const topicArn = process.env.TOPIC_ARN;
        const tableName = process.env.TABLE_NAME;

        if (!topicArn || !tableName) {
            throw new Error('Missing required environment variables: TOPIC_ARN or TABLE_NAME');
        }

        const data = JSON.parse(event.body || '{}');

        if (!data.catId || !data.savedUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: catId and savedUrl' }),
                headers,
            };
        }

        const uuidData = uuid.v4();

        await ddbClient.send(new PutItemCommand({
            TableName: tableName,
            Item: {
                PK: { S: 'FAVORITE_CAT' },
                SK: { S: 'METADATA' },
                uuid: { S: uuidData },
                catId: { S: data.catId },
                savedUrl: { S: data.savedUrl },
                savedAt: { S: new Date().toISOString() },
            },
        }));

        await snsClient.send(new PublishCommand({
            TopicArn: topicArn,
            Subject: '🐱 New Favorite Cat Saved!',
            Message: `🎉 Lydia has a new favorite cat!

            🐈 Cat ID: ${data.catId}
            🔗 Image URL: ${data.savedUrl}
            ⏰ Saved at: ${new Date().toISOString()}
            
            View the cat: ${data.savedUrl}
            
            This cat is now saved as Lydia's favorite! 🎊`,
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Cat saved successfully',
                catId: data.catId,
                savedUrl: data.savedUrl,
                uuid: uuidData
            })
        };

    } catch (error) {
        console.error('Error in saveCatHandler:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: errorMessage })
        };
    }
};