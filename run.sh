#!/bin/bash

# Script to run the Terraforming Mars Scorekeeper API

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_PATH="$SCRIPT_DIR/backend"

echo -e "\033[32mStarting Terraforming Mars Scorekeeper API...\033[0m"
echo -e "\033[36mNavigate to http://localhost:8000/docs for API documentation\033[0m"

cd "$BACKEND_PATH"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
