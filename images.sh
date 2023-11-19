#!/bin/bash

echo ""
echo "Fetching zximage container repository contents..."
doctl registry repository list-tags zximage

echo ""
echo "Please enter the manifest digest of the image you want to delete:"
read digest

if [[ -z "$digest" ]]; then
    echo "You didn't provide a manifest digest. Exiting."
    exit 1
fi

doctl registry repository delete-manifest zximage $digest

echo ""
echo "Container repository now contains:"
doctl registry repository list-tags zximage

echo ""
echo "Staring garbage collection"
doctl registry garbage-collection start
