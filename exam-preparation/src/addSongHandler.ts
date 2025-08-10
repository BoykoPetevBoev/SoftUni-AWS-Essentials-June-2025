import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import * as uuid from 'uuid';
import { CreateScheduleCommand, SchedulerClient } from '@aws-sdk/client-scheduler';

const ddbClient = new DynamoDBClient();

const schedulerClient = new SchedulerClient();

export interface ArtistTitle {
    id: string;
    artist: string;
    title: string;
}

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log(JSON.stringify(event));

    const tableName = process.env.TABLE_NAME;

    const { title, artist, status, playAt, coverImage } = JSON.parse(event.body || '{}');

    const song = {
        id: uuid.v4(),
        title,
        artist,
        status,
        playAt,
        coverImage,
    }

    await ddbClient.send(new PutItemCommand({
        TableName: tableName,
        Item: {
            PK: { S: `SONG#${song.id}` },
            SK: { S: `METADATA#${song.id}` },
            title: { S: song.title },
            artist: { S: song.artist },
            status: { S: song.status },
            coverImage: { S: song.coverImage },
            playAt: { S: song.playAt },
        },
    }));

    const isoTime = new Date(song.playAt).toISOString();
    const result = await schedulerClient.send(new CreateScheduleCommand({
        Name: `Play-${song.title}`,
        ScheduleExpression: `at(${isoTime})`,
        Target: {
            Arn: '',
            Input: JSON.stringify({
                id: song.id,
                artist: song.artist,
                title: song.title

            }),
            RoleArn: ''
        },
        FlexibleTimeWindow: {
            Mode: 'OFF'
        }
    }))
    console.log(result)

    return {
        statusCode: 200,
        body: JSON.stringify(song),
    }
}