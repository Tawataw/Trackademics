#!/bin/bash
sed -i '/id: "hstu_b"/,/helpers.group/ s/\["SCIENCE", "HUMANITIES", "COMMERCE", "ARTS"\]/\["SCIENCE"\]/' src/engine/admission.ts
