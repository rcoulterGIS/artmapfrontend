# NYC Subway Art Explorer Frontend
This project is the frontend for the NYC Subway Art Explorer, a web application that visualizes artwork installations in New York City subway stations.

This application runs using the [NYC Transit Art Explorer Backend](https://github.com/rcoulterGIS/artmapbackend). The backend can be deployed locally for testing purposes. See the repository for details. 

## Project Structure
frontend/
├── .env
├── .gitignore
├── babel.config.js
├── README.md
├── package.json
├── package-lock.json
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── App.js
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── reportWebVitals.js
│   └── setupTests.js
└── .github/workflows
    └── frontend-cli.yaml


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
### `REACT_API_APP_URL=http://localhost:3000`

## Start the application locally.
### `npm start`

## Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Launches the test runner in the interactive watch mode.\
### `npm test`

See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

