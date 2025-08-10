import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import * as uuid from 'uuid';

const snsClient = new SNSClient();
const ddbClient = new DynamoDBClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event))

  const topicArn = process.env.TOPIC_ARN;
  const tableName = process.env.TABLE_NAME;

  const data =  JSON.parse(event.body)

  if (data.valid) {
    await snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Subject: 'Regular Exam',
      Message: JSON.stringify(data),
    }));
  } else {
    const isoTime = new Date().toISOString();
    const uuidData = uuid.v4()
    
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    const createdAt = Math.floor(Date.now() / 1000);
    
    await ddbClient.send(new PutItemCommand({
      TableName: tableName,
      Item: {
          PK: { S: `EXAM#${uuidData}` },
          SK: { S: `METADATA#${uuidData}` },
          valid: { BOOL: data.valid },
          value: { N: data.value.toString() },
          description: { S: data.description },
          buyer: { S: data.buyer },
          TTL: { N: ttl.toString() },
          createdAt: { N: createdAt.toString() },
      },
  }));
  }


  return {
    statusCode: 200,
    body: JSON.stringify(data),
  }
};
