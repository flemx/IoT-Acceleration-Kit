#!/bin/bash

sfdx force:source:deploy   -p force-app/main/default/ 
sfdx force:user:permset:assign -n streaming_IoT_component