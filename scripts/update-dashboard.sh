#!/bin/bash

if [ $1 ]; 
then
	dashboardRoot=$1
else
	dashboardRoot=$(echo ../mission-control-dashboard)
fi

if [ -f "package.json" ]; 
then
	echo "Using dashboard Root: $dashboardRoot"
	echo ""
	projectRoot=$(pwd)

	cp -r $dashboardRoot/dist/production/. $projectRoot/resources/dashboard-ui/

	echo "Copied $dashboardRoot/dist/production to $projectRoot/resources/dashboard-ui"

	cd $dashboardRoot
	commitHash=$(git rev-parse --short HEAD)

	echo "UI is now at commit $commitHash"
	echo $commitHash > $projectRoot/resources/dashboard-ui/commit.txt
else
	echo "This script needs to be called from the mission-control project root"
fi

# 