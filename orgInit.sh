#!/bin/bash

sfdx force:auth:web:login -s 
sfdx force:source:deploy   -p force-app/main/default/ 
