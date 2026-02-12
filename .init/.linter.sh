#!/bin/bash
cd /home/kavia/workspace/code-generation/task-management-interface-218141-218155/task_management_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

