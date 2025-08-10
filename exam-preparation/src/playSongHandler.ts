import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { EventBridgeEvent } from 'aws-lambda';
import { ArtistTitle } from '../src/addSongHandler'
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';


const ddbClient = new DynamoDBClient();
const snsClient = new SNSClient();

export const handler = async (event: EventBridgeEvent<string, ArtistTitle>) => {
    console.log(JSON.stringify(event));

    const topicArn = process.env.TOPIC_ARN;
    const tableName = process.env.TABLE_NAME

    const { id, artist, title } = event.detail

    await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: 'Song Played',
        Message: `It is time to play ${title} by ${artist}`,
    }));


    ddbClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: {
            PK: {
                S: `SONG#${id}`
            },
            SK: {
                S: `METADATA${id}`
            }
        },
        UpdateExpression: "SET #s = :played",
        ExpressionAttributeNames: {
            '#s': "status"
        },
        ExpressionAttributeValues: {
            ':played': {
                S: "played"
            }
        }
    }))

    return {

    }
}