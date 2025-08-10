import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event))

  const topicArn = process.env.TOPIC_ARN;
  const data = event.body

  await snsClient.send(new PublishCommand({
    TopicArn: topicArn,
    Subject: 'Regular Exam',
    Message: data,
  }));

  return {
    statusCode: 200,
    body: data,
  }
};
