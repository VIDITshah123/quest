#!/bin/bash

# Check if an application name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <application_name>"
  exit 1
fi

APP_NAME=$1
DB_NAME="$APP_NAME.db"
FRONTEND_PORT=3011
BACKEND_PORT=5011

# 1. Copy application files to a new folder
echo "Copying application files to $APP_NAME..."
rsync -av --exclude='node_modules' --exclude='venv' --exclude="$APP_NAME" . "../$APP_NAME/"
cd "../$APP_NAME"

# 2. Rename database file
echo "Renaming database file to $DB_NAME..."
mv db/questionbank.db "db/$DB_NAME"

# 3. Rename references to the database file
echo "Updating database references..."
grep -rl "questionbank.db" . | xargs sed -i "" "s/questionbank.db/$DB_NAME/g"

# 4. Set frontend and backend ports
echo "Updating port numbers..."
# Update backend port in backend/app.js
sed -i "" "s/5000/$BACKEND_PORT/g" backend/app.js

# Update proxy in frontend/package.json
sed -i "" "s/5000/$BACKEND_PORT/g" frontend/package.json

# Update frontend start script in package.json to set the port
sed -i "" "s/"start": "react-scripts start"/"start": "PORT=$FRONTEND_PORT react-scripts start"/" frontend/package.json


# 5. Run npm install in frontend, backend, and root folders
echo "Installing dependencies..."
npm install
(cd backend && npm install)
(cd frontend && npm install)

# 6. Run npm start
echo "Starting the application..."
npm start 
