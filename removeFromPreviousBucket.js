const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS__ACCESS_KEY,
  },
});

async function deleteVideoFromS3(bucketName, objectKey) {
  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Deleted video ${objectKey} from bucket ${bucketName}`);
  } catch (err) {
    console.error(
      `Error deleting video ${objectKey} from bucket ${bucketName}:`,
      err,
    );
    throw err; // Throw the error so the caller can handle it
  }
}

// Example usage:
const bucketName = process.env.AWS_DOWNLOAD_S3_BUCKET_NAME;
const objectKey = process.env.S3_OBJECT_KEY;

deleteVideoFromS3(bucketName, objectKey)
  .then(() => {
    console.log("Video deleted successfully.");
  })
  .catch((err) => {
    console.error("Failed to delete video:", err);
  });
