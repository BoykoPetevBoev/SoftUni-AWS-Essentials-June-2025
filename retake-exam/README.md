# Retake Exam

Your friend Lydia wants a simple website that shows a random cat picture from the internet and allows it to be saved as a favorite. Every time the user clicks the "Save cat" button, this cat is saved in the system, and Lydia gets a message that she has a new favorite cat. Up to this point, she has done quite a bit of work, but she needs your help to finish her idea. 

She has prepared a basic local HTML site that she started but hasn't completed. She needs a few more lines of code and needs to upload it somewhere on the internet. So far, she has managed to make the website load a cat through a public API (Cat as a Service https://cataas.com) when the user loads the site. The user sees the image, and if they like it, they can click the button (in her HTML) to save it. When the button is clicked, the image link and the cat's identifier must be sent somewhere in the cloud. 

In the documentation of Cat as a Service (https://cataas.com/doc.html) under the /cat section, there is an option to try their API. 

Once the save is done, Lydia wants to receive a message that she has a new favorite cat and get the link to the image. 

She has heard from Nasco that Single Table Design can be used. She wants to always have exactly one favorite picture. That is, when a new one is selected, the previous favorite should no longer be considered as such. 

The solution must be implemented with AWS resources and described using CDK in TypeScript. The emails must be actually sent, so you can use your own email for testing. She has also heard about CORS settings for communication between the site and the backend. A working configuration is provided. 

Lydia wants the project in a public GitHub Repository, which should also contain a meaningful and working CI/CD Pipeline that ensures the quality of the code after it is uploaded. 

This repository should include a snapshot test of the stack. 

She will appreciate as many meaningful logs as possible, where necessary, to facilitate debugging in the future. She plans to expand the project and will be very happy if reusable constructs are used that can be easily reused in the future.

## Existing code so far:
```
defaultCorsPreflightOptions: {

allowOrigins: apigateway.Cors.ALL_ORIGINS,

allowMethods: apigateway.Cors.ALL_METHODS,

}

<!DOCTYPE html>

<html>


<body>

<img id="catImg" src="" width="300"/>


<br><br>


<button id="saveCat">Save cat</button>


<script>


let savedUrl = '';

let catId = '';

const fetchCat = async () => {

const res = await fetch("<https://cataas.com/cat?json=true>");

const data = await res.json();


catId = data.id;

savedUrl = `https://cataas.com/cat/${data.id}`;


document.getElementById("catImg").src = savedUrl;

};


fetchCat();


document.getElementById("saveCat").onclick = async () => {

const result = await fetch("<https://z3ho6bh4q7.execute-api.eu-central-1.amazonaws.com/prod/saveCat>", {

method: 'POST',

headers: {

"Content-Type": "application/json"

},

body: JSON.stringify({catId, savedUrl})

});

const data = await result.json();

};

</script>

</body>


</html>
```

## Document your project as follows:

### 1. Architecture: Describe the architecture in detail and explain why you chose those particular services.

### 2. Create an architectural diagram that describes the connections between services and resources. Also, provide alternative ways to implement the project (it’s not necessary to implement them, she just wants to know if there are other options).

![Architecture Diagram](template.png)

### 3. Calculate the monthly cost for the services (excluding the free tier) under the following conditions:

· Region: eu-central-1

· 3,000,000 JSON objects are sent per month.

### 4. Implementation Documentation:

· Describe the steps for building the infrastructure.

· Document any errors encountered and their solutions.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
