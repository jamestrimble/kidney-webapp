#!/bin/bash

for i in $(seq 0 99); do
  echo $i \
    $(cat outdegrees.txt | grep "^$i$" | wc -l) \
    $(cat david-abraham-generator-results.txt | grep "^$i$" | wc -l) \
    $(cat original-david-abraham-generator-results.txt | grep "^$i$" | wc -l)
done
