import { DynamoDBClient, QueryCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ddbClient = new DynamoDBClient();
const snsClient = new SNSClient();

interface ExpiredItem {
  PK: string;
  SK: string;
  timestamp: number;
  value: number;
  description: string;
  buyer: string;
  createdAt: string;
}

export const handler = async (): Promise<void> => {
  console.log('Starting cleanup process at:', new Date().toISOString());
  
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const tableName = process.env.TABLE_NAME;
    const emailTopicArn = process.env.EMAIL_TOPIC_ARN;

    if (!tableName || !emailTopicArn) {
      throw new Error('Missing required environment variables');
    }

    // Query for expired items using the GSI
    const queryParams = {
      TableName: tableName,
      IndexName: 'TimestampIndex',
      KeyConditionExpression: 'GSI1PK = :pk AND #ts <= :currentTime',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':pk': { S: 'INVALID_JSON' },
        ':currentTime': { N: currentTime.toString() }
      }
    };

    console.log('Querying for expired items with params:', JSON.stringify(queryParams, null, 2));

    const queryResult = await ddbClient.send(new QueryCommand(queryParams));
    const expiredItems = queryResult.Items || [];

    console.log(`Found ${expiredItems.length} expired items`);

    if (expiredItems.length === 0) {
      console.log('No expired items found, cleanup complete');
      return;
    }

    // Process each expired item
    for (const item of expiredItems) {
      try {
        const expiredItem: ExpiredItem = {
          PK: item.PK.S!,
          SK: item.SK.S!,
          timestamp: parseInt(item.timestamp.N!),
          value: parseInt(item.value.N!),
          description: item.description.S!,
          buyer: item.buyer.S!,
          createdAt: item.createdAt.S!,
        };

        // Calculate how long the item stayed in the table
        const timeInTable = currentTime - expiredItem.timestamp;
        const timeInTableMinutes = Math.floor(timeInTable / 60);
        const timeInTableHours = Math.floor(timeInTable / 3600);

        console.log(`Processing expired item: ${expiredItem.SK}, time in table: ${timeInTableMinutes} minutes`);

        // Delete the expired item
        await ddbClient.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            PK: { S: expiredItem.PK },
            SK: { S: expiredItem.SK }
          }
        }));

        console.log(`Deleted expired item: ${expiredItem.SK}`);

        // Send email notification about the deletion
        const emailMessage = `
          Expired JSON Object Deleted:
          
          Value: ${expiredItem.value}
          Description: ${expiredItem.description}
          Buyer: ${expiredItem.buyer}
          Created At: ${expiredItem.createdAt}
          Deleted At: ${new Date().toISOString()}
          Time in Table: ${timeInTableMinutes} minutes (${timeInTableHours} hours)
          TTL: 24 hours
        `;

        await snsClient.send(new PublishCommand({
          TopicArn: emailTopicArn,
          Subject: 'Expired JSON Object Deleted',
          Message: emailMessage,
        }));

        console.log(`Email notification sent for deleted item: ${expiredItem.SK}`);

      } catch (itemError) {
        console.error(`Error processing expired item ${item.SK}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    console.log('Cleanup process completed successfully');
    
  } catch (error) {
    console.error('Error during cleanup process:', error);
    throw error;
  }
};
