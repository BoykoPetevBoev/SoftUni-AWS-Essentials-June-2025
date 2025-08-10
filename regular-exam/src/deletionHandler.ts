import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient();

export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing DynamoDB stream event:', JSON.stringify(event));

  for (const record of event.Records) {
    if (record.eventName === 'REMOVE') {
      await processDeletion(record);
    }
  }
};

async function processDeletion(record: DynamoDBRecord) {
  try {
    const oldImage = record.dynamodb?.OldImage;
    if (!oldImage) {
      console.log('No old image found for deletion record');
      return;
    }

    // Extract the creation timestamp
    const createdAt = parseInt(oldImage.createdAt?.N || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    const durationInSeconds = currentTime - createdAt;
    const durationInHours = Math.floor(durationInSeconds / 3600);
    const durationInMinutes = Math.floor((durationInSeconds % 3600) / 60);

    // Extract other item details
    const description = oldImage.description?.S || 'Unknown';
    const buyer = oldImage.buyer?.S || 'Unknown';
    const value = oldImage.value?.N || '0';

    const message = `
Item has been automatically deleted from the table.

Item Details:
- Description: ${description}
- Buyer: ${buyer}
- Value: ${value}
- Created at: ${new Date(createdAt * 1000).toISOString()}
- Deleted at: ${new Date(currentTime * 1000).toISOString()}
- Duration in table: ${durationInHours} hours, ${durationInMinutes} minutes (${durationInSeconds} seconds)

This item was automatically removed due to TTL expiration (24 hours).
    `.trim();

    const topicArn = process.env.TOPIC_ARN;
    if (!topicArn) {
      console.error('TOPIC_ARN environment variable not set');
      return;
    }

    await snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Subject: 'Item Automatically Deleted from DynamoDB Table',
      Message: message,
    }));

    console.log(`Email sent for deleted item. Duration: ${durationInHours}h ${durationInMinutes}m`);
  } catch (error) {
    console.error('Error processing deletion:', error);
  }
}
