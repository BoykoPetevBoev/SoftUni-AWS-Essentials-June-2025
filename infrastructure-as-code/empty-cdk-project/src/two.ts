export const handler = async (
  event: any
) => {
  try {
    console.log('SoftUni Function called 2', event);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'SoftUni Function called 2',
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};