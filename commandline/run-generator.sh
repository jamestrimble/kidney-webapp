#!/bin/bash

node combined-kidney.js 100 10000 > outdegrees.txt
for i in $(seq 1 99); do
  node combined-kidney.js 100 10000 >> outdegrees.txt
done
