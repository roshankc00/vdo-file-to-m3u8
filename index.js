const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

const { exec } = require("child_process");
// Initialize AWS SDK
const s3 = new AWS.S3({
  region: "", // Replace with your AWS region
  credentials: {
    accessKeyId: "", // Replace with your AWS access key ID
    secretAccessKey: "", // Replace with your AWS secret access key
  },
});

// Configuration
const bucketName = ""; // Replace with your S3 bucket name
const localDownloadPath = "./downloads"; // Local directory where files will be downloaded

const localOutputPath = "./output";

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

  // Download the object from S3 to local filesystem
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

    // Cleanup: Remove partially downloaded file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log(`Removed partially downloaded file: ${localFilePath}`);
    }
  }
}

function convertToHLS(inputFilePath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(localOutputPath, "output.m3u8");
    const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${localOutputPath}/segment%03d.ts" -start_number 0 "${outputPath}"`;

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ffmpeg: ${error}`);
        reject(error);
      } else {
        console.log(`ffmpeg stdout: ${stdout}`);
        console.error(`ffmpeg stderr: ${stderr}`);
        console.log("File converted to HLS successfully.");
        resolve(outputPath);
      }
    });
  });
}

async function processVideo(objectKey) {
  try {
    await downloadFile(objectKey);
    const localFilePath = path.join(localDownloadPath, `${objectKey}`);
    await convertToHLS(localFilePath);
  } catch (err) {
    console.error("Error processing video:", err);
  }
}

const objectKey = "";
processVideo(objectKey);
