# NYC Subway Art Explorer Frontend
This project is the frontend for the [NYC Subway Art Explorer](https://transitartmap.netlify.app/), a web application that visualizes artwork installations in New York City subway stations.

This application runs using the [NYC Transit Art Explorer Backend](https://github.com/rcoulterGIS/artmapbackend). The backend can be deployed locally for testing purposes. See the repository for details. 

# Setup

## Prerequisites
Node.js (v14 or later recommended)

## Clone the repository and navigate to the frontend directory:
### `cd frontend`

## Install Dependencies:
### `npm install`


## After cloning to your local repository, create a .env file. This is required to launch the frontend.
### `touch .env`

## Set the environment variable to the local port that will be serving the application. 
### `REACT_API_APP_URL=http://localhost:8000`

## Start the application locally.
### `npm start`

## Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

## Launches the test runner in the interactive watch mode.
### `npm test`

## CI/CD
The production frontend of the application [https://transitartmap.netlify.app/](https://transitartmap.netlify.app/) is continuously integrated and deployed via Github Actions. Upon git push app.test.js is automatically run in a test environment hosted by Github. Upon successful completion of the tests, a pull request is generated from the netlify branch to trigger a build in [Netlify](https://www.netlify.com/), the Node.js cloud hosting platform selected for this project. For more information about GitHub Actions, click [here](https://github.com/features/actions), and for integrating Netlify deployments with your CI/CD pipelines, click [here](https://www.netlify.com/platform/core/build/).