#!/bin/bash

# Script to run the Terraforming Mars Scorekeeper API

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_PATH="$SCRIPT_DIR/backend"

# Prefer `venv` (created by this script earlier), fall back to `.venv`.
if [ -d "$SCRIPT_DIR/venv" ]; then
    VENV_PATH="$SCRIPT_DIR/venv"
elif [ -d "$SCRIPT_DIR/.venv" ]; then
    VENV_PATH="$SCRIPT_DIR/.venv"
else
    echo -e "\033[31mError: No virtual environment found. Expected 'venv' or '.venv' in $SCRIPT_DIR\033[0m"
    echo -e "\033[33mCreate one with: python3 -m venv venv\033[0m"
    exit 1
fi

# Activate virtual environment
ACTIVATE_SCRIPT="$VENV_PATH/bin/activate"

if [ ! -f "$ACTIVATE_SCRIPT" ]; then
    echo -e "\033[31mError: Activate script not found at $ACTIVATE_SCRIPT\033[0m"
    exit 1
fi

echo -e "\033[33mActivating virtual environment...\033[0m"
source "$ACTIVATE_SCRIPT"

echo -e "\033[32mStarting Terraforming Mars Scorekeeper API...\033[0m"
echo -e "\033[36mNavigate to http://localhost:8000/docs for API documentation\033[0m"
echo ""

cd "$BACKEND_PATH"
uvicorn main:app --reload --host 0.0.0.0 --port 8000