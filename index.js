const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS__ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_DOWNLOAD_S3_BUCKET_NAME;
const localDownloadPath = "./downloads";
async function checkIfKeyExists(bucket, key) {
  try {
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return true;
  } catch (error) {
    if (error.code === "NotFound") {
      return false;
    }
    throw error;
  }
}

async function downloadFile(objectKey) {
  console.log(
    `Checking if key "${objectKey}" exists in bucket "${bucketName}"...`,
  );

  const keyExists = await checkIfKeyExists(bucketName, objectKey);

  if (!keyExists) {
    console.log(`Key "${objectKey}" does not exist in bucket "${bucketName}".`);
    return;
  }

  const localFilePath = path.join(localDownloadPath, `${objectKey}`); // Local file path to save the downloaded file

  // Ensure the directory exists locally
  const localDir = path.dirname(localFilePath);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  const downloadParams = {
    Bucket: bucketName,
    Key: objectKey,
  };

  const fileStream = fs.createWriteStream(localFilePath);

  try {
    await new Promise((resolve, reject) => {
      s3.getObject(downloadParams)
        .createReadStream()
        .on("error", (error) => {
          reject(error);
        })
        .pipe(fileStream)
        .on("finish", () => {
          console.log(`Downloaded: ${objectKey} => ${localFilePath}`);
          resolve();
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    console.log("File downloaded successfully.");
  } catch (err) {
    console.error("Error:", err);
  }
}

const objectKey = process.env.S3_OBJECT_KEY;
downloadFile(objectKey);
