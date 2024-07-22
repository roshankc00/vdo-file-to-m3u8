## Overview 
- The only goal is to save user bandwidth so that our lms lecture vdos dont get lag lets discuss how it works 
- When the someone upload the media file in my temporary bucket it have a  Event notifications setup so it push the job to in  SQS queue (in my case you can use lamda function too)
- and i have a that sqs consumer listening to that queue 
- when the sqsqueue recieves the message then it spin up this docker container task dyamically on ecs 
- my efficiency cost looking all that i have tendency to manupulate the 5 lectures at one time  

## what this service does

- it basically downloads the media file from the temporary bucket 
- it convert thhe downloaded media file to m3u8 with 1080p 720p 420p 320p and removes the downloaded file from local
- finally it upload that m3u8 vdo file to my production bucket
- remove the media from that temporary bucket 
- And update the lecture status
-  if it fails then (no deadletter queue) it just pushes another job to notification queue that lecture upload failed
